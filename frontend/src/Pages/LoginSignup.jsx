import React, { useContext, useState } from 'react'
import './CSS/LoginSignup.css'
import { ADMIN_PORTAL_URL } from '../config'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../Context/AuthContext'
import { loginUser, registerUser } from '../services/authService'

const LoginSignup = () => {
  const [mode, setMode] = useState('signup')
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const navigate = useNavigate()
  const { login: authenticate } = useContext(AuthContext)

  const toggleMode = () => {
    setMode((prev) => (prev === 'signup' ? 'login' : 'signup'))
    setError('')
    setSuccess('')
  }

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const payload = {
        email: form.email,
        password: form.password
      }

      if (mode === 'signup') {
        payload.name = form.name
      }

      const data = mode === 'signup'
        ? await registerUser(payload)
        : await loginUser(payload)

      if (mode === 'signup') {
        setSuccess('Dang ky thanh cong. Ban co the dang nhap ngay bay gio.')
        setForm({ name: '', email: '', password: '' })
        setMode('login')
        return
      }

      if (data.token && data.user) {
        authenticate(data.token, data.user)

        if (data.user.role === 'admin') {
          const adminUrl = new URL(ADMIN_PORTAL_URL || '../admin', window.location.href)
          adminUrl.pathname = `${adminUrl.pathname.replace(/\/$/, '')}/login`
          adminUrl.searchParams.set('token', data.token)
          adminUrl.searchParams.set('user', encodeURIComponent(JSON.stringify(data.user)))
          window.location.href = adminUrl.toString()
          return
        }

        navigate('/', { replace: true })
      }
    } catch (submitError) {
      setError(submitError.message || 'Khong the xu ly yeu cau.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='loginsignup'>
      <div className='loginsignup-container'>
        <h1>{mode === 'signup' ? 'Dang ky' : 'Dang nhap'}</h1>
        <form className='loginsignup-fields' onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <input
              type='text'
              name='name'
              placeholder='Ho va ten'
              value={form.name}
              onChange={handleChange}
              required
            />
          )}
          <input
            type='email'
            name='email'
            placeholder='Dia chi email'
            value={form.email}
            onChange={handleChange}
            required
          />
          <input
            type='password'
            name='password'
            placeholder='Mat khau'
            value={form.password}
            onChange={handleChange}
            required
          />
          <button type='submit' disabled={loading}>
            {loading ? 'Dang xu ly...' : mode === 'signup' ? 'Tiep tuc' : 'Dang nhap'}
          </button>
        </form>
        {error && <p className='loginsignup-message error'>{error}</p>}
        {success && <p className='loginsignup-message success'>{success}</p>}
        <p className='loginsignup-login'>
          {mode === 'signup' ? 'Da co tai khoan?' : 'Chua co tai khoan?'}{' '}
          <span onClick={toggleMode}>
            {mode === 'signup' ? 'Dang nhap ngay' : 'Dang ky ngay'}
          </span>
        </p>
      </div>
    </div>
  )
}

export default LoginSignup
