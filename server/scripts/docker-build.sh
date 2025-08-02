#!/bin/bash
# ========================================================================
# DOCKER BUILD SCRIPT
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
IMAGE_NAME="garaadka/laundry-app"
VERSION=${1:-latest}
REGISTRY=${DOCKER_REGISTRY:-""}

print_header "Building Garaadka Laundry Management System Docker Image"

# Build development image
print_status "Building development image..."
docker build -f Dockerfile.dev -t ${IMAGE_NAME}:dev .

# Build production image
print_status "Building production image..."
docker build -f Dockerfile -t ${IMAGE_NAME}:${VERSION} .

# Tag latest
if [ "$VERSION" != "latest" ]; then
    docker tag ${IMAGE_NAME}:${VERSION} ${IMAGE_NAME}:latest
fi

# Push to registry if specified
if [ -n "$REGISTRY" ]; then
    print_status "Pushing to registry: $REGISTRY"
    docker tag ${IMAGE_NAME}:${VERSION} ${REGISTRY}/${IMAGE_NAME}:${VERSION}
    docker push ${REGISTRY}/${IMAGE_NAME}:${VERSION}
    
    if [ "$VERSION" != "latest" ]; then
        docker tag ${IMAGE_NAME}:latest ${REGISTRY}/${IMAGE_NAME}:latest
        docker push ${REGISTRY}/${IMAGE_NAME}:latest
    fi
fi

print_status "Build completed successfully!"
print_status "Images created:"
docker images | grep garaadka/laundry-app