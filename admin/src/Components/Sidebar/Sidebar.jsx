import React from 'react'
import './Sidebar.css'
import { Link } from 'react-router-dom'
import add_product_icon from '../../assets/Product_Cart.svg'
import list_product_icon from '../../assets/Product_list_icon.svg'
import db_icon from '../../assets/db_icon.png'
import profile_icon from '../../assets/nav-profile.svg'
import price_icon from '../../assets/price_icon.png'
import im_receipt_icon from '../../assets/im_receipt_icon.png'
import inven_report_icon from '../../assets/inven_report_icon.jpg'

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
      <Link to={'/add-receipt'} style={{ textDecoration: 'none' }}>
        <div className='sidebar-item'>
          <img src={im_receipt_icon} alt='' />
          <p>Import Receipt</p>
        </div>
      </Link>
      <Link to={'/pricemanagement'} style={{ textDecoration: 'none' }}>
        <div className='sidebar-item'>
          <img src={price_icon} alt='' />
          <p>Price Management</p>
        </div>
      </Link>
      <Link to={'/inventoryreport'} style={{ textDecoration: 'none' }}>
        <div className='sidebar-item'>
          <img src={inven_report_icon} alt='' />
          <p>Inventory Report</p>
        </div>
      </Link>
      <Link to={'/ordermanagement'} style={{ textDecoration: 'none' }}>
        <div className='sidebar-item'>
          <img src={list_product_icon} alt='' />
          <p>Order Management</p>
        </div>
      </Link>
      <Link to={'/customermanagement'} style={{ textDecoration: 'none' }}>
        <div className='sidebar-item'>
          <img src={profile_icon} alt='' />
          <p>Customer Management</p>
        </div>
      </Link>
    </div>
  )
}
export default Sidebar