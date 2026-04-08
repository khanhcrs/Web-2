const baseUrl = process.argv[2] || 'http://localhost/api'
const adminCredentials = {
  email: 'admin@clothify.com',
  password: 'Admin@123'
}

const request = async (path, options = {}) => {
  const {
    method = 'GET',
    body,
    headers = {}
  } = options

  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      Accept: 'application/json',
      ...(body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...headers
    },
    body: body instanceof FormData || body === undefined ? body : JSON.stringify(body)
  })

  const text = await response.text()
  const payload = text ? JSON.parse(text) : null

  if (!response.ok) {
    const message = payload?.message || payload?.error || `HTTP ${response.status}`
    throw new Error(`${method} ${path} failed: ${message}`)
  }

  return payload
}

const results = []

const addResult = (name, ok, detail = '') => {
  results.push({ name, ok, detail })
  const marker = ok ? 'PASS' : 'FAIL'
  console.log(`[${marker}] ${name}${detail ? ` - ${detail}` : ''}`)
}

const main = async () => {
  try {
    const adminLogin = await request('/login', {
      method: 'POST',
      body: adminCredentials
    })
    addResult('admin_login', adminLogin.success === true, adminLogin.user?.email || '')

    const adminHeaders = {
      Authorization: `Bearer ${adminLogin.token}`
    }

    const testEmail = `qa_smoke_${Date.now()}@example.com`
    const testPassword = 'Qa123456!'

    const register = await request('/register', {
      method: 'POST',
      body: {
        name: 'QA Smoke',
        email: testEmail,
        password: testPassword
      }
    })
    addResult('customer_register', register.success === true, testEmail)

    const customerHeaders = {
      Authorization: `Bearer ${register.token}`
    }
    const reviewHeaders = {
      'auth-token': register.token
    }

    const products = await request('/allproducts')
    addResult('product_list', Array.isArray(products) && products.length > 0, `count=${products.length}`)
    const product = products[0]

    const emptyCart = await request('/cart', { headers: customerHeaders })
    addResult('cart_get_empty', emptyCart.success === true, JSON.stringify(emptyCart.cartItems || {}))

    const updatedCart = await request('/cart', {
      method: 'PUT',
      headers: customerHeaders,
      body: {
        cartItems: {
          [`${product.id}-M`]: 2
        }
      }
    })
    addResult('cart_put', updatedCart.success === true, JSON.stringify(updatedCart.cartItems || {}))

    const review = await request('/addreview', {
      method: 'POST',
      headers: reviewHeaders,
      body: {
        productId: product.id,
        rating: 5,
        comment: 'QA smoke review'
      }
    })
    addResult('add_review', review.success === true)

    const reviews = await request(`/reviews/${product.id}`)
    addResult(
      'list_reviews',
      Array.isArray(reviews.reviews) && reviews.reviews.some((entry) => entry.comment === 'QA smoke review')
    )

    const order = await request('/orders', {
      method: 'POST',
      body: {
        customerId: register.user.id,
        customerName: 'QA Smoke',
        customerEmail: testEmail,
        customerPhone: '0900000000',
        items: [
          {
            productId: product.id,
            name: product.name,
            quantity: 1,
            price: Number(product.new_price),
            size: 'M'
          }
        ],
        total: Number(product.new_price),
        status: 'pending',
        shippingAddress: '123 QA Street',
        paymentMethod: 'cash_on_delivery'
      }
    })
    addResult('create_order', order.success === true, `orderId=${order.order?.orderId}`)

    const myOrders = await request('/my-orders', { headers: customerHeaders })
    addResult(
      'my_orders',
      Array.isArray(myOrders) && myOrders.some((entry) => entry.id === order.order.orderId)
    )

    const orderDetail = await request(`/order/${order.order.orderId}`, { headers: customerHeaders })
    addResult('order_detail', orderDetail.id === order.order.orderId)

    const users = await request('/users', { headers: adminHeaders })
    addResult(
      'admin_users',
      Array.isArray(users.users) && users.users.some((entry) => entry.email === testEmail)
    )

    const orders = await request('/orders', { headers: adminHeaders })
    addResult(
      'admin_orders',
      Array.isArray(orders.orders) && orders.orders.some((entry) => entry.orderId === order.order.orderId)
    )

    const stockReport = await request('/reports/stock-at-time?targetTime=2026-04-08T19:45&category=all', {
      headers: adminHeaders
    })
    addResult('report_stock_at_time', stockReport.success === true)

    const importExportReport = await request('/reports/import-export?startDate=2026-04-08&endDate=2026-04-08', {
      headers: adminHeaders
    })
    addResult('report_import_export', importExportReport.success === true)

    const lowStockReport = await request('/reports/low-stock?threshold=25', {
      headers: adminHeaders
    })
    addResult('report_low_stock', lowStockReport.success === true)

    const failed = results.filter((entry) => !entry.ok)
    console.log('\nSummary:')
    console.log(JSON.stringify(results, null, 2))

    if (failed.length > 0) {
      process.exitCode = 1
    }
  } catch (error) {
    console.error(error)
    process.exitCode = 1
  }
}

main()
