# Garaadka Laundry Management System - Production Deployment Checklist

## Pre-Deployment Checklist

### 1. Database Preparation
- [ ] Backup existing production database (if any)
- [ ] Verify database server is running and accessible
- [ ] Create production database user with appropriate permissions
- [ ] Test database connection from application server

### 2. Environment Configuration
- [ ] Copy `.env.production` to production server
- [ ] Update all database credentials in `.env.production`
- [ ] Generate secure JWT secret (minimum 32 characters)
- [ ] Configure SSL certificates (if using HTTPS)
- [ ] Set appropriate file permissions on `.env.production` (600)

### 3. Security Configuration
- [ ] Change default admin password after first login
- [ ] Configure firewall rules
- [ ] Set up SSL/TLS certificates
- [ ] Configure CORS origins for frontend domain
- [ ] Enable rate limiting
- [ ] Review and update security headers

### 4. Application Dependencies
- [ ] Install Node.js (v18 or higher)
- [ ] Install npm dependencies: `npm install --production`
- [ ] Install jsonwebtoken: `npm install jsonwebtoken`
- [ ] Install @types/jsonwebtoken: `npm install --save-dev @types/jsonwebtoken`
- [ ] Build TypeScript: `npm run build`

## Deployment Steps

### 1. Database Migration
```bash
# Connect to your production database and run:
mysql -u your_user -p your_database < production_migration.sql
```

### 2. Application Deployment
```bash
# Copy application files to production server
# Install dependencies
npm install --production

# Build application
npm run build

# Start application (use PM2 or similar for production)
npm start
```

### 3. Verification Steps
- [ ] Verify database tables are created correctly
- [ ] Test admin login with default credentials
- [ ] Test API endpoints with Postman collection
- [ ] Verify audit logging is working
- [ ] Test customer creation and order management
- [ ] Verify payment processing functionality

### 4. Post-Deployment Configuration
- [ ] Change default admin password
- [ ] Update business information in app settings
- [ ] Configure backup schedules
- [ ] Set up monitoring and logging
- [ ] Configure SSL certificates
- [ ] Test all critical user workflows

## Production Monitoring

### Health Checks
- [ ] Database connectivity
- [ ] API response times
- [ ] Error rates
- [ ] Memory usage
- [ ] Disk space

### Backup Strategy
- [ ] Daily database backups
- [ ] Application file backups
- [ ] Log file rotation
- [ ] Backup verification

### Security Monitoring
- [ ] Failed login attempts
- [ ] Unusual API activity
- [ ] Database access patterns
- [ ] SSL certificate expiration

## Rollback Plan

### If Issues Occur:
1. Stop the application
2. Restore database from backup
3. Revert to previous application version
4. Verify system functionality
5. Investigate and fix issues

## Support Information

### Default Admin Credentials (CHANGE IMMEDIATELY)
- Username: `admin`
- Password: `admin123`

### Important Files
- Database schema: `production_migration.sql`
- Environment config: `.env.production`
- API documentation: `API_TESTING_GUIDE.md`
- Postman collection: `Garaadka-Complete-API-Testing.postman_collection.json`

### Database Tables Created
- `audit` - System audit logging
- `customers` - Customer information
- `orders` - Order management
- `order_items` - Order line items
- `payments` - Payment records
- `receipts` - Receipt management
- `user accounts` - User authentication
- `register` - Legacy compatibility
- `app_settings` - Application configuration

### API Endpoints
- Authentication: `/api/auth/*`
- Customers: `/api/customers/*`
- Orders: `/api/orders/*`
- Payments: `/api/payments/*`
- Receipts: `/api/receipts/*`
- Audit: `/api/audit/*`
- Settings: `/api/settings/*`

## Troubleshooting

### Common Issues
1. **Database Connection Failed**
   - Check database credentials in `.env.production`
   - Verify database server is running
   - Check firewall rules

2. **JWT Token Errors**
   - Verify JWT_SECRET is set and secure
   - Check token expiration settings

3. **Permission Denied**
   - Check file permissions
   - Verify database user permissions

4. **TypeScript Compilation Errors**
   - Run `npm install` to install missing dependencies
   - Check for missing type definitions

### Log Locations
- Application logs: `/var/log/garaadka/app.log`
- Database logs: Check your database server configuration
- System logs: `/var/log/syslog`