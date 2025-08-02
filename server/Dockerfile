# ========================================================================
# GARAADKA LAUNDRY MANAGEMENT SYSTEM - PRODUCTION DOCKERFILE
# ========================================================================
# Multi-stage build for optimized production image
# ========================================================================

# Stage 1: Build stage
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY . .

# Build the application (if needed)
RUN npm run build || echo "No build step required"

# Stage 2: Production stage
FROM node:18-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create app user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S garaadka -u 1001

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy built application from builder stage
COPY --from=builder --chown=garaadka:nodejs /app .

# Remove development files
RUN rm -rf test* *.md Dockerfile* docker-compose* .git* .env.example

# Create necessary directories
RUN mkdir -p logs && chown garaadka:nodejs logs

# Switch to non-root user
USER garaadka

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"

# Start the application
ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "run", "start:prod"]