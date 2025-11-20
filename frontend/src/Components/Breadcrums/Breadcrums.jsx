import React from 'react'
import './Breadcrums.css'
import arrow_icon from '../assests/breadcrum_arrow.png'

const Breadcrums = (props) => {

    const { product } = props;

    if (!product) {
        return null;
    }

    return (
        <div className='breadcrums'>
            TRANG CHỦ <img src={arrow_icon} alt="" /> CỬA HÀNG <img src={arrow_icon} alt="" />{product.category} <img src={arrow_icon} alt="" />{product.name}
        </div>
    )
}

export default Breadcrums
