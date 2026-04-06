import React, { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { API_BASE_URL } from '../../config'
import { clearAdminSession, isAdminSessionValid, saveAdminSession } from '../../lib/adminAuth'
import './AdminLogin.css'

const decodeUserParam = (rawUser) => {
  if (!rawUser) {
    return null
  }

  try {
    return JSON.parse(decodeURIComponent(rawUser))
  } catch (error) {
    return null
  }
}

const AdminLogin = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const redirectTarget = useMemo(() => {
    if (location.state?.from && typeof location.state.from === 'string') {
      return location.state.from
    }
    return '/'
  }, [location.state])

  useEffect(() => {
    if (isAdminSessionValid()) {
      navigate(redirectTarget, { replace: true })
      return
    }

    const search = new URLSearchParams(location.search)
    const token = search.get('token')
    const user = decodeUserParam(search.get('user'))

    if (token && user?.role === 'admin') {
      saveAdminSession(token, user)
      navigate(redirectTarget, { replace: true })
    }
  }, [location.search, navigate, redirectTarget])

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(form)
      })

      const data = await response.json()
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Dang nhap that bai.')
      }

      if (data.user?.role !== 'admin') {
        clearAdminSession()
        throw new Error('Tai khoan nay khong co quyen vao trang admin.')
      }

      saveAdminSession(data.token, data.user)
      navigate(redirectTarget, { replace: true })
    } catch (submitError) {
      setError(submitError.message || 'Dang nhap that bai.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='admin-login-page'>
      <div className='admin-login-card'>
        <p className='admin-login-eyebrow'>Clothify Admin</p>
        <h1>Dang nhap quan tri</h1>
        <p className='admin-login-subtitle'>Nhap tai khoan admin de truy cap dashboard, kho, gia va don hang.</p>

        <form className='admin-login-form' onSubmit={handleSubmit}>
          <label>
            Email
            <input
              type='email'
              name='email'
              value={form.email}
              onChange={handleChange}
              placeholder='admin@clothify.com'
              required
            />
          </label>

          <label>
            Mat khau
            <input
              type='password'
              name='password'
              value={form.password}
              onChange={handleChange}
              placeholder='Nhap mat khau'
              required
            />
          </label>

          {error && <p className='admin-login-error'>{error}</p>}

          <button type='submit' disabled={loading}>
            {loading ? 'Dang xu ly...' : 'Dang nhap'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default AdminLogin
