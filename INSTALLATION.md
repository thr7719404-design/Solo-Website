# Installation Guide

## Prerequisites

Before starting, install the following on your system:

### 1. Node.js & npm

**Download and Install:**
- Visit: https://nodejs.org/
- Download the **LTS version** (v20.x or higher)
- Run the installer and follow the prompts
- Verify installation:
  ```powershell
  node --version  # Should show v20.x.x
  npm --version   # Should show 10.x.x
  ```

### 2. PostgreSQL Database

**Option A: Install Locally**
- Visit: https://www.postgresql.org/download/windows/
- Download PostgreSQL 15 or higher
- During installation, note your password for the `postgres` user
- Verify installation:
  ```powershell
  psql --version  # Should show 15.x or higher
  ```

**Option B: Use Docker (Recommended)**
- Install Docker Desktop: https://www.docker.com/products/docker-desktop/
- Start PostgreSQL container:
  ```powershell
  docker run --name solo-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=solo_ecommerce -p 5432:5432 -d postgres:15-alpine
  ```

### 3. Flutter SDK

**Download and Install:**
- Visit: https://docs.flutter.dev/get-started/install/windows
- Download Flutter SDK ZIP
- Extract to `C:\src\flutter` (or your preferred location)
- Add Flutter to PATH:
  1. Open "Edit the system environment variables"
  2. Click "Environment Variables"
  3. Under "User variables", find "Path" and click "Edit"
  4. Click "New" and add `C:\src\flutter\bin`
  5. Click "OK" to save
- Verify installation:
  ```powershell
  flutter doctor
  ```

---

## Backend Setup

### Step 1: Navigate to Backend Directory

```powershell
cd c:\Users\aiman\OneDrive\Desktop\Solo\backend
```

### Step 2: Install Dependencies

```powershell
npm install
```

This will install:
- NestJS framework
- Prisma ORM
- Argon2id password hashing
- JWT authentication
- Security packages (Helmet, Throttler)
- And all other dependencies (~300MB)

**Expected time:** 2-5 minutes

### Step 3: Configure Environment Variables

```powershell
# Copy the example file
Copy-Item .env.example .env

# Open in notepad to edit
notepad .env
```

**Update these values:**

```env
# Database connection
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/solo_ecommerce?schema=public"

# JWT secrets (generate random strings)
JWT_SECRET="your-super-secret-jwt-key-min-32-chars-long"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-min-32-chars-long"

# Stripe keys (get from https://dashboard.stripe.com/test/apikeys)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Frontend URL
FRONTEND_URL="http://localhost:3000"
```

**To generate secure secrets:**
```powershell
# In PowerShell, generate random strings
[System.Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
```

### Step 4: Generate Prisma Client

```powershell
npx prisma generate
```

This creates the Prisma Client from your schema.

### Step 5: Create Database

**If using local PostgreSQL:**
```powershell
createdb solo_ecommerce -U postgres
```

**If using Docker:**
```powershell
# Database already created in Docker run command
```

### Step 6: Run Database Migrations

```powershell
npx prisma migrate dev --name init
```

This creates all tables in your database based on the Prisma schema.

### Step 7: Seed Database with Sample Data

```powershell
npm run seed
```

This creates:
- Admin user: `admin@solo-ecommerce.com` (password: `AdminPassword123!`)
- Test customer: `customer@example.com` (password: `Customer123!`)
- 7 departments
- 18 categories
- 5 brands
- 6 sample products

### Step 8: Start Backend Server

```powershell
npm run start:dev
```

Backend will be available at: **http://localhost:3001/api**

**Test it:**
```powershell
# In another terminal
curl http://localhost:3001/api/health
```

---

## Frontend Setup

### Step 1: Navigate to Frontend Directory

```powershell
cd c:\Users\aiman\OneDrive\Desktop\Solo\frontend
```

### Step 2: Install Flutter Dependencies

```powershell
flutter pub get
```

This downloads all Flutter packages defined in `pubspec.yaml`.

### Step 3: Configure Environment

Open `lib/config/environment.dart` and verify the API URL:

```dart
static const String apiBaseUrl = 'http://localhost:3001/api';
```

### Step 4: Run Flutter Web App

```powershell
flutter run -d chrome
```

Or for Windows desktop:
```powershell
flutter run -d windows
```

Frontend will open in Chrome at: **http://localhost:3000**

---

## Verification Checklist

### Backend Health Check

- [ ] `http://localhost:3001/api/health` returns `{"status":"ok"}`
- [ ] `http://localhost:3001/api/departments` returns list of departments
- [ ] Prisma Studio works: `npx prisma studio` (opens at http://localhost:5555)

### Frontend Health Check

- [ ] Flutter app opens in browser/desktop
- [ ] No compilation errors in terminal
- [ ] Theme loads correctly (Material 3 design)

### Database Verification

Open Prisma Studio to verify data:
```powershell
cd backend
npx prisma studio
```

Check that these tables have data:
- User (2 users: admin + customer)
- Department (7 departments)
- Category (18 categories)
- Brand (5 brands)
- Product (6 products)

---

## Common Issues & Solutions

### Issue: "npm is not recognized"

**Solution:** Node.js not installed or not in PATH
- Install Node.js from https://nodejs.org/
- Restart PowerShell/terminal after installation
- Verify: `node --version`

### Issue: "Cannot connect to database"

**Solution:** PostgreSQL not running or wrong credentials
- Check PostgreSQL is running: `Get-Service postgresql*` (local) or `docker ps` (Docker)
- Verify DATABASE_URL in `.env` file
- Test connection: `psql -U postgres -d solo_ecommerce`

### Issue: "Port 3001 already in use"

**Solution:** Another process using the port
```powershell
# Find process using port 3001
netstat -ano | findstr :3001

# Kill the process (replace PID)
taskkill /PID <PID> /F
```

### Issue: "Prisma Client not generated"

**Solution:** Run generate command
```powershell
npx prisma generate
```

### Issue: "Flutter doctor shows errors"

**Solution:** Install missing dependencies
```powershell
flutter doctor
# Follow the instructions for each missing component
```

### Issue: "CORS errors in browser"

**Solution:** Backend CORS configuration issue
- Verify `FRONTEND_URL` in backend `.env`
- Restart backend server after changing `.env`

---

## Development Workflow

### Daily Development

**1. Start Backend:**
```powershell
cd backend
npm run start:dev  # Runs on port 3001, auto-reloads on changes
```

**2. Start Frontend:**
```powershell
cd frontend
flutter run -d chrome  # Runs on port 3000, hot-reloads on changes
```

**3. View Database:**
```powershell
cd backend
npx prisma studio  # Opens GUI at localhost:5555
```

### Making Database Changes

1. Edit `backend/prisma/schema.prisma`
2. Create migration:
   ```powershell
   npx prisma migrate dev --name description_of_change
   ```
3. Restart backend server

### Testing API Endpoints

**Use Postman or curl:**

```powershell
# Register new user
curl -X POST http://localhost:3001/api/auth/register -H "Content-Type: application/json" -d '{"email":"test@example.com","password":"Test123!","firstName":"Test","lastName":"User"}'

# Login
curl -X POST http://localhost:3001/api/auth/login -H "Content-Type: application/json" -d '{"email":"test@example.com","password":"Test123!"}'

# Get products
curl http://localhost:3001/api/products
```

---

## Next Steps

After installation is complete:

1. **Review the architecture**: Read `ARCHITECTURE.md`
2. **Check security setup**: Read `SECURITY.md`
3. **Explore the API**: Open `http://localhost:3001/api` (Swagger docs if configured)
4. **Start developing**: Follow `TODO.md` for feature implementation roadmap
5. **Test authentication**: Login with `customer@example.com` / `Customer123!`

---

## Quick Reference

| Service | URL | Credentials |
|---------|-----|-------------|
| Backend API | http://localhost:3001/api | - |
| Frontend Web | http://localhost:3000 | - |
| Prisma Studio | http://localhost:5555 | - |
| PostgreSQL | localhost:5432 | postgres / your_password |
| Admin User | - | admin@solo-ecommerce.com / AdminPassword123! |
| Test Customer | - | customer@example.com / Customer123! |

---

## Need Help?

- **Prisma Documentation:** https://www.prisma.io/docs
- **NestJS Documentation:** https://docs.nestjs.com
- **Flutter Documentation:** https://docs.flutter.dev
- **Check logs:** Backend terminal shows detailed error messages
- **Review .env:** Most issues are configuration-related

---

**Installation complete!** 🎉

You now have a fully functional ecommerce platform ready for development.
