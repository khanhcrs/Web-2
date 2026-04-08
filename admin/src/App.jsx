import React from 'react'
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import Navbar from './Components/Navbar/Navbar.jsx'
import Admin from './Pages/Admin/Admin.jsx'
import AdminLogin from './Pages/Login/AdminLogin.jsx'
import { clearAdminSession, getAdminSession, isAdminSessionValid } from './lib/adminAuth'

const RequireAdminRoute = ({ children }) => {
  const location = useLocation()

  if (!isAdminSessionValid()) {
    return <Navigate to='../login' relative='path' replace state={{ from: location.pathname }} />
  }

  return children
}

const AdminLayout = () => {
  const navigate = useNavigate()
  const { user } = getAdminSession()

  const handleLogout = () => {
    clearAdminSession()
    navigate('../login', { relative: 'path', replace: true })
  }

  return (
    <div>
      <Navbar user={user} onLogout={handleLogout} />
      <Admin />
    </div>
  )
}

const App = () => {
  return (
    <Routes>
      <Route path='login' element={<AdminLogin />} />
      <Route
        path='*'
        element={
          <RequireAdminRoute>
            <AdminLayout />
          </RequireAdminRoute>
        }
      />
    </Routes>
  )
}

export default App
