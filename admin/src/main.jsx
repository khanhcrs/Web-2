import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'

const getAdminBasename = () => {
  if (typeof window === 'undefined') {
    return '/admin'
  }

  return new URL('../admin/', window.location.href).pathname.replace(/\/$/, '')
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter basename={getAdminBasename()}><App /></BrowserRouter>
  </StrictMode>,
)
