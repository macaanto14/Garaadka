# Garaadka Laundry Management System - Docker Cloud Migration

This guide provides comprehensive instructions for containerizing and deploying your Garaadka Laundry Management System using Docker and Kubernetes to various cloud platforms.

## 📋 Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Docker Setup](#docker-setup)
- [Local Development](#local-development)
- [Production Deployment](#production-deployment)
- [Kubernetes Deployment](#kubernetes-deployment)
- [Cloud Platform Deployment](#cloud-platform-deployment)
- [Monitoring and Logging](#monitoring-and-logging)
- [Security Considerations](#security-considerations)
- [Troubleshooting](#troubleshooting)

## 🎯 Overview

The Docker-based cloud migration includes:
- **Multi-stage Docker builds** for optimized production images
- **Docker Compose** configurations for development and production
- **Kubernetes manifests** for container orchestration
- **Nginx reverse proxy** with SSL termination
- **Redis caching** for improved performance
- **Monitoring and logging** setup
- **Security hardening** configurations

## ✅ Prerequisites

### Required Software
- **Docker** (20.10 or higher)
- **Docker Compose** (2.0 or higher)
- **kubectl** (for Kubernetes deployment)
- **Node.js** (16.x or higher) - for local development

### Cloud Platform Requirements
- Container registry access (Docker Hub, AWS ECR, Google GCR, Azure ACR)
- Kubernetes cluster (EKS, GKE, AKS) or Docker hosting service
- Load balancer and SSL certificate management

## 🐳 Docker Setup

### Build Docker Images

```bash
# Make build script executable
chmod +x scripts/docker-build.sh

# Build images
./scripts/docker-build.sh

# Or build manually
docker build -f Dockerfile -t garaadka/laundry-app:latest .
docker build -f Dockerfile.dev -t garaadka/laundry-app:dev .
```

### Push to Registry

```bash
# Tag for your registry
docker tag garaadka/laundry-app:latest your-registry/garaadka/laundry-app:latest

# Push to registry
docker push your-registry/garaadka/laundry-app:latest
```

## 🔧 Local Development

### Quick Start with Docker Compose

```bash
# Start development environment
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Development Services

| Service | Port | Description |
|---------|------|-------------|
| Application | 5000 | Node.js API server with hot reload |
| Database | 3306 | MariaDB with sample data |
| Redis | 6379 | Caching layer |
| Nginx | 80/443 | Reverse proxy with SSL |

### Development Commands

```bash
# Rebuild and restart specific service
docker-compose up -d --build app

# Execute commands in running container
docker-compose exec app npm run test

# Access database
docker-compose exec database mysql -u garaadka_user -p loundary

# View application logs
docker-compose logs -f app

# Scale application instances
docker-compose up -d --scale app=3
```

## 🚀 Production Deployment

### Using Docker Compose

```bash
# Deploy to production
chmod +x scripts/deploy-docker.sh
./scripts/deploy-docker.sh production

# Or manually
docker-compose -f docker-compose.prod.yml up -d
```

### Environment Configuration

1. **Copy and update environment file:**
```bash
cp .env.production.example .env.production
# Edit .env.production with your production values
```

2. **Generate SSL certificates:**
```bash
# For Let's Encrypt (recommended)
certbot certonly --standalone -d your-domain.com

# Copy certificates
cp /etc/letsencrypt/live/your-domain.com/fullchain.pem docker/ssl/cert.pem
cp /etc/letsencrypt/live/your-domain.com/privkey.pem docker/ssl/key.pem
```

3. **Update database connection:**
```env
DB_HOST=your-cloud-database-host
DB_USER=your-database-user
DB_PASSWORD=your-secure-password
DB_SSL=true
```

## ☸️ Kubernetes Deployment

### Prerequisites

```bash
# Install kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
chmod +x kubectl
sudo mv kubectl /usr/local/bin/

# Verify cluster access
kubectl cluster-info
```

### Deploy to Kubernetes

```bash
# Deploy using script
chmod +x scripts/deploy-kubernetes.sh
./scripts/deploy-kubernetes.sh

# Or deploy manually
kubectl apply -f kubernetes/
```

### Kubernetes Resources

| Resource | Description |
|----------|-------------|
| Namespace | Isolated environment for the application |
| ConfigMap | Non-sensitive configuration data |
| Secret | Sensitive data (passwords, tokens) |
| Deployment | Application pods with replica management |
| Service | Internal load balancing |
| Ingress | External access and SSL termination |

### Kubernetes Management

```bash
# Check deployment status
kubectl get pods -n garaadka
kubectl get services -n garaadka
kubectl get ingress -n garaadka

# View logs
kubectl logs -f deployment/garaadka-app -n garaadka

# Scale deployment
kubectl scale deployment garaadka-app --replicas=5 -n garaadka

# Update deployment
kubectl set image deployment/garaadka-app garaadka-app=garaadka/laundry-app:v2.0 -n garaadka

# Port forward for debugging
kubectl port-forward service/garaadka-service 8080:80 -n garaadka
```

## ☁️ Cloud Platform Deployment

### AWS (Amazon Web Services)

#### ECS (Elastic Container Service)
```bash
# Install AWS CLI and ECS CLI
aws configure
ecs-cli configure --cluster garaadka-cluster --region us-west-2

# Create cluster
ecs-cli up --keypair your-keypair --capability-iam --size 2 --instance-type t3.medium

# Deploy
ecs-cli compose --file docker-compose.prod.yml up
```

#### EKS (Elastic Kubernetes Service)
```bash
# Create EKS cluster
eksctl create cluster --name garaadka-cluster --region us-west-2 --nodes 3

# Deploy application
kubectl apply -f kubernetes/
```

### Google Cloud Platform

#### Cloud Run
```bash
# Build and deploy
gcloud builds submit --tag gcr.io/your-project/garaadka-app
gcloud run deploy garaadka-app --image gcr.io/your-project/garaadka-app --platform managed
```

#### GKE (Google Kubernetes Engine)
```bash
# Create GKE cluster
gcloud container clusters create garaadka-cluster --num-nodes=3

# Get credentials
gcloud container clusters get-credentials garaadka-cluster

# Deploy application
kubectl apply -f kubernetes/
```

### Microsoft Azure

#### Container Instances
```bash
# Create resource group
az group create --name garaadka-rg --location eastus

# Deploy container
az container create --resource-group garaadka-rg --name garaadka-app --image garaadka/laundry-app:latest
```

#### AKS (Azure Kubernetes Service)
```bash
# Create AKS cluster
az aks create --resource-group garaadka-rg --name garaadka-cluster --node-count 3

# Get credentials
az aks get-credentials --resource-group garaadka-rg --name garaadka-cluster

# Deploy application
kubectl apply -f kubernetes/
```

## 📊 Monitoring and Logging

### Application Monitoring

```bash
# View application logs
docker-compose logs -f app

# Monitor resource usage
docker stats

# Health check
curl http://localhost/api/health
```

### Database Monitoring

```bash
# Connect to database
docker-compose exec database mysql -u root -p

# Check database status
SHOW PROCESSLIST;
SHOW STATUS LIKE 'Threads_connected';
```

### Prometheus Metrics (Production)

```bash
# Access Prometheus dashboard
http://localhost:9090

# Common queries
up{job="garaadka-app"}
rate(http_requests_total[5m])
mysql_up
```

## 🔒 Security Considerations

### Container Security

1. **Use non-root user in containers**
2. **Scan images for vulnerabilities**
3. **Keep base images updated**
4. **Use multi-stage builds to reduce attack surface**

### Network Security

1. **Use internal networks for service communication**
2. **Implement proper firewall rules**
3. **Enable SSL/TLS for all external communication**
4. **Use secrets management for sensitive data**

### Database Security

1. **Use strong passwords**
2. **Enable SSL connections**
3. **Implement network isolation**
4. **Regular security updates**

## 🛠️ Troubleshooting

### Common Issues

#### Container Won't Start
```bash
# Check container logs
docker logs container-name

# Check resource usage
docker system df
docker system prune
```

#### Database Connection Issues
```bash
# Test database connectivity
docker-compose exec app node -e "
const mysql = require('mysql2/promise');
mysql.createConnection({
  host: 'database',
  user: 'garaadka_user',
  password: 'garaadka_password'
}).then(() => console.log('Connected')).catch(console.error);
"
```

#### SSL Certificate Issues
```bash
# Check certificate validity
openssl x509 -in docker/ssl/cert.pem -text -noout

# Test SSL connection
curl -k https://localhost/api/health
```

#### Performance Issues
```bash
# Monitor resource usage
docker stats

# Check application metrics
curl http://localhost/api/health

# Database performance
docker-compose exec database mysql -e "SHOW PROCESSLIST;"
```

### Debugging Commands

```bash
# Enter running container
docker-compose exec app sh

# Check environment variables
docker-compose exec app env

# Test network connectivity
docker-compose exec app ping database

# Check file permissions
docker-compose exec app ls -la /app
```

## 📈 Scaling and Performance

### Horizontal Scaling

```bash
# Scale with Docker Compose
docker-compose up -d --scale app=3

# Scale with Kubernetes
kubectl scale deployment garaadka-app --replicas=5 -n garaadka
```

### Performance Optimization

1. **Enable Redis caching**
2. **Use connection pooling**
3. **Implement database read replicas**
4. **Use CDN for static assets**
5. **Enable gzip compression**

### Load Testing

```bash
# Install Apache Bench
sudo apt-get install apache2-utils

# Run load test
ab -n 1000 -c 10 http://localhost/api/health
```

## 🔄 Backup and Recovery

### Database Backup

```bash
# Create backup
docker-compose exec database mysqldump -u garaadka_user -p loundary > backup.sql

# Restore backup
docker-compose exec -T database mysql -u garaadka_user -p loundary < backup.sql
```

### Container Data Backup

```bash
# Backup volumes
docker run --rm -v garaadka_database_data:/data -v $(pwd):/backup alpine tar czf /backup/database-backup.tar.gz /data
```

## 📞 Support and Maintenance

### Regular Maintenance Tasks

1. **Update base images monthly**
2. **Monitor security vulnerabilities**
3. **Review and rotate secrets**
4. **Monitor resource usage**
5. **Test backup and recovery procedures**

### Health Checks

```bash
# Application health
curl http://localhost/api/health

# Database health
docker-compose exec database mysqladmin ping

# Redis health
docker-compose exec redis redis-cli ping
```

---

**Note**: Always test deployments in a staging environment before deploying to production.