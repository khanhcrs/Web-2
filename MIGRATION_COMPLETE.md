# 📝 Migration Summary: Vercel/Render → Local PostgreSQL

## ✅ What's Been Done

Tôi đã chuẩn bị toàn bộ setup cho bạn chuyển từ Vercel/Render deployment sang local development với PostgreSQL.

### 📁 Files Created/Updated

#### 1. **Documentation**
- [README.md](README.md) - Updated with local setup instructions
- [SETUP_LOCAL_POSTGRESQL.md](SETUP_LOCAL_POSTGRESQL.md) - Comprehensive PostgreSQL setup guide
- [QUICK_START_LOCAL.md](QUICK_START_LOCAL.md) - 5-minute quick start guide
- [FRONTEND_API_CONFIG.md](FRONTEND_API_CONFIG.md) - Frontend API configuration guide

#### 2. **Backend Configuration**
- `backend/.env.example` - Environment variables template
- `backend/index.js` - Updated to use environment variables (dotenv support)

#### 3. **Setup Scripts**
- `scripts/setup-postgres.sh` - Automated PostgreSQL setup (create user, database, schema)
- `scripts/start-local-dev.sh` - One-command startup for all services
- `scripts/verify-setup.sh` - Verification checklist to ensure everything is configured correctly

---

## 🚀 Getting Started (Step-by-step)

### Step 1: Install PostgreSQL (if not already installed)

**macOS:**
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install postgresql
sudo systemctl start postgresql
```

**Windows:**
- Download from https://www.postgresql.org/download/windows/
- Follow the installer

---

### Step 2: Setup Database

```bash
# Make script executable
chmod +x scripts/setup-postgres.sh

# Run the setup script
./scripts/setup-postgres.sh
```

This will:
- ✅ Create PostgreSQL user `clothify_user`
- ✅ Create database `clothify`
- ✅ Create all tables from `backend/db.sql`

---

### Step 3: Verify Everything is Working

```bash
chmod +x scripts/verify-setup.sh
./scripts/verify-setup.sh
```

This checks:
- ✅ PostgreSQL is running
- ✅ Database and user exist
- ✅ All tables are created
- ✅ Dependencies are installed
- ✅ Required ports are available

---

### Step 4: Start the Application

**Option A: Automated (Recommended)**

```bash
chmod +x scripts/start-local-dev.sh
./scripts/start-local-dev.sh
```

The script will:
1. Check PostgreSQL is running
2. Install missing dependencies
3. Create `.env` file if needed
4. Start backend on `http://localhost:4000`
5. Ask if you want to start frontend/admin

**Option B: Manual**

Open 3 terminals:

```bash
# Terminal 1 - Backend
cd backend
npm install  # (if needed)
npm start
# → Backend runs on http://localhost:4000

# Terminal 2 - Frontend
cd frontend
npm install  # (if needed)
npm start
# → Frontend runs on http://localhost:3000

# Terminal 3 - Admin Dashboard (optional)
cd admin/app
npm install  # (if needed)
npm run dev
# → Admin runs on http://localhost:5173
```

---

## 🔧 Configuration

### Backend Environment Variables

File: `backend/.env`

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=clothify
DB_USER=clothify_user        # User created by setup script
DB_PASSWORD=kt123456         # Default password (change if needed)
JWT_SECRET=secret_ecom
NODE_ENV=development
PORT=4000
```

**Note:** The setup script uses these credentials. If you change them, update `backend/.env` accordingly.

### Frontend API Configuration

The frontend will automatically use the local backend. No additional changes needed if you use the environment variable approach:

```bash
# Create frontend/.env
echo "REACT_APP_API_URL=http://localhost:4000" > frontend/.env
```

---

## 📊 Database Credentials

**Default credentials (created by setup script):**

| Parameter | Value |
|-----------|-------|
| Username | `clothify_user` |
| Password | `kt123456` |
| Database | `clothify` |
| Host | `localhost` |
| Port | `5432` |

**Default Admin Account:**
- Email: `admin@clothify.com`
- Password: `Admin@123`

---

## 🧪 Testing

### Test Backend API
```bash
# Check if backend is running
curl http://localhost:4000/

# Get all products
curl http://localhost:4000/allproducts

# Get users
curl http://localhost:4000/users
```

### Test Database Connection
```bash
# Connect to database
psql -U clothify_user -d clothify -h localhost

# List tables
\dt

# Check if tables have data
SELECT COUNT(*) FROM products;
SELECT COUNT(*) FROM users;

# Quit
\q
```

---

## 🐛 Troubleshooting

### PostgreSQL not running

```bash
# macOS
brew services start postgresql@15
brew services list  # Check status

# Linux
sudo systemctl start postgresql
sudo systemctl status postgresql
```

### Connection refused

```bash
# Check if PostgreSQL is listening
psql -U postgres -h localhost -c "\q"

# If failed, check PostgreSQL is installed and running
which psql
```

### Port 4000 already in use

```bash
# Find what's using port 4000
lsof -i :4000

# Kill the process (if safe)
kill -9 <PID>

# Or change PORT in backend/.env
```

### Database reset

```bash
# Drop everything and recreate
psql -U postgres << EOF
DROP DATABASE IF EXISTS clothify;
DROP USER IF EXISTS clothify_user;
EOF

# Run setup again
./scripts/setup-postgres.sh
```

---

## 📚 Additional Resources

### Guides in this project
- [SETUP_LOCAL_POSTGRESQL.md](SETUP_LOCAL_POSTGRESQL.md) - Detailed PostgreSQL setup
- [QUICK_START_LOCAL.md](QUICK_START_LOCAL.md) - Quick reference
- [FRONTEND_API_CONFIG.md](FRONTEND_API_CONFIG.md) - Frontend API setup
- [README.md](README.md) - Project overview

### External tools
- **DBeaver** - Free PostgreSQL GUI: https://dbeaver.io/
- **pgAdmin** - Web-based PostgreSQL admin: https://www.pgadmin.org/
- **Postman** - API testing: https://www.postman.com/

### Commands reference

```bash
# View all PostgreSQL services
brew services list

# View backend logs
tail -f backend.log

# Kill all Node processes
pkill -f "npm start"
pkill -f "npm run dev"

# Check what's using a port
lsof -i :4000
netstat -an | grep 4000

# PostgreSQL backup
pg_dump -U clothify_user clothify > backup.sql

# PostgreSQL restore
psql -U clothify_user clothify < backup.sql
```

---

## ✨ Next Steps

1. **Run the verification script:**
   ```bash
   chmod +x scripts/verify-setup.sh
   ./scripts/verify-setup.sh
   ```

2. **Start the application:**
   ```bash
   chmod +x scripts/start-local-dev.sh
   ./scripts/start-local-dev.sh
   ```

3. **Access the applications:**
   - Backend API: http://localhost:4000
   - Frontend Store: http://localhost:3000
   - Admin Dashboard: http://localhost:5173

4. **Make changes and develop locally!**

---

## 💡 Tips

1. **Keep PostgreSQL running:** It needs to be running while you develop
2. **Use `.env` file:** Keep sensitive data out of source control
3. **Regular backups:** Back up your local database periodically
4. **Check logs:** Use `tail -f backend.log` to see real-time errors
5. **Test APIs:** Use curl, Postman, or browser DevTools to test APIs

---

## 🎯 Checklist

- [ ] Install PostgreSQL
- [ ] Run `./scripts/setup-postgres.sh`
- [ ] Run `./scripts/verify-setup.sh` (should pass all checks)
- [ ] Copy `.env.example` to `.env` if needed
- [ ] Run `./scripts/start-local-dev.sh`
- [ ] Access http://localhost:4000 (backend)
- [ ] Access http://localhost:3000 (frontend)
- [ ] Login with admin account

---

## ❓ FAQ

**Q: Do I need to keep PostgreSQL running?**
A: Yes, the backend needs PostgreSQL running at all times during development.

**Q: Can I use a different database?**
A: Yes, update `backend/.env` with your database credentials, but the schema is designed for PostgreSQL.

**Q: How do I change the password?**
A: Update `DB_PASSWORD` in `backend/.env` and re-run the setup script.

**Q: Can I use a different port?**
A: Yes, update `PORT` in `backend/.env` and the startup script will use it.

**Q: How do I backup my database?**
A: `pg_dump -U clothify_user clothify > backup.sql`

---

**That's it! You're ready to go. Happy coding! 🚀**

For detailed guides, see:
- [SETUP_LOCAL_POSTGRESQL.md](SETUP_LOCAL_POSTGRESQL.md)
- [QUICK_START_LOCAL.md](QUICK_START_LOCAL.md)
- [README.md](README.md)
