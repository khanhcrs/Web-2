import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import fallbackProducts from '../Components/assests/all_product';
import { resolveImageUrl } from '../config';
import { AuthContext } from './AuthContext';
import { getServerCart, saveServerCart } from '../services/cartService';
import { listProducts } from '../services/productService';

export const ShopContext = createContext(null);

const GUEST_CART_STORAGE_KEY = 'clothify_guest_cart';

const buildCartKey = (itemId, size) => `${itemId}-${size || 'default'}`;

const normalizeCartItems = (value) => {
  if (!value || typeof value !== 'object') {
    return {};
  }

  return Object.entries(value).reduce((nextCart, [key, quantity]) => {
    if (typeof key !== 'string' || key.trim() === '') {
      return nextCart;
    }

    const normalizedQuantity = Number(quantity);
    if (!Number.isFinite(normalizedQuantity) || normalizedQuantity <= 0) {
      return nextCart;
    }

    nextCart[key.trim()] = Math.floor(normalizedQuantity);
    return nextCart;
  }, {});
};

const readGuestCart = () => {
  try {
    const stored = localStorage.getItem(GUEST_CART_STORAGE_KEY);
    if (!stored) {
      return {};
    }

    return normalizeCartItems(JSON.parse(stored));
  } catch (error) {
    console.error('Khong the doc gio hang khach.', error);
    return {};
  }
};

const writeGuestCart = (cartItems) => {
  const normalized = normalizeCartItems(cartItems);

  if (Object.keys(normalized).length === 0) {
    localStorage.removeItem(GUEST_CART_STORAGE_KEY);
    return;
  }

  localStorage.setItem(GUEST_CART_STORAGE_KEY, JSON.stringify(normalized));
};

const mergeCartItems = (baseCart, extraCart) => {
  const merged = { ...normalizeCartItems(baseCart) };

  Object.entries(normalizeCartItems(extraCart)).forEach(([key, quantity]) => {
    merged[key] = (merged[key] || 0) + quantity;
  });

  return merged;
};

const normalizeProducts = (rawProducts) =>
  rawProducts
    .filter((product) => product.status !== 'hidden')
    .map((product) => {
      let rawImages = [];

      if (Array.isArray(product.images)) {
        rawImages = product.images;
      } else if (typeof product.images === 'string') {
        try {
          const parsed = JSON.parse(product.images);
          if (Array.isArray(parsed)) {
            rawImages = parsed;
          }
        } catch (error) {
          rawImages = [];
        }
      }

      const normalizedImages = rawImages
        .map((image) => resolveImageUrl(image))
        .filter(Boolean);

      const primaryImage = resolveImageUrl(product.image);
      const images = normalizedImages.length
        ? normalizedImages
        : primaryImage
          ? [primaryImage]
          : [];

      return {
        ...product,
        images,
        image: images[0] || primaryImage || '',
      };
    });

const ShopContextProvider = ({ children }) => {
  const { isAuthenticated, token, user } = useContext(AuthContext);
  const [products, setProducts] = useState(fallbackProducts);
  const [cartItems, setCartItems] = useState({});
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingCart, setLoadingCart] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const lastSyncedCartRef = useRef(JSON.stringify({}));
  const cartSyncTimeoutRef = useRef(null);

  const fetchProducts = useCallback(async () => {
    setLoadingProducts(true);

    try {
      const data = await listProducts();

      if (Array.isArray(data) && data.length > 0) {
        setProducts(normalizeProducts(data));
        setError('');
      } else {
        setProducts(fallbackProducts);
        setError('Khong co san pham tu may chu, dang hien thi du lieu mac dinh.');
      }
    } catch (fetchError) {
      console.error('Khong the tai san pham', fetchError);
      setProducts(fallbackProducts);
      setError('Khong the tai san pham moi, dang dung du lieu cuc bo.');
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    let ignore = false;

    const hydrateCart = async () => {
      setLoadingCart(true);

      if (!isAuthenticated || !token || !user) {
        const guestCart = readGuestCart();
        if (!ignore) {
          setCartItems(guestCart);
          lastSyncedCartRef.current = JSON.stringify(guestCart);
          setLoadingCart(false);
        }
        return;
      }

      try {
        const guestCart = readGuestCart();
        const serverCart = normalizeCartItems(await getServerCart(token));
        const mergedCart = mergeCartItems(serverCart, guestCart);

        if (Object.keys(guestCart).length > 0) {
          await saveServerCart(token, mergedCart);
          localStorage.removeItem(GUEST_CART_STORAGE_KEY);
        }

        if (!ignore) {
          setCartItems(mergedCart);
          lastSyncedCartRef.current = JSON.stringify(mergedCart);
        }
      } catch (cartError) {
        console.error('Khong the dong bo gio hang tai khoan.', cartError);

        if (!ignore) {
          const fallbackCart = readGuestCart();
          setCartItems(fallbackCart);
          lastSyncedCartRef.current = JSON.stringify(fallbackCart);
        }
      } finally {
        if (!ignore) {
          setLoadingCart(false);
        }
      }
    };

    hydrateCart();

    return () => {
      ignore = true;
    };
  }, [isAuthenticated, token, user]);

  useEffect(() => {
    if (loadingCart) {
      return undefined;
    }

    const normalizedCart = normalizeCartItems(cartItems);
    const cartSnapshot = JSON.stringify(normalizedCart);

    if (!isAuthenticated || !token) {
      writeGuestCart(normalizedCart);
      lastSyncedCartRef.current = cartSnapshot;
      return undefined;
    }

    if (cartSnapshot === lastSyncedCartRef.current) {
      return undefined;
    }

    if (cartSyncTimeoutRef.current) {
      clearTimeout(cartSyncTimeoutRef.current);
    }

    cartSyncTimeoutRef.current = setTimeout(async () => {
      try {
        const syncedCart = normalizeCartItems(await saveServerCart(token, normalizedCart));
        lastSyncedCartRef.current = JSON.stringify(syncedCart);
      } catch (syncError) {
        console.error('Khong the luu gio hang len may chu.', syncError);
      }
    }, 250);

    return () => {
      if (cartSyncTimeoutRef.current) {
        clearTimeout(cartSyncTimeoutRef.current);
      }
    };
  }, [cartItems, isAuthenticated, loadingCart, token]);

  const addToCart = useCallback((itemId, size, quantity = 1) => {
    const normalizedQuantity = Number.isFinite(quantity) ? Math.max(1, Math.floor(quantity)) : 1;
    const key = buildCartKey(itemId, size);

    setCartItems((prev) => ({
      ...prev,
      [key]: (prev[key] || 0) + normalizedQuantity,
    }));
  }, []);

  const removeFromCart = useCallback((itemId, size) => {
    const key = buildCartKey(itemId, size);

    setCartItems((prev) => {
      if (!prev[key]) {
        return prev;
      }

      const nextQuantity = prev[key] - 1;
      const updated = { ...prev };

      if (nextQuantity > 0) {
        updated[key] = nextQuantity;
      } else {
        delete updated[key];
      }

      return updated;
    });
  }, []);

  const setCartItemQuantity = useCallback((itemId, size, quantity) => {
    const normalizedQuantity = Number.isFinite(quantity) ? Math.floor(quantity) : 0;
    const key = buildCartKey(itemId, size);

    setCartItems((prev) => {
      const updated = { ...prev };

      if (normalizedQuantity <= 0) {
        delete updated[key];
      } else {
        updated[key] = normalizedQuantity;
      }

      return updated;
    });
  }, []);

  const getTotalCartAmount = useCallback(() => {
    let totalAmount = 0;

    Object.entries(cartItems).forEach(([key, quantity]) => {
      if (quantity <= 0) {
        return;
      }

      const [id] = key.split('-');
      const itemInfo = products.find((product) => product.id === Number(id));

      if (itemInfo) {
        totalAmount += Number(itemInfo.new_price || 0) * quantity;
      }
    });

    return totalAmount;
  }, [cartItems, products]);

  const getTotalCartItems = useCallback(
    () => Object.values(cartItems).reduce((total, quantity) => total + quantity, 0),
    [cartItems]
  );

  const getCartLineCount = useCallback(
    () => Object.values(cartItems).reduce((total, quantity) => total + (quantity > 0 ? 1 : 0), 0),
    [cartItems]
  );

  const clearCart = useCallback(() => {
    setCartItems({});
  }, []);

  const contextValue = useMemo(
    () => ({
      products,
      cartItems,
      loadingProducts,
      loadingCart,
      productError: error,
      searchTerm,
      setSearchTerm,
      getTotalCartItems,
      getCartLineCount,
      getTotalCartAmount,
      addToCart,
      removeFromCart,
      setCartItemQuantity,
      clearCart,
      refreshProducts: fetchProducts,
    }),
    [
      products,
      cartItems,
      loadingProducts,
      loadingCart,
      error,
      searchTerm,
      fetchProducts,
      addToCart,
      removeFromCart,
      setCartItemQuantity,
      getTotalCartItems,
      getCartLineCount,
      getTotalCartAmount,
      clearCart,
    ]
  );

  return (
    <ShopContext.Provider value={contextValue}>
      {children}
    </ShopContext.Provider>
  );
};

export default ShopContextProvider;
