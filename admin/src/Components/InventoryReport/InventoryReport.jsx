import React, { useEffect, useState } from 'react'
import './InventoryReport.css'
import {
  getImportExportReport,
  getLowStockReport,
  getStockAtTimeReport
} from '../../services/reportService'

const getTodayDateInputValue = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

const getCurrentDateTimeInputValue = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')

  return `${year}-${month}-${day}T${hours}:${minutes}`
}

const getErrorMessage = (error) => {
  if (error instanceof Error && error.message.trim() !== '') {
    return error.message
  }

  return 'Khong the tai du lieu.'
}

const InventoryReport = () => {
  const [activeTab, setActiveTab] = useState(1)

  const [targetTime, setTargetTime] = useState(getCurrentDateTimeInputValue)
  const [category, setCategory] = useState('all')
  const [stockData, setStockData] = useState([])

  const [startDate, setStartDate] = useState(getTodayDateInputValue)
  const [endDate, setEndDate] = useState(getTodayDateInputValue)
  const [ioData, setIoData] = useState([])

  const [threshold, setThreshold] = useState(10)
  const [lowStockData, setLowStockData] = useState([])

  const [loadingState, setLoadingState] = useState({
    stock: false,
    io: false,
    lowStock: false
  })
  const [errorState, setErrorState] = useState({
    stock: '',
    io: '',
    lowStock: ''
  })

  const fetchStockAtTime = async ({ silent = false } = {}) => {
    if (!targetTime) {
      if (!silent) {
        alert('Vui long chon moc thoi gian!')
      }
      return
    }

    setLoadingState((prev) => ({ ...prev, stock: true }))
    setErrorState((prev) => ({ ...prev, stock: '' }))

    try {
      const data = await getStockAtTimeReport({
        targetTime,
        category
      })

      if (!data?.success) {
        throw new Error(data?.message || 'Khong the tai bao cao ton kho.')
      }

      setStockData(Array.isArray(data.data) ? data.data : [])
    } catch (error) {
      const message = getErrorMessage(error)
      console.error(error)
      setStockData([])
      setErrorState((prev) => ({ ...prev, stock: message }))

      if (!silent) {
        alert(message)
      }
    } finally {
      setLoadingState((prev) => ({ ...prev, stock: false }))
    }
  }

  const fetchIOReport = async ({ silent = false } = {}) => {
    if (!startDate || !endDate) {
      if (!silent) {
        alert('Vui long chon day du Tu ngay va Den ngay!')
      }
      return
    }

    if (new Date(startDate) > new Date(endDate)) {
      const message = 'Ngay bat dau khong duoc lon hon ngay ket thuc!'

      setIoData([])
      setErrorState((prev) => ({ ...prev, io: message }))

      if (!silent) {
        alert(message)
      }
      return
    }

    setLoadingState((prev) => ({ ...prev, io: true }))
    setErrorState((prev) => ({ ...prev, io: '' }))

    try {
      const data = await getImportExportReport({
        startDate,
        endDate
      })

      if (!data?.success) {
        throw new Error(data?.message || 'Khong the tai bao cao nhap xuat.')
      }

      setIoData(Array.isArray(data.data) ? data.data : [])
    } catch (error) {
      const message = getErrorMessage(error)
      console.error(error)
      setIoData([])
      setErrorState((prev) => ({ ...prev, io: message }))

      if (!silent) {
        alert(message)
      }
    } finally {
      setLoadingState((prev) => ({ ...prev, io: false }))
    }
  }

  const fetchLowStock = async ({ silent = false } = {}) => {
    if (threshold === '' || Number(threshold) < 0) {
      if (!silent) {
        alert('Nguong so luong khong hop le!')
      }
      return
    }

    setLoadingState((prev) => ({ ...prev, lowStock: true }))
    setErrorState((prev) => ({ ...prev, lowStock: '' }))

    try {
      const data = await getLowStockReport({
        threshold: String(threshold)
      })

      if (!data?.success) {
        throw new Error(data?.message || 'Khong the tai canh bao ton kho.')
      }

      setLowStockData(Array.isArray(data.data) ? data.data : [])
    } catch (error) {
      const message = getErrorMessage(error)
      console.error(error)
      setLowStockData([])
      setErrorState((prev) => ({ ...prev, lowStock: message }))

      if (!silent) {
        alert(message)
      }
    } finally {
      setLoadingState((prev) => ({ ...prev, lowStock: false }))
    }
  }

  useEffect(() => {
    if (activeTab === 1) {
      fetchStockAtTime({ silent: true })
      return
    }

    if (activeTab === 2) {
      fetchIOReport({ silent: true })
      return
    }

    fetchLowStock({ silent: true })
  }, [activeTab])

  const resetTargetTimeToNow = () => {
    setTargetTime(getCurrentDateTimeInputValue())
  }

  const resetDateRangeToToday = () => {
    const today = getTodayDateInputValue()
    setStartDate(today)
    setEndDate(today)
  }

  const renderStatus = (message, isLoading) => {
    if (isLoading) {
      return <p className='report-status'>Dang tai du lieu...</p>
    }

    if (message) {
      return <p className='report-status report-status-error'>{message}</p>
    }

    return null
  }

  return (
    <div className='report-container'>
      <h2 className='report-title'>Bao Cao & Thong Ke Ton Kho</h2>
      <p className='report-subtitle'>Quan ly dong chay hang hoa va theo doi hien trang kho hang.</p>

      <div className='report-tabs'>
        <button className={`tab-btn ${activeTab === 1 ? 'active' : ''}`} onClick={() => setActiveTab(1)}>
          1. Ton kho tai thoi diem
        </button>
        <button className={`tab-btn ${activeTab === 2 ? 'active' : ''}`} onClick={() => setActiveTab(2)}>
          2. Nhap / Xuat theo ky
        </button>
        <button className={`tab-btn ${activeTab === 3 ? 'active' : ''}`} onClick={() => setActiveTab(3)}>
          3. Canh bao het hang
        </button>
      </div>

      <div className='report-card'>
        {activeTab === 1 && (
          <div className='tab-content'>
            <div className='filter-bar'>
              <div className='filter-group'>
                <label>Chon thoi diem:</label>
                <input type='datetime-local' value={targetTime} onChange={(e) => setTargetTime(e.target.value)} />
              </div>
              <div className='filter-group'>
                <label>Phan loai:</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)}>
                  <option value='all'>Tat ca san pham</option>
                  <option value='women'>Phu nu</option>
                  <option value='men'>Dan ong</option>
                  <option value='kid'>Tre em</option>
                </select>
              </div>
              <div className='filter-actions'>
                <button className='btn-secondary' type='button' onClick={resetTargetTimeToNow}>
                  Hien tai
                </button>
                <button className='btn-fetch' type='button' onClick={() => fetchStockAtTime()} disabled={loadingState.stock}>
                  {loadingState.stock ? 'Dang tai...' : 'Tra cuu'}
                </button>
              </div>
            </div>

            {renderStatus(errorState.stock, loadingState.stock)}

            <table className='report-table'>
              <thead>
                <tr>
                  <th>Ma SP</th>
                  <th>Ten san pham</th>
                  <th>Tong nhap</th>
                  <th>Tong xuat</th>
                  <th>Ton kho thuc te</th>
                </tr>
              </thead>
              <tbody>
                {!loadingState.stock && stockData.length === 0 ? (
                  <tr>
                    <td colSpan='5' className='empty-row'>
                      Chua co du lieu ton kho tai moc thoi gian da chon.
                    </td>
                  </tr>
                ) : (
                  stockData.map((item) => (
                    <tr key={item.id}>
                      <td>{item.code || `SP${item.id}`}</td>
                      <td style={{ fontWeight: 500 }}>{item.name}</td>
                      <td style={{ color: '#10b981' }}>{item.total_imported}</td>
                      <td style={{ color: '#ef4444' }}>{item.total_sold}</td>
                      <td style={{ fontWeight: 'bold', color: '#3b82f6' }}>{item.stock_at_time}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 2 && (
          <div className='tab-content'>
            <div className='filter-bar'>
              <div className='filter-group'>
                <label>Tu ngay:</label>
                <input type='date' value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div className='filter-group'>
                <label>Den ngay:</label>
                <input type='date' value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
              <div className='filter-actions'>
                <button className='btn-secondary' type='button' onClick={resetDateRangeToToday}>
                  Hom nay
                </button>
                <button className='btn-fetch' type='button' onClick={() => fetchIOReport()} disabled={loadingState.io}>
                  {loadingState.io ? 'Dang tai...' : 'Xem bao cao'}
                </button>
              </div>
            </div>

            {renderStatus(errorState.io, loadingState.io)}

            <table className='report-table'>
              <thead>
                <tr>
                  <th>Ma SP</th>
                  <th>Ten san pham</th>
                  <th>So luong nhap vao</th>
                  <th>So luong ban ra</th>
                </tr>
              </thead>
              <tbody>
                {!loadingState.io && ioData.length === 0 ? (
                  <tr>
                    <td colSpan='4' className='empty-row'>
                      Chua co du lieu trong khoang thoi gian da chon.
                    </td>
                  </tr>
                ) : (
                  ioData.map((item) => (
                    <tr key={item.id}>
                      <td>{item.code || `SP${item.id}`}</td>
                      <td style={{ fontWeight: 500 }}>{item.name}</td>
                      <td style={{ fontWeight: 'bold', color: '#10b981' }}>+ {item.total_imported}</td>
                      <td style={{ fontWeight: 'bold', color: '#ef4444' }}>- {item.total_exported}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 3 && (
          <div className='tab-content'>
            <div className='filter-bar'>
              <div className='filter-group'>
                <label>Canh bao san pham co ton kho tu:</label>
                <div className='threshold-input-row'>
                  <input
                    type='number'
                    value={threshold}
                    onChange={(e) => setThreshold(e.target.value)}
                    min='0'
                  />
                  <span>tro xuong</span>
                </div>
              </div>
              <div className='filter-actions'>
                <button className='btn-fetch btn-warning' type='button' onClick={() => fetchLowStock()} disabled={loadingState.lowStock}>
                  {loadingState.lowStock ? 'Dang tai...' : 'Loc canh bao'}
                </button>
              </div>
            </div>

            {renderStatus(errorState.lowStock, loadingState.lowStock)}

            <table className='report-table'>
              <thead>
                <tr>
                  <th>Ma SP</th>
                  <th>Ten san pham</th>
                  <th>Ton kho hien tai</th>
                  <th>Muc canh bao</th>
                </tr>
              </thead>
              <tbody>
                {!loadingState.lowStock && lowStockData.length === 0 ? (
                  <tr>
                    <td colSpan='4' className='empty-row'>
                      Khong co san pham nao dang o muc canh bao.
                    </td>
                  </tr>
                ) : (
                  lowStockData.map((item) => (
                    <tr key={item.id} style={{ backgroundColor: Number(item.stock_quantity) === 0 ? '#fee2e2' : '#fef3c7' }}>
                      <td>{item.code || `SP${item.id}`}</td>
                      <td style={{ fontWeight: 500 }}>{item.name}</td>
                      <td style={{ fontWeight: 'bold', color: '#dc2626', fontSize: '16px' }}>
                        {item.stock_quantity}
                        {Number(item.stock_quantity) === 0 && (
                          <span className='report-badge-danger'>Het sach hang</span>
                        )}
                      </td>
                      <td>&le; {threshold}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default InventoryReport
