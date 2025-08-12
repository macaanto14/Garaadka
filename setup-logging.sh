#!/bin/bash

# Setup comprehensive logging for Garaadka Telegram Bot

LOG_DIR="/var/log/garaadka"
BOT_USER="garaadka-bot"

echo "🔧 Setting up logging infrastructure..."

# Create log directory
sudo mkdir -p $LOG_DIR
sudo chown -R $BOT_USER:$BOT_USER $LOG_DIR
sudo chmod 755 $LOG_DIR

# Install jq for JSON log parsing
if ! command -v jq &> /dev/null; then
    echo "📦 Installing jq for JSON log parsing..."
    sudo apt-get update && sudo apt-get install -y jq
fi

# Setup log rotation
cat > /tmp/garaadka-bot-logs << EOF
$LOG_DIR/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 $BOT_USER $BOT_USER
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
EOF

sudo mv /tmp/garaadka-bot-logs /etc/logrotate.d/

# Make log manager executable
chmod +x log-manager.sh

# Install PM2 log rotate module
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 100M
pm2 set pm2-logrotate:retain 30
pm2 set pm2-logrotate:compress true

echo "✅ Logging setup complete!"
echo ""
echo "📊 Available commands:"
echo "  ./log-manager.sh live      # Real-time logs"
echo "  ./log-manager.sh errors    # Error logs only"
echo "  ./log-manager.sh monitor   # PM2 dashboard"
echo "  pm2 logs garaadka-telegram-bot --lines 100"
echo "  pm2 monit                  # PM2 monitoring"