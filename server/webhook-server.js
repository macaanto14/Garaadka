const express = require('express');
const crypto = require('crypto');
const { exec } = require('child_process');
const fs = require('fs');

const app = express();
const PORT = 3001; // Different port from your main app
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'your-webhook-secret';
const DEPLOY_SCRIPT = '/usr/local/bin/auto-deploy-backend.sh';

app.use(express.json());

// Verify GitHub webhook signature
function verifySignature(payload, signature) {
    const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET);
    const digest = 'sha256=' + hmac.update(payload).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}

// Webhook endpoint
app.post('/webhook/deploy', (req, res) => {
    const signature = req.headers['x-hub-signature-256'];
    const payload = JSON.stringify(req.body);
    
    // Verify signature
    if (!verifySignature(payload, signature)) {
        console.log('Invalid signature');
        return res.status(401).send('Unauthorized');
    }
    
    // Check if it's a push to main branch
    if (req.body.ref === 'refs/heads/main') {
        console.log('Received push to main branch, triggering deployment...');
        
        // Execute deployment script
        exec(DEPLOY_SCRIPT, (error, stdout, stderr) => {
            if (error) {
                console.error(`Deployment error: ${error}`);
                return res.status(500).send('Deployment failed');
            }
            
            console.log(`Deployment output: ${stdout}`);
            if (stderr) {
                console.error(`Deployment stderr: ${stderr}`);
            }
            
            res.status(200).send('Deployment triggered successfully');
        });
    } else {
        console.log('Push to non-main branch, ignoring...');
        res.status(200).send('Push to non-main branch, no deployment triggered');
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).send('Webhook server is running');
});

app.listen(PORT, () => {
    console.log(`Webhook server listening on port ${PORT}`);
});