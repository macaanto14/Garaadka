import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';
import ordersRouter from './routes/orders.js';
import customersRouter from './routes/customers.js';
import paymentsRouter from './routes/payments.js';
import auditRouter from './routes/audit.js';
import authRouter from './routes/auth.js';
import receiptsRouter from './routes/receipts.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const HTTPS_PORT = process.env.HTTPS_PORT || 5443;

// Enhanced CORS configuration for production
const corsOptions = {
  origin: [
    'https://garaadka.netlify.app',
    'http://localhost:3000',
    'http://localhost:5173',
    'https://localhost:5173'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Security headers for HTTPS
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  if (req.secure) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
});

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
app.use('/api/audit', auditRouter);
app.use('/api/receipts', receiptsRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Server is running',
    protocol: req.secure ? 'HTTPS' : 'HTTP',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Function to create HTTPS server with SSL certificates
function createHttpsServer() {
  try {
    const sslPath = process.env.SSL_PATH || './ssl';
    const privateKey = fs.readFileSync(path.join(sslPath, 'private.key'), 'utf8');
    const certificate = fs.readFileSync(path.join(sslPath, 'certificate.crt'), 'utf8');
    const ca = fs.existsSync(path.join(sslPath, 'ca_bundle.crt')) 
      ? fs.readFileSync(path.join(sslPath, 'ca_bundle.crt'), 'utf8') 
      : undefined;

    const credentials = {
      key: privateKey,
      cert: certificate,
      ...(ca && { ca: ca })
    };

    const httpsServer = https.createServer(credentials, app);
    
    httpsServer.listen(HTTPS_PORT, () => {
      console.log(`🔒 HTTPS Server running on port ${HTTPS_PORT}`);
      testConnection();
    });

    return httpsServer;
  } catch (error) {
    console.error('❌ Failed to create HTTPS server:', error);
    console.log('📝 Falling back to HTTP server...');
    return null;
  }
}

// Start servers
const httpsServer = createHttpsServer();

// Always run HTTP server as fallback
const httpServer = http.createServer(app);
httpServer.listen(PORT, () => {
  console.log(`🚀 HTTP Server running on port ${PORT}`);
  if (!httpsServer) {
    testConnection();
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  httpServer.close(() => {
    console.log('HTTP server closed');
  });
  if (httpsServer) {
    httpsServer.close(() => {
      console.log('HTTPS server closed');
    });
  }
});