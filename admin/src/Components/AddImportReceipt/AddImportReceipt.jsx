import React, { useEffect, useState } from 'react'
import './AddImportReceipt.css'
import { listProducts } from '../../services/productService'
import {
  completeImportReceipt,
  createImportReceipt,
  getImportReceipt,
  listImportReceipts,
  updateImportReceipt
} from '../../services/importReceiptService'

const AddImportReceipt = () => {
  const [receiptsList, setReceiptsList] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [products, setProducts] = useState([])
  const [receiptCode, setReceiptCode] = useState(`PN${Date.now()}`)
  const [details, setDetails] = useState([])
  const [editingReceiptId, setEditingReceiptId] = useState(null)
  const [selectedProductId, setSelectedProductId] = useState('')
  const [importPrice, setImportPrice] = useState('')
  const [quantity, setQuantity] = useState('')

  const fetchProducts = async () => {
    try {
      const data = await listProducts()
      setProducts(data)
    } catch (error) {
      console.error(error)
      setProducts([])
    }
  }

  const fetchAllReceipts = async () => {
    try {
      const data = await listImportReceipts()
      setReceiptsList(data)
    } catch (error) {
      console.error(error)
      setReceiptsList([])
    }
  }

  useEffect(() => {
    fetchProducts()
    fetchAllReceipts()
  }, [])

  const filteredReceipts = receiptsList.filter((receipt) =>
    receipt.receipt_code.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleEditReceipt = async (receiptId) => {
    try {
      const data = await getImportReceipt(receiptId)
      setEditingReceiptId(data.receipt.id)
      setReceiptCode(data.receipt.receipt_code)
      setDetails(
        data.details.map((detail) => ({
          productId: detail.product_id,
          name: detail.name,
          importPrice: Number(detail.import_price),
          quantity: Number(detail.quantity),
          total: Number(detail.import_price) * Number(detail.quantity)
        }))
      )

      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
    } catch (error) {
      alert(error.message || 'Loi khi lay thong tin phieu nhap!')
    }
  }

  const handleCancelEdit = () => {
    setEditingReceiptId(null)
    setReceiptCode(`PN${Date.now()}`)
    setDetails([])
  }

  const handleAddDetail = () => {
    if (!selectedProductId || !importPrice || !quantity) {
      alert('Vui long nhap du gia nhap va so luong!')
      return
    }

    const product = products.find((entry) => entry.id === Number(selectedProductId))
    if (!product) {
      alert('San pham khong ton tai.')
      return
    }

    if (details.some((detail) => detail.productId === product.id)) {
      alert('San pham nay da co, vui long xoa dong cu de nhap lai!')
      return
    }

    setDetails((prev) => [
      ...prev,
      {
        productId: product.id,
        name: product.name,
        importPrice: Number(importPrice),
        quantity: Number(quantity),
        total: Number(importPrice) * Number(quantity)
      }
    ])

    setSelectedProductId('')
    setImportPrice('')
    setQuantity('')
  }

  const handleRemoveDetail = (index) => {
    setDetails((prev) => prev.filter((_, currentIndex) => currentIndex !== index))
  }

  const handleSaveReceipt = async (isComplete) => {
    if (details.length === 0) {
      alert('Vui long them it nhat 1 san pham!')
      return
    }

    try {
      let currentReceiptId = editingReceiptId

      if (editingReceiptId) {
        await updateImportReceipt(editingReceiptId, { receiptCode, details })
      } else {
        const created = await createImportReceipt({ receiptCode, details })
        currentReceiptId = created.receipt.id
      }

      if (isComplete) {
        await completeImportReceipt(currentReceiptId)
        alert('Hoan thanh phieu thanh cong! Kho va gia da duoc cap nhat.')
      } else {
        alert('Da luu nhap phieu nhap thanh cong!')
      }

      handleCancelEdit()
      fetchAllReceipts()
      fetchProducts()
    } catch (error) {
      alert(error.message || 'Khong the xu ly phieu nhap.')
    }
  }

  const grandTotal = details.reduce((sum, item) => sum + item.total, 0)

  return (
    <div className='add-receipt-container'>
      <h2 style={{ color: '#0f172a', marginBottom: '5px' }}>Quan ly nhap kho</h2>
      <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '20px' }}>
        Tim kiem, sua phieu nhap hoac lap phieu nhap hang moi.
      </p>

      <div className='receipt-form-box'>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h4 style={{ margin: 0 }}>Lich su phieu nhap</h4>
          <input
            type='text'
            placeholder='Tim theo ma phieu...'
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            style={{ padding: '8px 15px', width: '250px', borderRadius: '6px', border: '1px solid #ccc' }}
          />
        </div>

        <table className='receipt-table' style={{ marginBottom: 0 }}>
          <thead>
            <tr>
              <th>Ma phieu</th>
              <th>Ngay lap</th>
              <th>Trang thai</th>
              <th>Hanh dong</th>
            </tr>
          </thead>
          <tbody>
            {filteredReceipts.length === 0 ? (
              <tr><td colSpan='4' style={{ textAlign: 'center' }}>Khong tim thay phieu nao</td></tr>
            ) : (
              filteredReceipts.map((receipt) => (
                <tr key={receipt.id} style={{ backgroundColor: editingReceiptId === receipt.id ? '#eff6ff' : 'white' }}>
                  <td style={{ fontWeight: 'bold', color: '#3b82f6' }}>{receipt.receipt_code}</td>
                  <td>{new Date(receipt.created_at).toLocaleString('vi-VN')}</td>
                  <td>
                    <span
                      style={{
                        padding: '4px 10px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        backgroundColor: receipt.status === 'completed' ? '#dcfce7' : '#fef9c3',
                        color: receipt.status === 'completed' ? '#16a34a' : '#ca8a04'
                      }}
                    >
                      {receipt.status === 'completed' ? 'Da chot kho' : 'Luu nhap'}
                    </span>
                  </td>
                  <td>
                    {receipt.status === 'pending' ? (
                      <button
                        onClick={() => handleEditReceipt(receipt.id)}
                        style={{ background: 'transparent', border: '1px solid #3b82f6', color: '#3b82f6', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                      >
                        Sua phieu
                      </button>
                    ) : (
                      <span style={{ color: '#94a3b8', fontSize: '13px' }}>Da khoa</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className='receipt-form-box' style={{ border: editingReceiptId ? '2px solid #3b82f6' : '1px dashed #007bff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h4 style={{ color: editingReceiptId ? '#3b82f6' : '#333' }}>
            {editingReceiptId ? `Dang sua: ${receiptCode}` : 'Lap phieu moi'}
          </h4>
          {editingReceiptId && (
            <button onClick={handleCancelEdit} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '5px 15px', borderRadius: '4px', cursor: 'pointer' }}>
              Huy sua / Tao moi
            </button>
          )}
        </div>

        <div className='receipt-header' style={{ marginTop: '15px' }}>
          <label>Ma phieu nhap: </label>
          <input type='text' value={receiptCode} onChange={(event) => setReceiptCode(event.target.value)} />
        </div>

        <div className='receipt-inputs'>
          <select value={selectedProductId} onChange={(event) => setSelectedProductId(event.target.value)}>
            <option value='' disabled>-- Chon san pham can nhap --</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>{product.code ? `[${product.code}]` : ''} {product.name}</option>
            ))}
          </select>

          <input type='number' placeholder='So luong' value={quantity} onChange={(event) => setQuantity(event.target.value)} min='1' />
          <input type='number' placeholder='Gia nhap (VND)' value={importPrice} onChange={(event) => setImportPrice(event.target.value)} min='0' />

          <button className='btn-add-detail' onClick={handleAddDetail}>+ Them</button>
        </div>
      </div>

      <div className='receipt-details-list'>
        <table className='receipt-table'>
          <thead>
            <tr>
              <th>STT</th>
              <th>Ten san pham</th>
              <th>So luong</th>
              <th>Don gia nhap</th>
              <th>Thanh tien</th>
              <th>Thao tac</th>
            </tr>
          </thead>
          <tbody>
            {details.length === 0 ? (
              <tr><td colSpan='6' style={{ textAlign: 'center', padding: '20px' }}>Chua co san pham nao</td></tr>
            ) : (
              details.map((item, index) => (
                <tr key={`${item.productId}-${index}`}>
                  <td>{index + 1}</td>
                  <td>{item.name}</td>
                  <td>{item.quantity}</td>
                  <td>{item.importPrice.toLocaleString()} VND</td>
                  <td>{item.total.toLocaleString()} VND</td>
                  <td><button className='btn-remove' onClick={() => handleRemoveDetail(index)}>X</button></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <div className='receipt-grand-total'>
          <h3>Tong tien nhap: <span style={{ color: 'red' }}>{grandTotal.toLocaleString()} VND</span></h3>
        </div>
      </div>

      <div className='receipt-actions'>
        <button className='btn-save-draft' onClick={() => handleSaveReceipt(false)}>LUU NHAP PHIEU</button>
        <button className='btn-complete' onClick={() => handleSaveReceipt(true)}>HOAN THANH</button>
      </div>
    </div>
  )
}

export default AddImportReceipt
