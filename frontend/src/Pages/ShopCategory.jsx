import React, { useContext, useState } from 'react'
import './CSS/ShopCategory.css'
import { ShopContext } from '../Context/ShopContext'
import dropdown_icon from '../Components/assests/dropdown_icon.png'
import Item from '../Components/Item/Item'

const ShopCategory = (props) => {
    const { products, loadingProducts } = useContext(ShopContext)
    const [sortType, setSortType] = useState('default')
    const [searchTerm, setSearchTerm] = useState('')

    // Lọc theo category và search term (tìm theo tên sản phẩm, không phân biệt hoa thường)
    const filteredProducts = products.filter(
        (item) =>
            item.category === props.category &&
            item.name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    // Sắp xếp sản phẩm sau khi lọc
    const sortedProducts = [...filteredProducts]
    if (sortType === 'priceLowToHigh') {
        sortedProducts.sort((a, b) => a.new_price - b.new_price)
    } else if (sortType === 'priceHighToLow') {
        sortedProducts.sort((a, b) => b.new_price - a.new_price)
    }

    return (
        <div className='shop-category'>
            <img src={props.banner} alt='' />
            {/* Input tìm kiếm */}
            <input
                type="text"
                className="shopcategory-search"
                placeholder="Tìm kiếm sản phẩm..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className='shopcategory-indexSort'>
                <p>
                    <span>Showing {sortedProducts.length}</span> sản phẩm trong danh mục
                </p>
                <div className='shopcategory-sort'>
                    <select
                        value={sortType}
                        onChange={(e) => setSortType(e.target.value)}
                        className="sort-dropdown"
                    >
                        <option value="default">Mặc định</option>
                        <option value="priceLowToHigh">Giá thấp đến cao</option>
                        <option value="priceHighToLow">Giá cao đến thấp</option>
                    </select>
                    {/* <img src={dropdown_icon} alt='' /> */}
                </div>
            </div>
            <div className='shopcategory-products'>
                {loadingProducts && <p className='shopcategory-empty'>Đang tải sản phẩm...</p>}
                {!loadingProducts &&
                    sortedProducts.map((item) => (
                        <Item
                            key={item.id}
                            id={item.id}
                            name={item.name}
                            image={item.image}
                            new_price={item.new_price}
                            old_price={item.old_price}
                        />
                    ))}
                {!loadingProducts && sortedProducts.length === 0 && (
                    <p className='shopcategory-empty'>Không có sản phẩm nào phù hợp.</p>
                )}
            </div>
            <div className='shopcategory-loadmore'>More</div>
        </div>
    )
}

export default ShopCategory
