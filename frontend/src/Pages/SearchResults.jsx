import React, { useContext, useEffect, useMemo, useState } from 'react'
import './CSS/ShopCategory.css'
import { useLocation } from 'react-router-dom'
import Item from '../Components/Item/Item'
import { ShopContext } from '../Context/ShopContext'

const SearchResults = () => {
  const { products, loadingProducts, searchTerm, setSearchTerm } = useContext(ShopContext)
  const location = useLocation()

  const [sortType, setSortType] = useState('default')
  const [priceRange, setPriceRange] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const productsPerPage = 10

  const priceFilters = [
    { value: 'all', label: 'Tất cả' },
    { value: 'under-200', label: 'Dưới 200.000đ' },
    { value: '200-400', label: '200.000đ - 400.000đ' },
    { value: '400-600', label: '400.000đ - 600.000đ' },
    { value: '600-plus', label: 'Trên 600.000đ' },
  ]

  // ============ PHẦN SỬA LỖI Ở ĐÂY ============
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const query = params.get('query')

    // Chỉ cập nhật nếu trên URL thực sự có query và nó KHÁC với cái hiện tại
    // Quan trọng: Bỏ dependency [searchTerm] đi để tránh vòng lặp vô tận khi gõ
    if (query !== null && query !== searchTerm) {
      setSearchTerm(query)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search, setSearchTerm])
  // ============================================

  // Reset về trang 1 khi thay đổi bộ lọc
  useEffect(() => {
    setCurrentPage(1)
  }, [sortType, priceRange, searchTerm]) // searchTerm thay đổi (khi bấm tìm kiếm) thì reset trang

  const filteredProducts = useMemo(() => {
    let list = Array.isArray(products) ? [...products] : []

    // Lấy keyword từ searchTerm (state) để lọc realtime
    // Hoặc nếu bạn muốn chặt chẽ hơn: Lấy từ URL params
    const keyword = searchTerm.trim().toLowerCase()

    if (!keyword) return []

    // Lọc theo từ khóa
    list = list.filter((p) => String(p.name || '').toLowerCase().includes(keyword))

    list = list.filter((p) => {
      const price = Number(p.new_price || 0)
      switch (priceRange) {
        case 'under-200': return price < 200000
        case '200-400': return price >= 200000 && price < 400000
        case '400-600': return price >= 400000 && price < 600000
        case '600-plus': return price >= 600000
        default: return true
      }
    })

    if (sortType === 'price-asc') {
      list.sort((a, b) => Number(a.new_price || 0) - Number(b.new_price || 0))
    } else if (sortType === 'price-desc') {
      list.sort((a, b) => Number(b.new_price || 0) - Number(a.new_price || 0))
    }

    return list
  }, [products, searchTerm, sortType, priceRange])

  // Pagination Logic
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / productsPerPage))
  const startIndex = (currentPage - 1) * productsPerPage
  const displayedProducts = filteredProducts.slice(startIndex, startIndex + productsPerPage)

  const goToPage = (page) => {
    const nextPage = Math.min(Math.max(page, 1), totalPages)
    setCurrentPage(nextPage)
    window.scrollTo(0, 0)
  }

  return (
    <div className='shop-category'>
      <div className='shopcategory-layout'>
        <aside className='shopcategory-sidebar'>
          <div className='sidebar-section'>
            <h3>Lọc theo giá</h3>
            <div className='sidebar-options'>
              {priceFilters.map((option) => (
                <label key={option.value} className='sidebar-option'>
                  <input
                    type='radio'
                    name='price-filter'
                    value={option.value}
                    checked={priceRange === option.value}
                    onChange={(e) => setPriceRange(e.target.value)}
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          </div>
          <div className='sidebar-summary'>
            <p><strong>{filteredProducts.length}</strong> kết quả</p>
          </div>
        </aside>

        <div className='shopcategory-main'>
          <div className='shopcategory-indexSort'>
            <p>
              {searchTerm.trim() ? (
                <>Kết quả tìm kiếm cho <strong>"{searchTerm}"</strong></>
              ) : (
                <span>Nhập từ khóa để tìm kiếm...</span>
              )}
            </p>
            <div className='shopcategory-controls'>
              <select className='sort-dropdown' value={sortType} onChange={(e) => setSortType(e.target.value)}>
                <option value='default'>Mặc định</option>
                <option value='price-asc'>Giá tăng dần</option>
                <option value='price-desc'>Giá giảm dần</option>
              </select>
            </div>
          </div>

          <div className='shopcategory-products'>
            {loadingProducts && <p>Đang tải...</p>}
            {!loadingProducts && displayedProducts.map((item) => (
              <Item key={item.id} {...item} />
            ))}
            {!loadingProducts && filteredProducts.length === 0 && (
              <p>Không tìm thấy sản phẩm nào.</p>
            )}
          </div>

          {filteredProducts.length > 0 && (
            <div className='shopcategory-pagination'>
              <button disabled={currentPage === 1} onClick={() => goToPage(currentPage - 1)}>Trước</button>
              <div className='pagination-pages'>
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i + 1}
                    className={currentPage === i + 1 ? 'active' : ''}
                    onClick={() => goToPage(i + 1)}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              <button disabled={currentPage === totalPages} onClick={() => goToPage(currentPage + 1)}>Sau</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SearchResults