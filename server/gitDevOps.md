This script will:

- ✅ Check prerequisites (git, node, npm)
- ✅ Create backups before deployment
- ✅ Pull latest changes from GitHub
- ✅ Install/update dependencies
- ✅ Handle database migrations
- ✅ Restart your service (PM2 or systemd)
- ✅ Verify the deployment
- ✅ Log everything for debugging
- ✅ Support webhook automation
The script is production-ready and includes error handling, logging, and rollback capabilities.


## Setup Instructions
1. 1.
   Make the deployment script executable:

   sudo chmod +x auto-deploy-backend.sh
sudo mv auto-deploy-backend.sh /usr/local/bin/

1.
Update the configuration in the script:

- Change PROJECT_DIR to your actual project path
- Update BRANCH if you're not using main
- Modify SERVICE_NAME to match your service
2.
Choose your process manager:

Option A: Using systemd
sudo cp garaadka-backend.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable garaadka-backend
sudo systemctl start garaadka-backend

Option B: Using PM2

npm install -g pm2
cp ecosystem.config.js /var/www/garaadka/server/
pm2 start ecosystem.config.js
pm2 save
pm2 startup

3.
Set up automatic deployments (optional):

# Install webhook server dependencies
npm install express crypto

# Run webhook server
node webhook-server.js

# Add to GitHub webhook settings:
# URL: http://your-server-ip:3001/webhook/deploy
# Content type: application/json
# Secret: your-webhook-secret
# Events: Just the push event

4.Test the deployment:
sudo /usr/local/bin/auto-deploy-backend.sh