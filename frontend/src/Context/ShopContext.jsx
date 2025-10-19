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
      setProducts(fallbackProducts)
      setError('Không thể tải sản phẩm mới, sử dụng dữ liệu cục bộ.')
    } finally {
      setLoadingProducts(false)
    }
  }, [])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  // Thêm sản phẩm với size
  const addToCart = (itemId, size) => {
    if (!size) {
      alert('Vui lòng chọn size trước khi thêm vào giỏ hàng!')
      return
    }
    const key = `${itemId}-${size}`
    setCartItems((prev) => ({ ...prev, [key]: (prev[key] || 0) + 1 }))
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

  // Tổng tiền (tính từng biến thể sản phẩm)
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

  const contextValue = {
    getTotalCartItems,
    getTotalCartAmount,
    products,
    cartItems,
    addToCart,
    removeFromCart,
    loadingProducts,
    productError: error,
    refreshProducts: fetchProducts
  }

  return (
    <ShopContext.Provider value={contextValue}>
      {props.children}
    </ShopContext.Provider>
  )
}

export default ShopContextProvider
