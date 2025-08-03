#!/bin/bash

# Auto-deployment script for Garaadka Backend Server
# This script pulls the latest changes from GitHub and restarts the server

# Configuration
REPO_URL="https://github.com/macaanto14/Garaadka.git"
PROJECT_DIR="/var/www/garaadka"  # Change this to your actual project directory
SERVER_DIR="$PROJECT_DIR/server"
BRANCH="main"  # Change this if you want to deploy from a different branch
LOG_FILE="/var/log/garaadka-deploy.log"
SERVICE_NAME="garaadka-backend"  # PM2 process name or systemd service name

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to log messages
log_message() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
    log_message "INFO: $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
    log_message "SUCCESS: $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
    log_message "WARNING: $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
    log_message "ERROR: $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to backup current deployment
backup_current() {
    print_status "Creating backup of current deployment..."
    BACKUP_DIR="/var/backups/garaadka/$(date +%Y%m%d_%H%M%S)"
    sudo mkdir -p "$BACKUP_DIR"
    sudo cp -r "$SERVER_DIR" "$BACKUP_DIR/" 2>/dev/null || true
    print_success "Backup created at $BACKUP_DIR"
}

# Function to check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check if git is installed
    if ! command_exists git; then
        print_error "Git is not installed. Please install git first."
        exit 1
    fi
    
    # Check if node is installed
    if ! command_exists node; then
        print_error "Node.js is not installed. Please install Node.js first."
        exit 1
    fi
    
    # Check if npm is installed
    if ! command_exists npm; then
        print_error "npm is not installed. Please install npm first."
        exit 1
    fi
    
    print_success "All prerequisites are met"
}

# Function to setup project directory
setup_project() {
    print_status "Setting up project directory..."
    
    if [ ! -d "$PROJECT_DIR" ]; then
        print_status "Cloning repository for the first time..."
        sudo mkdir -p "$(dirname "$PROJECT_DIR")"
        sudo git clone "$REPO_URL" "$PROJECT_DIR"
        sudo chown -R $USER:$USER "$PROJECT_DIR"
    fi
    
    cd "$PROJECT_DIR" || {
        print_error "Failed to change to project directory"
        exit 1
    }
}

# Function to pull latest changes
pull_changes() {
    print_status "Pulling latest changes from GitHub..."
    
    cd "$PROJECT_DIR" || exit 1
    
    # Fetch latest changes
    git fetch origin "$BRANCH"
    
    # Check if there are any changes
    LOCAL=$(git rev-parse HEAD)
    REMOTE=$(git rev-parse "origin/$BRANCH")
    
    if [ "$LOCAL" = "$REMOTE" ]; then
        print_warning "No new changes found. Deployment skipped."
        return 1
    fi
    
    # Stash any local changes
    git stash push -m "Auto-stash before deployment $(date)"
    
    # Pull latest changes
    git checkout "$BRANCH"
    git pull origin "$BRANCH"
    
    print_success "Successfully pulled latest changes"
    return 0
}

# Function to install dependencies
install_dependencies() {
    print_status "Installing/updating dependencies..."
    
    cd "$SERVER_DIR" || {
        print_error "Server directory not found"
        exit 1
    }
    
    # Install npm dependencies
    npm ci --production
    
    print_success "Dependencies installed successfully"
}

# Function to run database migrations (if any)
run_migrations() {
    print_status "Checking for database migrations..."
    
    cd "$SERVER_DIR" || exit 1
    
    # Check if migrations directory exists
    if [ -d "migrations" ]; then
        print_status "Running database migrations..."
        # Add your migration command here
        # Example: npm run migrate
        print_warning "Migration command not configured. Please add your migration logic."
    else
        print_status "No migrations directory found, skipping..."
    fi
}

# Function to restart the service
restart_service() {
    print_status "Restarting the backend service..."
    
    # Check if PM2 is being used
    if command_exists pm2; then
        if pm2 list | grep -q "$SERVICE_NAME"; then
            print_status "Restarting PM2 process: $SERVICE_NAME"
            pm2 restart "$SERVICE_NAME"
            pm2 save
            print_success "PM2 service restarted successfully"
            return 0
        fi
    fi
    
    # Check if systemd service exists
    if systemctl list-units --type=service | grep -q "$SERVICE_NAME"; then
        print_status "Restarting systemd service: $SERVICE_NAME"
        sudo systemctl restart "$SERVICE_NAME"
        sudo systemctl status "$SERVICE_NAME" --no-pager
        print_success "Systemd service restarted successfully"
        return 0
    fi
    
    # If no service manager found, try to start manually
    print_warning "No service manager found. You may need to restart the server manually."
    print_status "You can start the server with: cd $SERVER_DIR && npm start"
}

# Function to verify deployment
verify_deployment() {
    print_status "Verifying deployment..."
    
    # Wait a moment for the service to start
    sleep 5
    
    # Check if the service is running (adjust port as needed)
    if command_exists curl; then
        if curl -f -s http://localhost:5000/api/health >/dev/null 2>&1; then
            print_success "Backend service is responding correctly"
        else
            print_warning "Backend service health check failed. Please check manually."
        fi
    else
        print_warning "curl not available. Please verify the service manually."
    fi
}

# Function to send notification (optional)
send_notification() {
    local status=$1
    local message=$2
    
    # Add your notification logic here (Slack, Discord, email, etc.)
    # Example for Slack webhook:
    # curl -X POST -H 'Content-type: application/json' \
    #   --data "{\"text\":\"Garaadka Backend Deployment $status: $message\"}" \
    #   YOUR_SLACK_WEBHOOK_URL
    
    print_status "Notification: $status - $message"
}

# Main deployment function
main() {
    print_status "Starting Garaadka Backend Auto-Deployment..."
    print_status "Timestamp: $(date)"
    print_status "Branch: $BRANCH"
    print_status "Project Directory: $PROJECT_DIR"
    
    # Check prerequisites
    check_prerequisites
    
    # Setup project directory
    setup_project
    
    # Create backup
    backup_current
    
    # Pull latest changes
    if ! pull_changes; then
        print_success "Deployment completed - no changes to deploy"
        exit 0
    fi
    
    # Install dependencies
    install_dependencies
    
    # Run migrations
    run_migrations
    
    # Restart service
    restart_service
    
    # Verify deployment
    verify_deployment
    
    # Send success notification
    send_notification "SUCCESS" "Backend deployed successfully"
    
    print_success "Deployment completed successfully!"
    print_status "Check logs at: $LOG_FILE"
}

# Error handling
set -e
trap 'print_error "Deployment failed at line $LINENO. Check logs for details."; send_notification "FAILED" "Deployment failed at line $LINENO"' ERR

# Run main function
main "$@"