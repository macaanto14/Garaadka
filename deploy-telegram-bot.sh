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
GIT_REPO="https://github.com/macaanto14/Garaadka.git"
BRANCH="main"
CURRENT_DIR="$(pwd)"

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

# Check if running as root for service management
check_root_for_service() {
    if [ "$EUID" -ne 0 ] && [ "$1" = "install" ]; then
        log_error "Service installation requires root privileges. Please run with sudo."
        exit 1
    fi
}

# Function to check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check if Node.js is installed
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed. Installing Node.js..."
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
        sudo apt-get install -y nodejs
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
    
    # Check if PM2 is installed globally
    if ! command -v pm2 &> /dev/null; then
        log "Installing PM2 globally..."
        sudo npm install -g pm2
    fi
    
    log_success "Prerequisites check completed"
}

# Function to create bot user
create_bot_user() {
    if ! id "$BOT_USER" &>/dev/null; then
        log "Creating bot user: $BOT_USER"
        sudo useradd -r -s /bin/bash -m -d /home/$BOT_USER $BOT_USER
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
    if [ -d "$BOT_DIR" ] && [ "$(ls -A $BOT_DIR 2>/dev/null)" ]; then
        log "Creating backup of existing installation..."
        BACKUP_NAME="telegram-bot-backup-$(date +%Y%m%d-%H%M%S)"
        sudo mkdir -p $BACKUP_DIR
        sudo cp -r $BOT_DIR $BACKUP_DIR/$BACKUP_NAME
        log_success "Backup created: $BACKUP_DIR/$BACKUP_NAME"
    fi
}

# Function to deploy bot code from current directory
deploy_bot() {
    log "Deploying Telegram bot from current directory..."
    
    # Copy telegram-bot directory to deployment location
    if [ -d "$CURRENT_DIR/telegram-bot" ]; then
        log "Copying telegram-bot directory..."
        sudo rm -rf $BOT_DIR/*
        sudo cp -r $CURRENT_DIR/telegram-bot/* $BOT_DIR/
        sudo chown -R $BOT_USER:$BOT_USER $BOT_DIR
    else
        log_error "telegram-bot directory not found in current directory"
        exit 1
    fi
    
    # Navigate to bot directory
    cd $BOT_DIR
    
    # Install dependencies
    log "Installing dependencies..."
    sudo -u $BOT_USER npm install
    
    # Build TypeScript if tsconfig exists
    if [ -f "tsconfig.json" ]; then
        log "Building TypeScript..."
        sudo -u $BOT_USER npm run build 2>/dev/null || log_warning "Build failed, will run TypeScript directly"
    fi
    
    log_success "Bot deployment completed"
}

# Function to setup environment
setup_environment() {
    log "Setting up environment..."
    
    ENV_FILE="$BOT_DIR/.env"
    
    if [ ! -f "$ENV_FILE" ]; then
        log "Environment file not found, copying from source..."
        if [ -f "$CURRENT_DIR/telegram-bot/.env" ]; then
            sudo cp $CURRENT_DIR/telegram-bot/.env $ENV_FILE
        else
            log_warning "No .env file found. Please create $ENV_FILE manually"
        fi
    else
        log "Environment file already exists"
    fi
    
    # Set secure permissions on env file
    if [ -f "$ENV_FILE" ]; then
        sudo chmod 600 $ENV_FILE
        sudo chown $BOT_USER:$BOT_USER $ENV_FILE
    fi
    
    log_success "Environment setup completed"
}

# Function to create PM2 ecosystem file
setup_pm2() {
    log "Setting up PM2 configuration..."
    
    # Determine script file (prefer .js, fallback to .ts)
    SCRIPT_FILE="bot.js"
    if [ ! -f "$BOT_DIR/bot.js" ] && [ -f "$BOT_DIR/bot.ts" ]; then
        SCRIPT_FILE="bot.ts"
    fi
    
    cat > /tmp/ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: '$BOT_SERVICE',
    script: '$BOT_DIR/$SCRIPT_FILE',
    cwd: '$BOT_DIR',
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    max_memory_restart: '500M',
    interpreter: '$SCRIPT_FILE' === 'bot.ts' ? 'npx' : 'node',
    interpreter_args: '$SCRIPT_FILE' === 'bot.ts' ? 'tsx' : '',
    env: {
      NODE_ENV: 'production'
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
Type=simple
User=$BOT_USER
Group=$BOT_USER
WorkingDirectory=$BOT_DIR
ExecStart=/usr/bin/pm2-runtime start $BOT_DIR/ecosystem.config.js
ExecStop=/usr/bin/pm2 stop $BOT_DIR/ecosystem.config.js
Restart=always
RestartSec=10
KillMode=mixed
KillSignal=SIGTERM
TimeoutStopSec=30

# Environment
Environment=NODE_ENV=production
Environment=PATH=/usr/bin:/usr/local/bin

# Security
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=$BOT_DIR $LOG_DIR

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
        systemctl reload $BOT_SERVICE
    endscript
}
EOF

    sudo mv /tmp/garaadka-bot /etc/logrotate.d/
    
    log_success "Log rotation configured"
}

# Function to start services
start_services() {
    log "Starting Telegram bot service..."
    
    # Ensure PM2 is stopped for this user
    sudo -u $BOT_USER pm2 kill 2>/dev/null || true
    
    # Start systemd service
    sudo systemctl start $BOT_SERVICE
    
    # Wait a moment for service to start
    sleep 3
    
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
        sudo systemctl status $BOT_SERVICE --no-pager
        return 1
    fi
    
    # Check logs for startup
    sleep 2
    if [ -f "$LOG_DIR/bot-combined.log" ]; then
        log "Recent log entries:"
        sudo tail -n 10 $LOG_DIR/bot-combined.log
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
    echo "📄 Log Files:"
    echo "  sudo tail -f $LOG_DIR/bot-combined.log    # Combined logs"
    echo "  sudo tail -f $LOG_DIR/bot-error.log       # Error logs"
    echo "  sudo tail -f $LOG_DIR/bot-out.log         # Output logs"
    echo
}

# Main deployment function
main() {
    check_root_for_service "install"
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
    start_services
    verify_deployment
    show_status
    
    log_success "Deployment completed successfully!"
}

# Handle script arguments
case "${1:-}" in
    "start")
        if sudo systemctl list-unit-files | grep -q "$BOT_SERVICE.service"; then
            sudo systemctl start $BOT_SERVICE
            log_success "Bot service started"
        else
            log_error "Service not installed. Run without arguments to install first."
            exit 1
        fi
        ;;
    "stop")
        sudo systemctl stop $BOT_SERVICE
        log_success "Bot service stopped"
        ;;
    "restart")
        sudo systemctl restart $BOT_SERVICE
        log_success "Bot service restarted"
        ;;
    "status")
        sudo systemctl status $BOT_SERVICE --no-pager
        echo
        echo "=== Log tail ==="
        sudo tail -n 20 $LOG_DIR/bot-combined.log 2>/dev/null || echo "No logs found"
        ;;
    "logs")
        sudo tail -f $LOG_DIR/bot-combined.log
        ;;
    "update")
        backup_existing
        deploy_bot
        sudo systemctl restart $BOT_SERVICE
        log_success "Bot updated and restarted"
        ;;
    "install")
        main
        ;;
    "")
        main
        ;;
    *)
        echo "Usage: $0 {install|start|stop|restart|status|logs|update}"
        echo "  install - Full installation (default)"
        echo "  start   - Start the bot service"
        echo "  stop    - Stop the bot service"
        echo "  restart - Restart the bot service"
        echo "  status  - Show service status"
        echo "  logs    - Show live logs"
        echo "  update  - Update bot code and restart"
        exit 1
        ;;
esac