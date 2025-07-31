#!/bin/bash
# ========================================================================
# DOCKER DEPLOYMENT SCRIPT
# ========================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

# Configuration
ENVIRONMENT=${1:-development}
COMPOSE_FILE="docker-compose.yml"

if [ "$ENVIRONMENT" = "production" ]; then
    COMPOSE_FILE="docker-compose.prod.yml"
fi

print_header "Deploying Garaadka Laundry Management System - $ENVIRONMENT"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    print_error "docker-compose is not installed. Please install it and try again."
    exit 1
fi

# Create necessary directories
print_status "Creating necessary directories..."
mkdir -p logs/nginx
mkdir -p docker/ssl

# Generate SSL certificates for development (self-signed)
if [ "$ENVIRONMENT" = "development" ] && [ ! -f "docker/ssl/cert.pem" ]; then
    print_status "Generating self-signed SSL certificates for development..."
    openssl req -x509 -newkey rsa:4096 -keyout docker/ssl/key.pem -out docker/ssl/cert.pem -days 365 -nodes -subj "/C=ET/ST=AA/L=AddisAbaba/O=Garaadka/OU=IT/CN=localhost"
fi

# Pull latest images
print_status "Pulling latest images..."
docker-compose -f $COMPOSE_FILE pull

# Build and start services
print_status "Building and starting services..."
docker-compose -f $COMPOSE_FILE up -d --build

# Wait for services to be healthy
print_status "Waiting for services to be healthy..."
sleep 30

# Check service health
print_status "Checking service health..."
docker-compose -f $COMPOSE_FILE ps

# Test API endpoint
print_status "Testing API endpoint..."
if curl -f http://localhost/api/health > /dev/null 2>&1; then
    print_status "✅ API is responding correctly!"
else
    print_warning "⚠️  API health check failed. Check logs for details."
fi

print_status "Deployment completed!"
print_status "Services are running at:"
print_status "  - API: http://localhost/api"
print_status "  - Health Check: http://localhost/api/health"

if [ "$ENVIRONMENT" = "development" ]; then
    print_status "  - Direct App: http://localhost:5000"
    print_status "  - Database: localhost:3306"
    print_status "  - Redis: localhost:6379"
fi

print_status "To view logs: docker-compose -f $COMPOSE_FILE logs -f"
print_status "To stop services: docker-compose -f $COMPOSE_FILE down"