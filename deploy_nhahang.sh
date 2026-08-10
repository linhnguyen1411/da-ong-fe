#!/bin/bash
set -euo pipefail

VPS_IP="112.213.87.124"
VPS_USER="root"
BACKEND_PATH="/root/da-ong-be"
FRONTEND_PATH="/root/da-ong-fe"
BACKEND_PORT="3002"
DOMAIN="nhahangsanvuon.com"

echo "🔄 Restarting backend process..."
ssh ${VPS_USER}@${VPS_IP} "pm2 delete daong-api || true; pkill -f 'rails s -p ${BACKEND_PORT}' || true; sleep 2"

echo "📝 Updating backend code..."
ssh ${VPS_USER}@${VPS_IP} "cd ${BACKEND_PATH} && git fetch origin main && git reset --hard origin/main"

echo "💎 Installing backend gems..."
ssh ${VPS_USER}@${VPS_IP} "cd ${BACKEND_PATH} && bundle _2.4.22_ config set --local without 'development test' && bundle _2.4.22_ install"

echo "🗄️ Running database migrations..."
ssh ${VPS_USER}@${VPS_IP} "cd ${BACKEND_PATH} && RAILS_ENV=production bundle _2.4.22_ exec rails db:migrate"

echo "📝 Updating frontend code..."
ssh ${VPS_USER}@${VPS_IP} "cd ${FRONTEND_PATH} && git fetch origin main && git reset --hard origin/main"

echo "📦 Building FE on server..."
ssh ${VPS_USER}@${VPS_IP} "cd ${FRONTEND_PATH} && printf '%s\n' 'VITE_API_BASE_URL=/api/v1' > .env.production && npm install && npm run build"

echo "🚀 Starting backend on port ${BACKEND_PORT}..."
ssh ${VPS_USER}@${VPS_IP} "cd ${BACKEND_PATH} && pm2 start bash --name daong-api -- -lc 'cd ${BACKEND_PATH} && export PATH=\"/usr/local/bin:\$PATH\" && PORT=${BACKEND_PORT} RAILS_ENV=production bundle _2.4.22_ exec rails s -p ${BACKEND_PORT} -e production -b 0.0.0.0' && pm2 save"

echo "📤 Publishing FE to /var/www/da-ong-fe..."
ssh ${VPS_USER}@${VPS_IP} "mkdir -p /var/www/da-ong-fe && rm -rf /var/www/da-ong-fe/* && cp -a ${FRONTEND_PATH}/dist/. /var/www/da-ong-fe/ && chmod -R 755 /var/www/da-ong-fe && ls -la /var/www/da-ong-fe/assets/"

echo "🌐 Reloading Nginx..."
ssh ${VPS_USER}@${VPS_IP} "nginx -t && systemctl reload nginx"

echo "✅ Deploy complete!"
echo "Domain: https://${DOMAIN}"
