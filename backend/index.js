const port = process.env.PORT || 4000;
const express = require('express');
const app = express();
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const bcrypt = require('bcryptjs');

// Load environment variables if .env file exists
if (process.env.NODE_ENV !== 'production') {
    try {
        require('dotenv').config();
    } catch (e) {
        console.warn('dotenv not available, using inline config');
    }
}

const JWT_SECRET = 'secret_ecom';

app.use(express.json());
app.use(cors());

// ================== PostgreSQL CONNECTION ==================
const pool = new Pool({
    user: process.env.POSTGRES_USER || 'postgres',
    host: process.env.POSTGRES_HOST || 'localhost',
    database: process.env.POSTGRES_DB || 'clothify',
    password: process.env.POSTGRES_PASSWORD || 'kt123456',
    port: process.env.POSTGRES_PORT || 5432,
});

pool.connect()
    .then(() => console.log('Connected to PostgreSQL'))
    .catch(err => console.error('PostgreSQL connection error', err.stack));

// ================== API TEST ==================
app.get("/", (req, res) => {
    res.send("Express App is running with PostgreSQL");
});

// ================== IMAGE UPLOAD ==================
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, 'upload', 'images'));
    },
    filename: (req, file, cb) => {
        cb(null, `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({ storage: storage });

// Static path
app.use('/images', express.static(path.join(__dirname, 'upload', 'images')));

// Upload endpoint
app.post('/upload', upload.single('product'), (req, res) => {
  console.log(req.file);
  res.json({
    success: 1,
    image_url: `/images/${req.file.filename}`
  });
});
const Product = mongoose.model('Product', {
  id: {
    type: Number,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  new_price: {
    type: Number,
    required: true,
  },
  old_price: {
    type: Number,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  available: {
    type: Boolean,
    default: true,
  },
});

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    trim: true,
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['active', 'suspended'],
    default: 'active',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const orderSchema = new mongoose.Schema({
  orderId: {
    type: Number,
    required: true,
    unique: true,
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  customerName: String,
  customerEmail: String,
  items: [
    {
      productId: Number,
      name: String,
      quantity: Number,
      price: Number,
    },
  ],
  total: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'shipped'],
    default: 'pending',
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed'],
    default: 'pending',
  },
  paymentMethod: {
    type: String,
    enum: ['cash_on_delivery', 'credit_card'],
    default: 'cash_on_delivery',
  },
  paymentReference: String,
  paymentDetails: {
    cardLast4: String,
    cardholderName: String,
  },
  paidAt: Date,
  shippingAddress: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// ================== PRODUCTS ==================

const allowedOrderStatuses = ['pending', 'processing', 'shipped'];
const allowedPaymentStatuses = ['pending', 'paid', 'failed'];
const allowedPaymentMethods = ['cash_on_delivery', 'credit_card'];

const sanitizeOrderItems = (items) => {
  if (!Array.isArray(items)) {
    return [];
  }
  return items
    .map((item) => ({
      productId: Number(item.productId) || 0,
      name: item.name,
      quantity: Number(item.quantity) || 0,
      price: Number(item.price) || 0,
    }))
    .filter((item) => item.productId && item.quantity > 0 && item.price >= 0);
};

const calculateOrderTotal = (items) =>
  items.reduce((sum, item) => sum + item.price * item.quantity, 0);

const parseDate = (value) => {
  if (!value) {
    return undefined;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};

const resolveCustomerInfo = async (customerId, fallbackName, fallbackEmail) => {
  let customerRef = null;
  let resolvedName = fallbackName;
  let resolvedEmail = fallbackEmail;

  if (customerId) {
    const customer = await User.findById(customerId).lean();
    if (customer) {
      customerRef = customer._id;
      resolvedName = customer.name;
      resolvedEmail = customer.email;
    }
  }

  return { customerRef, resolvedName, resolvedEmail };
};

const generateNextOrderId = async () => {
  const lastOrder = await Order.findOne({}).sort({ orderId: -1 }).lean();
  return lastOrder ? lastOrder.orderId + 1 : 1;
};

const sanitizeStoredPaymentDetails = (details) => {
  if (!details) {
    return undefined;
  }
  const sanitized = {};
  if (details.cardLast4) {
    sanitized.cardLast4 = String(details.cardLast4).slice(-4);
  }
  if (details.cardholderName) {
    sanitized.cardholderName = String(details.cardholderName).trim();
  }
  return Object.keys(sanitized).length ? sanitized : undefined;
};

const validateCardDetails = (details = {}) => {
  const rawNumber = String(details.cardNumber || '').replace(/\s+/g, '');
  if (!/^\d{13,19}$/.test(rawNumber)) {
    return { valid: false, message: 'Số thẻ không hợp lệ.' };
  }

  const cardholderName = String(details.cardholderName || '').trim();
  if (cardholderName.length < 2) {
    return { valid: false, message: 'Tên chủ thẻ không hợp lệ.' };
  }

  const month = Number(details.expiryMonth);
  const year = Number(details.expiryYear);

  if (!Number.isInteger(month) || month < 1 || month > 12) {
    return { valid: false, message: 'Tháng hết hạn không hợp lệ.' };
  }

  if (!Number.isInteger(year) || year < 2000 || year > new Date().getFullYear() + 25) {
    return { valid: false, message: 'Năm hết hạn không hợp lệ.' };
  }

  const now = new Date();
  const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);
  if (endOfMonth < now) {
    return { valid: false, message: 'Thẻ đã hết hạn.' };
  }

  if (!/^\d{3,4}$/.test(String(details.cvv || ''))) {
    return { valid: false, message: 'Mã CVV không hợp lệ.' };
  }

  return {
    valid: true,
    sanitized: {
      last4: rawNumber.slice(-4),
      cardholderName,
    },
  };
};
app.post('/addproduct', async (req, res) => {
    try {
        const { name, image, category, new_price, old_price } = req.body;
        const parsedNewPrice = Number(new_price);
        const parsedOldPrice = Number(old_price);

        if (!name || !image || !category || Number.isNaN(parsedNewPrice) || Number.isNaN(parsedOldPrice)) {
            return res.status(400).json({ success: false, message: 'Missing required product fields.' });
        }

        const result = await pool.query(
            `INSERT INTO products (name, image, category, new_price, old_price)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
            [name, image, category, parsedNewPrice, parsedOldPrice]
        );

        res.json({
            success: true,
            product: result.rows[0],
        });
    } catch (error) {
        console.error('Error creating product', error);
        res.status(500).json({ success: false, message: 'Unable to create product.' });
    }
});

// REMOVE PRODUCT
app.post('/removeproduct', async (req, res) => {
    try {
        const { id } = req.body;
        if (!id) return res.status(400).json({ success: false, message: 'Product id is required.' });

        const result = await pool.query(
            'DELETE FROM products WHERE id = $1 RETURNING *',
            [Number(id)]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ success: false, message: 'Product not found.' });
        }

        res.json({
            success: true,
            product: result.rows[0],
        });
    } catch (error) {
        console.error('Error deleting product', error);
        res.status(500).json({ success: false, message: 'Unable to delete product.' });
    }
});

// UPDATE PRODUCT
app.put('/product/:id', async (req, res) => {
    try {
        const { id } = req.params;
        let { name, image, category, new_price, old_price, available } = req.body;

        const fields = [];
        const values = [];
        let idx = 1;

        if (name !== undefined) {
            fields.push(`name = $${idx++}`);
            values.push(name);
        }
        if (image !== undefined) {
            fields.push(`image = $${idx++}`);
            values.push(image);
        }
        if (category !== undefined) {
            fields.push(`category = $${idx++}`);
            values.push(category);
        }
        if (new_price !== undefined) {
            const parsedNew = Number(new_price);
            if (Number.isNaN(parsedNew)) {
                return res.status(400).json({ success: false, message: 'Price must be a number.' });
            }
            fields.push(`new_price = $${idx++}`);
            values.push(parsedNew);
        }
        if (old_price !== undefined) {
            const parsedOld = Number(old_price);
            if (Number.isNaN(parsedOld)) {
                return res.status(400).json({ success: false, message: 'Price must be a number.' });
            }
            fields.push(`old_price = $${idx++}`);
            values.push(parsedOld);
        }
        if (available !== undefined) {
            fields.push(`available = $${idx++}`);
            values.push(available);
        }

        if (fields.length === 0) {
            return res.status(400).json({ success: false, message: 'No fields to update.' });
        }

        values.push(Number(id));
        const query = `UPDATE products SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`;

        const result = await pool.query(query, values);

        if (result.rowCount === 0) {
            return res.status(404).json({ success: false, message: 'Product not found.' });
        }

        res.json({ success: true, product: result.rows[0] });
    } catch (error) {
        console.error('Error updating product', error);
        res.status(500).json({ success: false, message: 'Unable to update product.' });
    }
});

// GET ALL PRODUCTS
app.get('/allproducts', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM products ORDER BY date DESC');
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching products', error);
        res.status(500).json({ success: false, message: 'Unable to fetch products.' });
    }
});

// ================== AUTH & USERS ==================

// REGISTER
app.post('/register', async (req, res) => {
    try {
        let { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: 'Missing required registration fields.' });
        }

        email = email.toLowerCase();

        const existingUser = await pool.query(
            'SELECT id FROM users WHERE email = $1',
            [email]
        );
        if (existingUser.rowCount > 0) {
            return res.status(400).json({ success: false, message: 'Email already registered.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await pool.query(
            `INSERT INTO users (name, email, password)
       VALUES ($1, $2, $3)
       RETURNING id, name, email, status, created_at`,
            [name, email, hashedPassword]
        );

        const user = result.rows[0];

        const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

        res.json({
            success: true,
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                status: user.status,
                createdAt: user.created_at,
            },
        });
    } catch (error) {
        console.error('Registration error', error);
        res.status(500).json({ success: false, message: 'Unable to register user.' });
    }
});

// LOGIN
app.post('/login', async (req, res) => {
    try {
        let { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Missing login credentials.' });
        }

        email = email.toLowerCase();

        const result = await pool.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );

        if (result.rowCount === 0) {
            return res.status(401).json({ success: false, message: 'Invalid email or password.' });
        }

        const user = result.rows[0];

        if (user.status === 'suspended') {
            return res.status(403).json({ success: false, message: 'Account is suspended.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid email or password.' });
        }

        const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

        res.json({
            success: true,
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                status: user.status,
                createdAt: user.created_at,
            },
        });
    } catch (error) {
        console.error('Login error', error);
        res.status(500).json({ success: false, message: 'Unable to login.' });
    }
});

// GET USERS (không trả password)
app.get('/users', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, name, email, status, created_at FROM users ORDER BY created_at DESC'
        );

        const users = result.rows.map(u => ({
            id: u.id,
            name: u.name,
            email: u.email,
            status: u.status,
            createdAt: u.created_at,
        }));

        res.json({ success: true, users });
    } catch (error) {
        console.error('Error fetching users', error);
        res.status(500).json({ success: false, message: 'Unable to fetch users.' });
    }
});

// UPDATE USER STATUS
app.patch('/users/:userId/status', async (req, res) => {
    try {
        const { userId } = req.params;
        const { status } = req.body;

        if (!['active', 'suspended'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid user status.' });
        }

        const result = await pool.query(
            `UPDATE users
       SET status = $1
       WHERE id = $2
       RETURNING id, name, email, status, created_at`,
            [status, Number(userId)]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        const user = result.rows[0];

        res.json({
            success: true,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                status: user.status,
                createdAt: user.created_at,
            },
        });
    } catch (error) {
        console.error('Error updating user status', error);
        res.status(500).json({ success: false, message: 'Unable to update user status.' });
    }
});

// ================== AUTH MIDDLEWARE ==================
const fetchuser = (req, res, next) => {
    try {
        const token = req.header('auth-token');
        if (!token) {
            return res.status(401).json({ error: "No token, authorization denied" });
        }
        const data = jwt.verify(token, JWT_SECRET);
        req.user = data; // { id, email }
        next();
    } catch (error) {
        return res.status(401).json({ error: "Token is not valid" });
    }
};

// ================== CART (cart_data JSONB trong users) ==================
app.post('/addtocart', fetchuser, async (req, res) => {
    try {
        const { itemId, size } = req.body;
        if (!size) return res.status(400).send({ error: "Size is required" });

        const userResult = await pool.query(
            'SELECT id, cart_data FROM users WHERE id = $1',
            [req.user.id]
        );

        if (userResult.rowCount === 0) {
            return res.status(404).send({ error: "User not found" });
        }

        const user = userResult.rows[0];
        const cartData = user.cart_data || {};
        const key = `${itemId}-${size}`;

        cartData[key] = (cartData[key] || 0) + 1;

        await pool.query(
            'UPDATE users SET cart_data = $1 WHERE id = $2',
            [cartData, req.user.id]
        );

        res.send("Added");
    } catch (error) {
        console.error('Error add to cart', error);
        res.status(500).send({ error: "Server error" });
    }
});

app.post('/removefromcart', fetchuser, async (req, res) => {
    try {
        const { itemId, size } = req.body;

        const userResult = await pool.query(
            'SELECT id, cart_data FROM users WHERE id = $1',
            [req.user.id]
        );

        if (userResult.rowCount === 0) {
            return res.status(404).send({ error: "User not found" });
        }

        const user = userResult.rows[0];
        const cartData = user.cart_data || {};
        const key = `${itemId}-${size}`;

        if (cartData[key] > 0) {
            cartData[key] -= 1;
            if (cartData[key] <= 0) {
                delete cartData[key];
            }
        }

        await pool.query(
            'UPDATE users SET cart_data = $1 WHERE id = $2',
            [cartData, req.user.id]
        );

        res.send("Removed");
    } catch (error) {
        console.error('Error remove from cart', error);
        res.status(500).send({ error: "Server error" });
    }
});

const formatOrderResponse = (order) => ({
  orderId: order.orderId,
  status: order.status,
  total: order.total,
  createdAt: order.createdAt,
  paymentStatus: order.paymentStatus,
  paymentMethod: order.paymentMethod,
  paymentReference: order.paymentReference,
  paymentDetails: order.paymentDetails,
  paidAt: order.paidAt,
  shippingAddress: order.shippingAddress,
  customer: order.customer
    ? {
        id: order.customer._id,
        name: order.customer.name,
        email: order.customer.email,
        status: order.customer.status,
      }
    : {
        name: order.customerName,
        email: order.customerEmail,
      },
  items: order.items || [],
});

// GET ORDERS
app.get('/orders', async (req, res) => {
    try {
        const ordersResult = await pool.query(
            `SELECT o.*, u.name AS user_name, u.email AS user_email, u.status AS user_status
       FROM orders o
       LEFT JOIN users u ON o.customer_id = u.id
       ORDER BY o.created_at DESC`
        );

        const orders = ordersResult.rows;

        if (orders.length === 0) {
            return res.json({ success: true, orders: [] });
        }

        const orderPkIds = orders.map(o => o.id);

        const itemsResult = await pool.query(
            `SELECT * FROM order_items WHERE order_id = ANY($1::int[])`,
            [orderPkIds]
        );

        const itemsByOrderId = {};
        for (const item of itemsResult.rows) {
            if (!itemsByOrderId[item.order_id]) {
                itemsByOrderId[item.order_id] = [];
            }
            itemsByOrderId[item.order_id].push(item);
        }

        const formatted = orders.map(order =>
            formatOrderResponse(order, itemsByOrderId[order.id] || [])
        );

        res.json({ success: true, orders: formatted });
    } catch (error) {
        console.error('Error fetching orders', error);
        res.status(500).json({ success: false, message: 'Unable to fetch orders.' });
    }
});

// CREATE ORDER
app.post('/orders', async (req, res) => {
  try {
    const {
      customerId,
      customerName,
      customerEmail,
      items = [],
      total = 0,
      status = 'pending',
      paymentStatus = 'pending',
      paymentMethod = 'cash_on_delivery',
      paymentReference,
      paidAt,
      shippingAddress,
      paymentDetails,
    } = req.body;

    const normalizedStatus = allowedOrderStatuses.includes(status)
      ? status
      : 'pending';
    const normalizedPaymentStatus = allowedPaymentStatuses.includes(paymentStatus)
      ? paymentStatus
      : 'pending';
    const normalizedPaymentMethod = allowedPaymentMethods.includes(paymentMethod)
      ? paymentMethod
      : 'cash_on_delivery';

    const orderId = await generateNextOrderId();

    const { customerRef, resolvedName, resolvedEmail } = await resolveCustomerInfo(
      customerId,
      customerName,
      customerEmail
    );

    const sanitizedItems = sanitizeOrderItems(items);
    const computedTotal = calculateOrderTotal(sanitizedItems);
    const parsedTotal = Number(total);
    const finalTotal =
      !Number.isNaN(parsedTotal) && parsedTotal > 0 ? parsedTotal : computedTotal;

    const resolvedPaidAt =
      normalizedPaymentStatus === 'paid'
        ? parseDate(paidAt) || new Date()
        : undefined;

    const sanitizedPaymentDetails =
      normalizedPaymentMethod === 'credit_card'
        ? sanitizeStoredPaymentDetails(paymentDetails)
        : undefined;

    const order = new Order({
      orderId,
      customer: customerRef,
      customerName: resolvedName,
      customerEmail: resolvedEmail,
      items: sanitizedItems,
      total: finalTotal,
      status: normalizedStatus,
      paymentStatus: normalizedPaymentStatus,
      paymentMethod: normalizedPaymentMethod,
      paymentReference,
      paidAt: resolvedPaidAt,
      paymentDetails: sanitizedPaymentDetails,
      shippingAddress: shippingAddress || undefined,
    });

    await order.save();
    const populatedOrder = await order.populate('customer', 'name email status');
    res.json({ success: true, order: formatOrderResponse(populatedOrder) });
  } catch (error) {
    console.error('Error creating order', error);
    res.status(500).json({ success: false, message: 'Unable to create order.' });
  }
});

app.post('/checkout', async (req, res) => {
  try {
    const {
      customerId,
      customerName,
      customerEmail,
      items = [],
      shippingAddress,
      paymentMethod = 'cash_on_delivery',
      paymentDetails = {},
    } = req.body;

    if (!customerName || !customerEmail) {
      return res
        .status(400)
        .json({ success: false, message: 'Thiếu thông tin khách hàng.' });
    }

    const sanitizedItems = sanitizeOrderItems(items);
    if (!sanitizedItems.length) {
      return res
        .status(400)
        .json({ success: false, message: 'Giỏ hàng trống, không thể thanh toán.' });
    }

    const normalizedPaymentMethod = allowedPaymentMethods.includes(paymentMethod)
      ? paymentMethod
      : 'cash_on_delivery';

    let paymentStatus = 'pending';
    let paymentReference = undefined;
    let resolvedPaidAt = undefined;
    let sanitizedPaymentDetails = undefined;

    if (normalizedPaymentMethod === 'credit_card') {
      const cardValidation = validateCardDetails(paymentDetails);
      if (!cardValidation.valid) {
        return res
          .status(400)
          .json({ success: false, message: cardValidation.message });
      }
      paymentStatus = 'paid';
      paymentReference = `PAY-${Date.now()}`;
      resolvedPaidAt = new Date();
      sanitizedPaymentDetails = {
        cardLast4: cardValidation.sanitized.last4,
        cardholderName: cardValidation.sanitized.cardholderName,
      };
    }

    if (normalizedPaymentMethod === 'cash_on_delivery') {
      paymentReference = `COD-${Date.now()}`;
    }

    const orderId = await generateNextOrderId();
    const { customerRef, resolvedName, resolvedEmail } = await resolveCustomerInfo(
      customerId,
      customerName,
      customerEmail
    );

    const total = calculateOrderTotal(sanitizedItems);
    if (total <= 0) {
      return res
        .status(400)
        .json({ success: false, message: 'Tổng thanh toán không hợp lệ.' });
    }

    const order = new Order({
      orderId,
      customer: customerRef,
      customerName: resolvedName,
      customerEmail: resolvedEmail,
      items: sanitizedItems,
      total,
      status: 'pending',
      paymentStatus,
      paymentMethod: normalizedPaymentMethod,
      paymentReference,
      paidAt: resolvedPaidAt,
      paymentDetails: sanitizedPaymentDetails,
      shippingAddress: shippingAddress || undefined,
    });

    await order.save();
    const populatedOrder = await order.populate('customer', 'name email status');

    res.json({ success: true, order: formatOrderResponse(populatedOrder) });
  } catch (error) {
    console.error('Error processing checkout', error);
    res.status(500).json({ success: false, message: 'Unable to process checkout.' });
  }
});

app.patch('/orders/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    if (!allowedOrderStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid order status.' });
    }
});

// ================== START SERVER ==================
app.listen(port, (error) => {
    if (!error) console.log(`Server is running on port ${port}`);
    else console.log("Error occurred, server can't start", error);
});
