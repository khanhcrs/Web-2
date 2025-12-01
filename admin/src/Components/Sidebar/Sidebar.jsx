import React from 'react'
import './Sidebar.css'
import { Link } from 'react-router-dom'
import add_product_icon from '../../assets/Product_Cart.svg'
import list_product_icon from '../../assets/Product_list_icon.svg'
import db_icon from '../../assets/db_icon.png'

export const Sidebar = () => {
  return (
    <div className='sidebar'>
      <Link to={'/'} style={{ textDecoration: 'none' }}>
        <div className='sidebar-item'>
          <img src={db_icon} alt='' />
          <p>Dashboard</p>
        </div>
      </Link>
      <Link to={'/addproduct'} style={{ textDecoration: 'none' }}>
        <div className='sidebar-item'>
          <img src={add_product_icon} alt='' />
          <p>Add Product</p>
        </div>
      </Link>
      <Link to={'/listproduct'} style={{ textDecoration: 'none' }}>
        <div className='sidebar-item'>
          <img src={list_product_icon} alt='' />
          <p>Product List</p>
        </div>
      </Link>
      <Link to={'/ordermanagement'} style={{ textDecoration: 'none' }}>
        <div className='sidebar-item'>
          <img src={list_product_icon} alt='' />
          <p>Orders &amp; Customers</p>
        </div>
      </Link>
    </div>
  )
}
export default Sidebar
