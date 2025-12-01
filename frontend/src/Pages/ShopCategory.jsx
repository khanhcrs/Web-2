import React, { useContext, useMemo, useState } from 'react'
import './CSS/ShopCategory.css'
import { ShopContext } from '../Context/ShopContext'
import Item from '../Components/Item/Item'

const ShopCategory = (props) => {
  const { products, loadingProducts, searchTerm } = useContext(ShopContext)
  const [sortType, setSortType] = useState('default') // default | price-asc | price-desc

  // Danh sách sản phẩm đã lọc + sắp xếp
  const filteredProducts = useMemo(() => {
    let list = Array.isArray(products) ? [...products] : []

    // Lọc theo category nếu có
    if (props.category) {
      list = list.filter((p) => p.category === props.category)
    }

    // Lọc theo từ khoá tìm kiếm
    if (searchTerm && searchTerm.trim() !== '') {
      const keyword = searchTerm.toLowerCase()
      list = list.filter((p) =>
        String(p.name || '').toLowerCase().includes(keyword)
      )
    }

    // Sắp xếp theo loại
    if (sortType === 'price-asc') {
      list.sort(
        (a, b) => Number(a.new_price || 0) - Number(b.new_price || 0)
      )
    } else if (sortType === 'price-desc') {
      list.sort(
        (a, b) => Number(b.new_price || 0) - Number(a.new_price || 0)
      )
    }

    return list
  }, [products, props.category, searchTerm, sortType])

  return (
    <div className='shop-category'>
      {/* Banner danh mục */}
      {props.banner && (
        <img src={props.banner} alt='' className='shopcategory-banner' />
      )}

      {/* Thanh trên: số lượng & bộ lọc sắp xếp */}
      <div className='shopcategory-indexSort'>
        <p>
          <span>Đang hiển thị {filteredProducts.length}</span> sản phẩm trong
          danh mục
        </p>

        <div className='shopcategory-controls'>
          <div className='shopcategory-sort'>
            <span className='shopcategory-sort-label'>Sắp xếp theo:</span>
            <select
              className='sort-dropdown'
              value={sortType}
              onChange={(e) => setSortType(e.target.value)}
            >
              <option value='default'>Mặc định</option>
              <option value='price-asc'>Giá tăng dần</option>
              <option value='price-desc'>Giá giảm dần</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid sản phẩm */}
      <div className='shopcategory-products'>
        {loadingProducts && (
          <p className='shopcategory-empty'>Đang tải sản phẩm...</p>
        )}

        {!loadingProducts &&
          filteredProducts.map((item) => (
            <Item
              key={item.id}
              id={item.id}
              name={item.name}
              image={item.image}
              new_price={item.new_price}
              old_price={item.old_price}
            />
          ))}

        {!loadingProducts && filteredProducts.length === 0 && (
          <p className='shopcategory-empty'>
            Không có sản phẩm nào phù hợp.
          </p>
        )}
      </div>

      <div className='shopcategory-loadmore'>Xem thêm</div>
    </div>
  )
}

export default ShopCategory
