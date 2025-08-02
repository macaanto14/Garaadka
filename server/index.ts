import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import ordersRouter from './routes/orders.js';
import customersRouter from './routes/customers.js';
import paymentsRouter from './routes/payments.js';
import auditRouter from './routes/audit.js';
import authRouter from './routes/auth.js';
import receiptsRouter from './routes/receipts.js';
import registerRouter from './routes/register.js';
import registerLegacyRouter from './routes/register_legacy.js';
import settingsRouter from './routes/settings.js';

dotenv.config({ path: process.env.NODE_ENV === 'production' ? '/etc/garaadka/.env.production' : '.env' });

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration for Ubuntu server
const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = process.env.CORS_ORIGIN?.split(',').map(o => o.trim()) || [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://45.55.216.189',
      'http://45.55.216.189:3000',
      'http://45.55.216.189:5173',
      'https://45.55.216.189',
      'https://45.55.216.189:3000',
      'https://45.55.216.189:5173'
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
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
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

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  testConnection();
});