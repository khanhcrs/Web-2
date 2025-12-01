import React from 'react'
import './Admin.css'
import Sidebar from '../../Components/Sidebar/Sidebar'
import { Routes, Route } from 'react-router-dom'
import AddProduct from '../../Components/AddProduct/AddProduct'
import ListProduct from '../../Components/ListProduct/ListProduct'
import OrderManagement from '../../Components/OrderManagement/OrderManagement'
import Dashboard from '../../Components/Dashboard/Dashboard'
import CustomerManagement from '../../Components/CustomerManagement/CustomerManagement'

const Admin = () => {
  return (
    <div className='admin'>
      <Sidebar />
      <Routes>
        <Route path='/' element={<Dashboard />} />
        <Route index element={<Dashboard />} />
        <Route path='/addproduct' element={<AddProduct />} />
        <Route path='/listproduct' element={<ListProduct />} />
        <Route path='/ordermanagement' element={<OrderManagement />} />
        <Route path='/customermanagement' element={<CustomerManagement />} />
        <Route path='*' element={<Dashboard />} />
      </Routes>
    </div>
  )
}

export default Admin
