import React, { useContext, useState } from 'react'
import './ProductDisplay.css'
import star_icon from '../assests/star_icon.png'
import star_dull_icon from '../assests/star_dull_icon.png'
import { ShopContext } from '../../Context/ShopContext'
import { resolveImageUrl } from '../../config'

const SIZES = ["S", "M", "L", "XL", "XXL"];

const ProductDisplay = (props) => {
    const { product } = props;
    const { addToCart } = useContext(ShopContext);
    const productImage = resolveImageUrl(product?.image);
    const [selectedSize, setSelectedSize] = useState(null);

    if (!product) return null;

    const handleAddToCart = () => {
        if (!selectedSize) {
            alert("Vui lòng chọn size trước khi thêm vào giỏ hàng!");
            return;
        }
        addToCart(product.id, selectedSize);
    };

    return (
        <div className='productdisplay'>
            <div className="productdisplay-left">
                <div className="productdisplay-img-list">
                    <img src={productImage} alt="" />
                    <img src={productImage} alt="" />
                    <img src={productImage} alt="" />
                    <img src={productImage} alt="" />
                </div>
                <div className="prodcutdisplay-img">
                    <img className='prodcutdisplay-main-img' src={productImage} alt="" />
                </div>
            </div>
            <div className="productdisplay-right">
                <h1>{product.name}</h1>
                <div className="productdisplay-right-star">
                    <img src={star_icon} alt="" />
                    <img src={star_icon} alt="" />
                    <img src={star_icon} alt="" />
                    <img src={star_icon} alt="" />
                    <img src={star_dull_icon} alt="" />
                    <p>(122)</p>
                </div>
                <div className="productdisplay-right-prices">
                    <div className="productdisplay-right-price-old">{product.old_price}đ</div>
                    <div className="productdisplay-right-price-new">{product.new_price}đ</div>
                </div>
                <div className="productdisplay-right-size">
                    <h1>Select Size</h1>
                    <div className="productdisplay-right-sizes">
                        {SIZES.map(size => (
                            <div
                                key={size}
                                className={`size-option${selectedSize === size ? ' selected' : ''}`}
                                onClick={() => setSelectedSize(size)}
                                tabIndex={0}
                            >
                                {size}
                            </div>
                        ))}
                    </div>
                </div>
                <button onClick={handleAddToCart}>ADD TO CART</button>
                <p className="productdisplay-right-category"><span>Category: </span>Women, T-Shirt, Crop Top</p>
                <p className="productdisplay-right-category"><span>Tag: </span>Modern, Latest</p>
            </div>
        </div>
    )
}

export default ProductDisplay
