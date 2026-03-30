# Solo E-commerce Application - Quick Start

## Services Status

✅ **Backend API**: Running on http://localhost:3000/api  
✅ **Frontend**: Running on http://localhost:5000

---

## Login Credentials

### Admin Access
- **Email**: `aiman@solo-ecommerce.com`
- **Password**: `Admin123`

OR

- **Email**: `admin@solo-ecommerce.com`  
- **Password**: `AdminPassword123!`

### Customer Access
- **Email**: `customer@example.com`
- **Password**: `Customer123!`

---

## Access the Application

1. Open your browser to: **http://localhost:5000**
2. Use the credentials above to login

---

## Available API Endpoints

- Products: http://localhost:3000/api/products
- Auth: http://localhost:3000/api/auth/login
- Health Check: http://localhost:3000/api/health
- API Root: http://localhost:3000/api

---

## Start/Stop Services

### Start All Services
Double-click: `START-APP.bat`

OR

Use the desktop batch files:
- `start-services.bat` - Start all services
- `stop-services.bat` - Stop all services

### Manual Start

**Backend:**
```powershell
cd C:\Users\thr49\Test-website\backend
npm run start:dev
```

**Frontend:**
```powershell
cd C:\Users\thr49\Test-website\frontend
flutter build web
C:\Users\thr49\AppData\Local\Pub\Cache\bin\dhttpd.bat --host=0.0.0.0 --port=5000 --path=build/web
```

---

## Troubleshooting

### Backend not starting
1. Check PostgreSQL is running
2. Verify database connections in `backend/.env`
3. Check port 3000 is available

### Frontend not loading
1. Ensure backend is running first
2. Check browser console for errors
3. Verify port 5000 is available
4. Try rebuilding: `cd frontend && flutter build web`

### Login fails
1. Verify backend is running: http://localhost:3000/api/health
2. Check browser console for CORS errors
3. Ensure you're using the correct credentials above
4. Try resetting database: `cd backend && npm run seed`

---

**Last Updated**: December 28, 2025
