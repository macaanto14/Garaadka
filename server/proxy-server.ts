import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import { URL } from 'url';

dotenv.config();

const app = express();
const PORT = process.env.PROXY_PORT || 8080;
const TARGET_HOST = '47.236.39.181';
const TARGET_PORT = 5000;

// CORS configuration for proxy
const corsOptions = {
  origin: [
    'https://garaadka.netlify.app',
    'http://localhost:3000',
    'http://localhost:5173'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

// Parse JSON bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simple proxy function
const proxyRequest = (req: express.Request, res: express.Response) => {
  const targetPath = req.url;
  
  const options = {
    hostname: TARGET_HOST,
    port: TARGET_PORT,
    path: `/api${targetPath}`,
    method: req.method,
    headers: {
      ...req.headers,
      host: `${TARGET_HOST}:${TARGET_PORT}`,
      'x-forwarded-for': req.ip,
      'x-forwarded-proto': 'https'
    }
  };

  console.log(`🔄 Proxying ${req.method} ${req.url} -> http://${TARGET_HOST}:${TARGET_PORT}/api${targetPath}`);

  const proxyReq = http.request(options, (proxyRes) => {
    // Set response headers
    res.status(proxyRes.statusCode || 500);
    
    // Copy headers from target response
    Object.keys(proxyRes.headers).forEach(key => {
      if (proxyRes.headers[key]) {
        res.setHeader(key, proxyRes.headers[key] as string);
      }
    });

    // Pipe the response
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (err) => {
    console.error('❌ Proxy request error:', err);
    res.status(500).json({ 
      error: 'Proxy request failed',
      message: err.message 
    });
  });

  // Handle request timeout
  proxyReq.setTimeout(30000, () => {
    console.error('❌ Proxy request timeout');
    res.status(504).json({ error: 'Gateway timeout' });
    proxyReq.destroy();
  });

  // Forward request body for POST/PUT requests
  if (req.method === 'POST' || req.method === 'PUT') {
    proxyReq.write(JSON.stringify(req.body));
  }

  proxyReq.end();
};

// Proxy all /api requests
app.use('/api', proxyRequest);

// Health check for proxy
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Simple proxy server is running',
    target: `http://${TARGET_HOST}:${TARGET_PORT}`,
    timestamp: new Date().toISOString()
  });
});

// Test endpoint to verify backend connectivity
app.get('/test-backend', async (req, res) => {
  try {
    const options = {
      hostname: TARGET_HOST,
      port: TARGET_PORT,
      path: '/health',
      method: 'GET',
      timeout: 5000
    };

    const testReq = http.request(options, (testRes) => {
      let data = '';
      testRes.on('data', chunk => data += chunk);
      testRes.on('end', () => {
        res.json({
          status: 'Backend reachable',
          statusCode: testRes.statusCode,
          response: data
        });
      });
    });

    testReq.on('error', (err) => {
      res.status(500).json({
        status: 'Backend unreachable',
        error: err.message
      });
    });

    testReq.end();
  } catch (error) {
    res.status(500).json({
      status: 'Test failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.listen(PORT, () => {
  console.log(`🔄 Simple proxy server running on port ${PORT}`);
  console.log(`🎯 Proxying to: http://${TARGET_HOST}:${TARGET_PORT}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/health`);
  console.log(`🧪 Backend test: http://localhost:${PORT}/test-backend`);
});