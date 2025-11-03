#!/bin/bash

# Sales Portal Deployment Script
# Run this on your VPS

set -e

echo "🚀 Starting Sales Portal Deployment..."

# Configuration
APP_NAME="sales-portal"
APP_DIR="/var/www/sales-portal"
REPO_URL="https://github.com/yourusername/sales-portal.git" # Update this
DOMAIN="sales.zynor.ai"
PORT=3001

# Create app directory if it doesn't exist
sudo mkdir -p $APP_DIR
sudo chown $USER:$USER $APP_DIR

# Clone or update repository
if [ -d "$APP_DIR/.git" ]; then
    echo "📥 Updating existing repository..."
    cd $APP_DIR
    git pull origin main
else
    echo "📥 Cloning repository..."
    git clone $REPO_URL $APP_DIR
    cd $APP_DIR
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm ci --only=production

# Build the application
echo "🔨 Building application..."
npm run build

# Set up environment variables
echo "⚙️ Setting up environment..."
if [ ! -f .env.production ]; then
    echo "Creating .env.production file..."
    cat > .env.production << EOF
DATABASE_URL="postgresql://username:password@localhost:5432/salesportal"
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="https://$DOMAIN"
NODE_ENV=production
EOF
    echo "⚠️  Please update .env.production with your actual database credentials"
fi

# Install PM2 if not installed
if ! command -v pm2 &> /dev/null; then
    echo "📦 Installing PM2..."
    sudo npm install -g pm2
fi

# Stop existing process if running
pm2 stop $APP_NAME 2>/dev/null || true
pm2 delete $APP_NAME 2>/dev/null || true

# Start the application with PM2
echo "🚀 Starting application..."
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# Set up Nginx configuration
echo "🌐 Setting up Nginx..."
sudo tee /etc/nginx/sites-available/$APP_NAME > /dev/null << EOF
server {
    listen 80;
    server_name $DOMAIN;

    location / {
        proxy_pass http://localhost:$PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Enable the site
sudo ln -sf /etc/nginx/sites-available/$APP_NAME /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Set up SSL with Certbot
echo "🔒 Setting up SSL..."
sudo certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email your-email@example.com

echo "✅ Deployment complete!"
echo "🌐 Your application is now available at: https://$DOMAIN"
echo ""
echo "📋 Next steps:"
echo "1. Update .env.production with your database credentials"
echo "2. Run database migrations: npm run db:migrate"
echo "3. Seed initial data: npm run setup-lead-sources"
echo ""
echo "📊 Monitor your application:"
echo "- pm2 status"
echo "- pm2 logs $APP_NAME"
echo "- pm2 restart $APP_NAME"
