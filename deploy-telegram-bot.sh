#!/bin/bash

# Garaadka Telegram Bot Production Deployment Script
# This script deploys only the Telegram bot without touching the core application

set -e  # Exit on any error

# Configuration
BOT_NAME="garaadka-telegram-bot"
BOT_DIR="/opt/garaadka/telegram-bot"
BOT_SERVICE="garaadka-bot"
BOT_USER="garaadka-bot"
LOG_DIR="/var/log/garaadka"
BACKUP_DIR="/opt/garaadka/backups"
GIT_REPO="https://github.com/your-repo/garaadka.git"
BRANCH="main"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   log_error "This script should not be run as root for security reasons"
   exit 1
fi

# Function to check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check if Node.js is installed
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed. Please install Node.js 18+ first."
        exit 1
    fi
    
    # Check Node.js version
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        log_error "Node.js version 18+ is required. Current version: $(node --version)"
        exit 1
    fi
    
    # Check if npm is installed
    if ! command -v npm &> /dev/null; then
        log_error "npm is not installed."
        exit 1
    fi
    
    # Check if PM2 is installed
    if ! command -v pm2 &> /dev/null; then
        log "Installing PM2..."
        npm install -g pm2
    fi
    
    # Check if git is installed
    if ! command -v git &> /dev/null; then
        log_error "Git is not installed."
        exit 1
    fi
    
    log_success "Prerequisites check completed"
}

# Function to create bot user
create_bot_user() {
    if ! id "$BOT_USER" &>/dev/null; then
        log "Creating bot user: $BOT_USER"
        sudo useradd -r -s /bin/false -d $BOT_DIR $BOT_USER
        log_success "Bot user created"
    else
        log "Bot user already exists"
    fi
}

# Function to setup directories
setup_directories() {
    log "Setting up directories..."
    
    # Create directories
    sudo mkdir -p $BOT_DIR
    sudo mkdir -p $LOG_DIR
    sudo mkdir -p $BACKUP_DIR
    
    # Set permissions
    sudo chown -R $BOT_USER:$BOT_USER $BOT_DIR
    sudo chown -R $BOT_USER:$BOT_USER $LOG_DIR
    sudo chmod 755 $BOT_DIR
    sudo chmod 755 $LOG_DIR
    
    log_success "Directories setup completed"
}

# Function to backup existing installation
backup_existing() {
    if [ -d "$BOT_DIR" ] && [ "$(ls -A $BOT_DIR)" ]; then
        log "Creating backup of existing installation..."
        BACKUP_NAME="telegram-bot-backup-$(date +%Y%m%d-%H%M%S)"
        sudo cp -r $BOT_DIR $BACKUP_DIR/$BACKUP_NAME
        log_success "Backup created: $BACKUP_DIR/$BACKUP_NAME"
    fi
}

# Function to deploy bot code
deploy_bot() {
    log "Deploying Telegram bot..."
    
    # Clone or update repository
    if [ -d "$BOT_DIR/.git" ]; then
        log "Updating existing repository..."
        cd $BOT_DIR
        sudo -u $BOT_USER git fetch origin
        sudo -u $BOT_USER git reset --hard origin/$BRANCH
    else
        log "Cloning repository..."
        sudo rm -rf $BOT_DIR/*
        sudo -u $BOT_USER git clone $GIT_REPO $BOT_DIR
        cd $BOT_DIR
        sudo -u $BOT_USER git checkout $BRANCH
    fi
    
    # Navigate to telegram-bot directory
    cd $BOT_DIR/telegram-bot
    
    # Install dependencies
    log "Installing dependencies..."
    sudo -u $BOT_USER npm ci --production
    
    # Build TypeScript
    log "Building TypeScript..."
    sudo -u $BOT_USER npm run build
    
    log_success "Bot deployment completed"
}

# Function to setup environment
setup_environment() {
    log "Setting up environment..."
    
    ENV_FILE="$BOT_DIR/telegram-bot/.env"
    
    if [ ! -f "$ENV_FILE" ]; then
        log "Creating environment file..."
        sudo -u $BOT_USER cp $BOT_DIR/telegram-bot/.env.example $ENV_FILE
        log_warning "Please configure $ENV_FILE with your settings"
    else
        log "Environment file already exists"
    fi
    
    # Set secure permissions on env file
    sudo chmod 600 $ENV_FILE
    sudo chown $BOT_USER:$BOT_USER $ENV_FILE
    
    log_success "Environment setup completed"
}

# Function to create PM2 ecosystem file
setup_pm2() {
    log "Setting up PM2 configuration..."
    
    cat > /tmp/ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: '$BOT_SERVICE',
    script: '$BOT_DIR/telegram-bot/bot.js',
    cwd: '$BOT_DIR/telegram-bot',
    user: '$BOT_USER',
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: '$LOG_DIR/bot-error.log',
    out_file: '$LOG_DIR/bot-out.log',
    log_file: '$LOG_DIR/bot-combined.log',
    time: true,
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
    restart_delay: 4000
  }]
};
EOF

    sudo mv /tmp/ecosystem.config.js $BOT_DIR/ecosystem.config.js
    sudo chown $BOT_USER:$BOT_USER $BOT_DIR/ecosystem.config.js
    
    log_success "PM2 configuration created"
}

# Function to setup systemd service
setup_systemd() {
    log "Setting up systemd service..."
    
    cat > /tmp/$BOT_SERVICE.service << EOF
[Unit]
Description=Garaadka Telegram Bot
After=network.target
Wants=network.target

[Service]
Type=forking
User=$BOT_USER
Group=$BOT_USER
WorkingDirectory=$BOT_DIR/telegram-bot
ExecStart=/usr/bin/pm2 start $BOT_DIR/ecosystem.config.js --no-daemon
ExecReload=/usr/bin/pm2 reload $BOT_DIR/ecosystem.config.js
ExecStop=/usr/bin/pm2 stop $BOT_DIR/ecosystem.config.js
Restart=always
RestartSec=10
KillMode=process

[Install]
WantedBy=multi-user.target
EOF

    sudo mv /tmp/$BOT_SERVICE.service /etc/systemd/system/
    sudo systemctl daemon-reload
    sudo systemctl enable $BOT_SERVICE
    
    log_success "Systemd service configured"
}

# Function to setup log rotation
setup_logrotate() {
    log "Setting up log rotation..."
    
    cat > /tmp/garaadka-bot << EOF
$LOG_DIR/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 $BOT_USER $BOT_USER
    postrotate
        /usr/bin/pm2 reloadLogs
    endscript
}
EOF

    sudo mv /tmp/garaadka-bot /etc/logrotate.d/
    
    log_success "Log rotation configured"
}

# Function to setup firewall (if needed)
setup_firewall() {
    if command -v ufw &> /dev/null; then
        log "Configuring firewall..."
        # Bot doesn't need incoming connections, only outgoing to Telegram API
        log_success "Firewall configuration completed"
    fi
}

# Function to start services
start_services() {
    log "Starting Telegram bot service..."
    
    # Stop existing PM2 processes for this bot
    sudo -u $BOT_USER pm2 delete $BOT_SERVICE 2>/dev/null || true
    
    # Start the bot with PM2
    sudo -u $BOT_USER pm2 start $BOT_DIR/ecosystem.config.js
    
    # Save PM2 configuration
    sudo -u $BOT_USER pm2 save
    
    # Start systemd service
    sudo systemctl start $BOT_SERVICE
    
    log_success "Telegram bot service started"
}

# Function to verify deployment
verify_deployment() {
    log "Verifying deployment..."
    
    # Check if service is running
    if sudo systemctl is-active --quiet $BOT_SERVICE; then
        log_success "Service is running"
    else
        log_error "Service is not running"
        sudo systemctl status $BOT_SERVICE
        return 1
    fi
    
    # Check PM2 status
    if sudo -u $BOT_USER pm2 list | grep -q $BOT_SERVICE; then
        log_success "PM2 process is running"
    else
        log_error "PM2 process is not running"
        return 1
    fi
    
    # Check logs for errors
    if sudo tail -n 20 $LOG_DIR/bot-error.log | grep -q "ERROR"; then
        log_warning "Errors found in logs. Check $LOG_DIR/bot-error.log"
    fi
    
    log_success "Deployment verification completed"
}

# Function to show status
show_status() {
    echo
    log_success "=== Garaadka Telegram Bot Deployment Complete ==="
    echo
    echo "📁 Bot Directory: $BOT_DIR"
    echo "📋 Service Name: $BOT_SERVICE"
    echo "👤 Bot User: $BOT_USER"
    echo "📄 Logs Directory: $LOG_DIR"
    echo "💾 Backup Directory: $BACKUP_DIR"
    echo
    echo "🔧 Management Commands:"
    echo "  sudo systemctl start $BOT_SERVICE    # Start bot"
    echo "  sudo systemctl stop $BOT_SERVICE     # Stop bot"
    echo "  sudo systemctl restart $BOT_SERVICE  # Restart bot"
    echo "  sudo systemctl status $BOT_SERVICE   # Check status"
    echo
    echo "📊 PM2 Commands:"
    echo "  sudo -u $BOT_USER pm2 list           # List processes"
    echo "  sudo -u $BOT_USER pm2 logs $BOT_SERVICE  # View logs"
    echo "  sudo -u $BOT_USER pm2 restart $BOT_SERVICE # Restart"
    echo
    echo "📄 Log Files:"
    echo "  tail -f $LOG_DIR/bot-combined.log    # Combined logs"
    echo "  tail -f $LOG_DIR/bot-error.log       # Error logs"
    echo "  tail -f $LOG_DIR/bot-out.log         # Output logs"
    echo
}

# Main deployment function
main() {
    log "Starting Garaadka Telegram Bot deployment..."
    
    check_prerequisites
    create_bot_user
    setup_directories
    backup_existing
    deploy_bot
    setup_environment
    setup_pm2
    setup_systemd
    setup_logrotate
    setup_firewall
    start_services
    verify_deployment
    show_status
    
    log_success "Deployment completed successfully!"
}

# Handle script arguments
case "${1:-}" in
    "start")
        sudo systemctl start $BOT_SERVICE
        ;;
    "stop")
        sudo systemctl stop $BOT_SERVICE
        ;;
    "restart")
        sudo systemctl restart $BOT_SERVICE
        ;;
    "status")
        sudo systemctl status $BOT_SERVICE
        sudo -u $BOT_USER pm2 list
        ;;
    "logs")
        tail -f $LOG_DIR/bot-combined.log
        ;;
    "update")
        backup_existing
        deploy_bot
        sudo systemctl restart $BOT_SERVICE
        ;;
    "")
        main
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status|logs|update}"
        echo "  start   - Start the bot service"
        echo "  stop    - Stop the bot service"
        echo "  restart - Restart the bot service"
        echo "  status  - Show service status"
        echo "  logs    - Show live logs"
        echo "  update  - Update bot code and restart"
        echo "  (no args) - Full deployment"
        exit 1
        ;;
esac