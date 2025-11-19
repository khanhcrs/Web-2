import React, { createContext, useCallback, useEffect, useState } from 'react'
import fallbackProducts from '../Components/assests/all_product'
import { API_BASE_URL, resolveImageUrl } from '../config'

export const ShopContext = createContext(null)

const ShopContextProvider = (props) => {
  const [products, setProducts] = useState(fallbackProducts)
  const [cartItems, setCartItems] = useState({})
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [error, setError] = useState('')

  const [userName, setUserName] = useState(localStorage.getItem('user_name'));


  const fetchProducts = useCallback(async () => {
    setLoadingProducts(true)
    try {
      const response = await fetch(`${API_BASE_URL}/allproducts`)
      if (!response.ok) throw new Error('Không thể tải danh sách sản phẩm.')
      const data = await response.json()
      if (Array.isArray(data) && data.length > 0) {
        const normalizedProducts = data.map((product) => ({
          ...product,
          image: resolveImageUrl(product.image)
        }))
        setProducts(normalizedProducts)
        setError('')
      } else {
        setProducts(fallbackProducts)
        setError('Không có sản phẩm từ máy chủ, sử dụng dữ liệu mặc định.')
      }
    } catch (err) {
      console.error('Không thể tải sản phẩm', err)
      setProducts(fallbackProducts)
      setError('Không thể tải sản phẩm mới, sử dụng dữ liệu cục bộ.')
    } finally {
      setLoadingProducts(false)
    }
  }, [])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  const addToCart = (itemId, quantity = 1) => {
    const normalizedQuantity = Number.isFinite(quantity) ? quantity : 1
    setCartItems((prev) => {
      if (!(itemId in prev)) return prev
      const nextValue = Math.max(prev[itemId] + normalizedQuantity, 0)
      return { ...prev, [itemId]: nextValue }
    })
  }

  // Xóa theo size
  const removeFromCart = (itemId, size) => {
    const key = `${itemId}-${size}`
    setCartItems((prev) => {
      if (!(key in prev)) return prev
      const nextValue = Math.max(prev[key] - 1, 0)
      return { ...prev, [key]: nextValue }
    })
  }

  const setCartItemQuantity = (itemId, quantity) => {
    const normalizedQuantity = Number.isFinite(quantity) ? quantity : 0
    setCartItems((prev) => {
      if (!(itemId in prev)) return prev
      const nextValue = Math.max(normalizedQuantity, 0)
      return { ...prev, [itemId]: nextValue }
    })
  }

  const getTotalCartAmount = () => {
    let totalAmount = 0
    for (const key in cartItems) {
      const quantity = cartItems[key]
      if (quantity > 0) {
        const [id] = key.split('-')
        const itemInfo = products.find((product) => product.id === Number(id))
        if (itemInfo) {
          totalAmount += itemInfo.new_price * quantity
        }
      }
    }
    return totalAmount
  }

  // Tổng số sản phẩm trong giỏ hàng
  const getTotalCartItems = () => {
    let totalItem = 0
    for (const key in cartItems) {
      totalItem += cartItems[key]
    }
    return totalItem
  }

  const clearCart = useCallback(() => {
    setCartItems(buildCartFromProducts(products))
  }, [products])

  const contextValue = {
    getTotalCartItems,
    getTotalCartAmount,
    products,
    cartItems,
    addToCart,
    removeFromCart,
    setCartItemQuantity,
    loadingProducts,
    productError: error,
    refreshProducts: fetchProducts,
    clearCart
  }

  return (
    <ShopContext.Provider value={contextValue}>
      {props.children}
    </ShopContext.Provider>
  )
}

export default ShopContextProvider
