# 1. Update CORS in your current running application
# Edit your current .env file
export CORS_ORIGIN="http://45.55.216.189:3000,http://45.55.216.189:5173,http://45.55.216.189"

# 2. Restart your Node.js application
pm2 restart all
# OR if not using PM2:
pkill node
nohup node index.js &

# 3. Configure nginx if not already done
sudo apt install nginx
# Copy the nginx configuration above to /etc/nginx/sites-available/garaadka
sudo ln -s /etc/nginx/sites-available/garaadka /etc/nginx/sites-enabled/
sudo systemctl restart nginx





# Check application logs
pm2 logs garaadka-api

# Check nginx logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# Check if services are running
sudo systemctl status nginx
pm2 status

# Test API endpoints
curl -v http://45.55.216.189/api/health
curl -v http://45.55.216.189:5000/api/health

# Check firewall
sudo ufw status

# Check listening ports
sudo netstat -tlnp | grep :5000
sudo netstat -tlnp | grep :80



# Build frontend (run this where your frontend code is)
npm run build

# Copy built files to nginx directory
sudo mkdir -p /var/www/garaadka
sudo cp -r dist/* /var/www/garaadka/
sudo chown -R www-data:www-data /var/www/garaadka




# 1. Clone/update your repository
cd /home/garaadka
git clone https://github.com/your-repo/garaadka.git
cd garaadka/server

# 2. Run the Ubuntu deployment script
chmod +x deploy-ubuntu.sh
./deploy-ubuntu.sh

# 3. Start the application with PM2
pm2 start ecosystem.config.js

# 4. Save PM2 configuration and set up auto-start
pm2 save
pm2 startup

# 5. Check application status
pm2 status
pm2 logs garaadka-api

# 6. Test the API
curl http://45.55.216.189/api/health
curl http://45.55.216.189:5000/api/health