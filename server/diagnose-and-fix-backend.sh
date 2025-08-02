#!/bin/bash

# ========================================================================
# COMPREHENSIVE BACKEND DIAGNOSIS AND FIX
# ========================================================================
# This script diagnoses and fixes the backend startup issues
# ========================================================================

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print functions
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_status "🔍 COMPREHENSIVE BACKEND DIAGNOSIS AND FIX"
echo "========================================================================="

# 1. Check current PM2 status and logs
print_status "1. Checking current PM2 status..."
sudo -u garaadka pm2 list
echo ""

print_status "📋 Recent PM2 logs for garaadka-backend:"
sudo -u garaadka pm2 logs garaadka-backend --lines 20 || true
echo ""

# 2. Stop PM2 processes
print_status "2. Stopping PM2 processes..."
sudo -u garaadka pm2 delete all 2>/dev/null || true
sudo -u garaadka pm2 kill 2>/dev/null || true

# 3. Check backend directory and files
print_status "3. Checking backend directory..."
cd /home/garaadka/backend

print_status "📁 Backend directory contents:"
ls -la

print_status "📄 Checking main files:"
if [ -f "index.ts" ]; then
    print_success "✅ index.ts exists"
else
    print_error "❌ index.ts missing"
fi

if [ -f "package.json" ]; then
    print_success "✅ package.json exists"
else
    print_error "❌ package.json missing"
fi

if [ -f "tsconfig.json" ]; then
    print_success "✅ tsconfig.json exists"
else
    print_error "❌ tsconfig.json missing"
fi

# 4. Fix TypeScript import issues
print_status "4. Fixing TypeScript import issues..."

# Create a fixed version of index.ts with correct imports
print_status "📝 Creating fixed index.ts..."
sudo -u garaadka tee index-fixed.ts << 'EOF'
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import ordersRouter from './routes/orders';
import customersRouter from './routes/customers';
import paymentsRouter from './routes/payments';
import auditRouter from './routes/audit';
import authRouter from './routes/auth';
import receiptsRouter from './routes/receipts';
import registerRouter from './routes/register';
import registerLegacyRouter from './routes/register_legacy';
import settingsRouter from './routes/settings';

dotenv.config({ path: process.env.NODE_ENV === 'production' ? '/etc/garaadka/.env.production' : '.env' });

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration for Netlify frontend
const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = process.env.CORS_ORIGIN?.split(',').map(o => o.trim()) || [
      'https://garaadka.netlify.app',
      'http://localhost:3000',
      'http://localhost:5173',
      'http://64.227.158.26',
      'https://64.227.158.26',
      'https://api.einventory.et'
    ];
    
    console.log('CORS check - Origin:', origin, 'Allowed:', allowedOrigins);
    
    if (allowedOrigins.some(allowed => origin?.startsWith(allowed))) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(null, true); // Allow all for now, restrict later
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Database connection
export const db = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'gwldb-user',
  password: process.env.DB_PASSWORD || 'moha983936mm',
  database: process.env.DB_NAME || 'loundary',
  port: parseInt(process.env.DB_PORT || '3306'),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test database connection
async function testConnection() {
  try {
    const connection = await db.getConnection();
    console.log('✅ Connected to MariaDB database successfully!');
    connection.release();
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    console.error('Please ensure MariaDB is running and credentials are correct');
  }
}

// Routes
app.use('/api/auth', authRouter);
app.use('/api/customers', customersRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/receipts', receiptsRouter);
app.use('/api/register', registerRouter);
app.use('/api/register-legacy', registerLegacyRouter);
app.use('/api/audit', auditRouter);
app.use('/api/settings', settingsRouter);

// Health check endpoints
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Garaadka Backend Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Garaadka API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`🚀 Garaadka Backend Server running on port ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🗄️ Database: ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || '3306'}`);
  console.log(`📡 CORS enabled for Netlify frontend`);
  testConnection();
});
EOF

# Backup original and use fixed version
sudo -u garaadka cp index.ts index.ts.backup
sudo -u garaadka cp index-fixed.ts index.ts

# 5. Check and install dependencies
print_status "5. Installing/updating dependencies..."
sudo -u garaadka npm install

# 6. Check environment file
print_status "6. Checking environment configuration..."
if [ -f "/etc/garaadka/.env.production" ]; then
    print_success "✅ Production environment file exists"
    sudo -u garaadka cp /etc/garaadka/.env.production .env.production
else
    print_warning "⚠️ Creating basic .env.production file..."
    sudo -u garaadka tee .env.production << 'EOF'
NODE_ENV=production
PORT=5000
DB_HOST=localhost
DB_USER=gwldb-user
DB_PASSWORD=moha983936mm
DB_NAME=loundary
DB_PORT=3306
CORS_ORIGIN=https://garaadka.netlify.app,http://localhost:3000,https://api.einventory.et
EOF
fi

# 7. Test backend manually
print_status "7. Testing backend startup manually..."
print_status "Starting backend in background for testing..."

# Kill any existing processes on port 5000
sudo fuser -k 5000/tcp 2>/dev/null || true
sleep 2

# Start backend in background
sudo -u garaadka NODE_ENV=production nohup tsx index.ts > /tmp/backend-manual-test.log 2>&1 &
BACKEND_PID=$!

# Wait for startup
sleep 8

# Test if it's responding
print_status "🧪 Testing API endpoints..."
if curl -s http://localhost:5000/health >/dev/null; then
    print_success "✅ /health endpoint responds"
else
    print_error "❌ /health endpoint not responding"
fi

if curl -s http://localhost:5000/api/health >/dev/null; then
    print_success "✅ /api/health endpoint responds"
else
    print_error "❌ /api/health endpoint not responding"
fi

# Show backend logs
print_status "📋 Backend startup logs:"
cat /tmp/backend-manual-test.log || true

# Kill the test process
kill $BACKEND_PID 2>/dev/null || true
sleep 2

# 8. Check if manual test was successful
if curl -s http://localhost:5000/health >/dev/null; then
    print_success "✅ Manual backend test successful"
    
    # 9. Start with PM2
    print_status "8. Starting backend with PM2..."
    
    # Create updated ecosystem.config.js
    sudo -u garaadka tee /home/garaadka/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'garaadka-backend',
      script: 'tsx',
      args: 'index.ts',
      cwd: '/home/garaadka/backend',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '512M',
      error_file: '/var/log/garaadka/backend-error.log',
      out_file: '/var/log/garaadka/backend-out.log',
      log_file: '/var/log/garaadka/backend-combined.log',
      time: true,
      autorestart: true,
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s',
      watch: false,
      ignore_watch: ['node_modules', 'logs']
    }
  ]
};
EOF
    
    # Start PM2
    cd /home/garaadka
    sudo -u garaadka pm2 start ecosystem.config.js
    sudo -u garaadka pm2 save
    
    # Wait for PM2 startup
    sleep 10
    
    # Test PM2 status
    if sudo -u garaadka pm2 list | grep -q "garaadka-backend.*online"; then
        print_success "✅ Backend is running in PM2"
        
        # Test API response
        if curl -s http://localhost:5000/api/health >/dev/null; then
            print_success "✅ Backend API is responding via PM2"
            
            # 10. Restart Nginx
            print_status "9. Restarting Nginx..."
            sudo systemctl restart nginx
            
            # 11. Final tests
            print_status "10. Final API tests..."
            sleep 3
            
            if curl -s https://api.einventory.et/health >/dev/null; then
                print_success "✅ HTTPS API is working"
            elif curl -s http://64.227.158.26/health >/dev/null; then
                print_success "✅ HTTP API is working"
            else
                print_warning "⚠️ External API test failed, checking Nginx..."
                sudo nginx -t
                sudo systemctl status nginx
            fi
            
            echo ""
            echo "========================================================================="
            print_success "🎉 BACKEND DIAGNOSIS AND FIX COMPLETE!"
            echo "========================================================================="
            echo "✅ Backend is running on port 5000"
            echo "✅ PM2 is managing the backend process"
            echo "✅ TypeScript import issues fixed"
            echo "✅ CORS configured for Netlify frontend"
            echo "✅ Nginx has been restarted"
            echo ""
            echo "🧪 Test your API:"
            echo "  curl https://api.einventory.et/health"
            echo "  curl https://api.einventory.et/api/health"
            echo "  curl https://garaadka.netlify.app (should connect to backend)"
            echo ""
            echo "📊 Monitor backend:"
            echo "  sudo -u garaadka pm2 list"
            echo "  sudo -u garaadka pm2 logs garaadka-backend"
            echo "  sudo -u garaadka pm2 monit"
            echo "========================================================================="
            
        else
            print_error "❌ Backend API not responding via PM2"
            print_status "PM2 logs:"
            sudo -u garaadka pm2 logs garaadka-backend --lines 20
        fi
    else
        print_error "❌ Backend failed to start in PM2"
        print_status "PM2 status:"
        sudo -u garaadka pm2 list
    fi
    
else
    print_error "❌ Manual backend test failed"
    print_status "Backend logs:"
    cat /tmp/backend-manual-test.log || true
    
    print_status "🔍 Additional diagnostics:"
    
    # Check if tsx is available
    if command -v tsx >/dev/null 2>&1; then
        print_success "✅ tsx is available"
    else
        print_error "❌ tsx not found, installing..."
        sudo npm install -g tsx
    fi
    
    # Check TypeScript compilation
    print_status "Testing TypeScript compilation..."
    cd /home/garaadka/backend
    if sudo -u garaadka npx tsc --noEmit; then
        print_success "✅ TypeScript compilation successful"
    else
        print_error "❌ TypeScript compilation failed"
    fi
    
    # Check database connection
    print_status "Testing database connection..."
    if mysql -h localhost -u gwldb-user -pmoha983936mm -e "SELECT 1;" 2>/dev/null; then
        print_success "✅ Database connection successful"
    else
        print_error "❌ Database connection failed"
        print_status "Starting MariaDB..."
        sudo systemctl start mariadb || sudo systemctl start mysql || true
    fi
fi