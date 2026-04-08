import React, { useEffect, useState } from 'react'
import './PriceManagement.css'
import { listProducts } from '../../services/productService'
import { updateProfitMargin } from '../../services/pricingService'

const PriceManagement = () => {
  const [products, setProducts] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [tempMargin, setTempMargin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const fetchProducts = async () => {
    setLoading(true)
    setError('')

    try {
      const data = await listProducts()
      setProducts(data)
    } catch (fetchError) {
      console.error('Loi tai danh sach san pham:', fetchError)
      setProducts([])
      setError(fetchError.message || 'Khong the tai danh sach san pham.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  const handleEditClick = (product) => {
    setEditingId(product.id)
    setTempMargin(product.profit_margin || 0)
  }

  const handleCancelClick = () => {
    setEditingId(null)
    setTempMargin('')
  }

  const handleSaveMargin = async (productId) => {
    try {
      await updateProfitMargin({
        productId,
        newProfitMargin: tempMargin
      })

      alert('Da cap nhat ty le loi nhuan va gia ban thanh cong!')
      setEditingId(null)
      fetchProducts()
    } catch (saveError) {
      console.error('Loi ket noi:', saveError)
      alert(saveError.message || 'Khong the cap nhat ty le loi nhuan.')
    }
  }

  return (
    <div className='price-mgmt-container'>
      <h2 className='price-mgmt-title'>Quan ly gia ban va loi nhuan</h2>
      <p className='price-mgmt-subtitle'>Dieu chinh ty le % loi nhuan mong muon. Gia ban se tu dong tinh dua tren gia nhap binh quan.</p>

      {error && <p style={{ color: '#dc2626', fontWeight: 700 }}>{error}</p>}

      <div className='price-card'>
        <div className='price-table-wrapper'>
          <table className='price-table'>
            <thead>
              <tr>
                <th>Ma SP</th>
                <th>Ten san pham</th>
                <th>Ton kho</th>
                <th>Gia nhap</th>
                <th>Loi nhuan (%)</th>
                <th>Gia ban le</th>
                <th>Thao tac</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={7}>Dang tai du lieu...</td>
                </tr>
              )}

              {!loading && products.map((product) => (
                <tr key={product.id}>
                  <td>{product.code || `SP${product.id}`}</td>
                  <td style={{ fontWeight: '500' }}>{product.name}</td>
                  <td>{product.stock_quantity || 0}</td>
                  <td style={{ color: '#64748b' }}>
                    {Number(product.current_import_price || 0).toLocaleString()} VND
                  </td>
                  <td>
                    {editingId === product.id ? (
                      <div className='edit-margin-box'>
                        <input
                          type='number'
                          value={tempMargin}
                          onChange={(event) => setTempMargin(event.target.value)}
                          min='0'
                          className='margin-input'
                        />
                        <span className='percent-icon'>%</span>
                      </div>
                    ) : (
                      <span className='margin-badge'>
                        {product.profit_margin || 0}%
                      </span>
                    )}
                  </td>
                  <td style={{ fontWeight: '700', color: '#10b981' }}>
                    {Number(product.new_price || 0).toLocaleString()} VND
                  </td>
                  <td>
                    {editingId === product.id ? (
                      <div className='action-buttons'>
                        <button className='btn-save' onClick={() => handleSaveMargin(product.id)}>Luu</button>
                        <button className='btn-cancel' onClick={handleCancelClick}>Huy</button>
                      </div>
                    ) : (
                      <button className='btn-edit' onClick={() => handleEditClick(product)}>Cap nhat %</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default PriceManagement
