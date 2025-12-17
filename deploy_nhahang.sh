#!/bin/bash

# === Thông tin cấu hình ===
VPS_IP="112.213.87.124"
VPS_USER="root"
BACKEND_PATH="/root/da-ong-be"
FRONTEND_PATH="/root/da-ong-fe"
BACKEND_PORT="3002"
FRONTEND_PORT="5174"

# 1. Dừng process cũ (nếu có)
echo "🔄 Stopping existing da-ong processes..."
ssh ${VPS_USER}@${VPS_IP} "pm2 delete daong-api || true; pkill -f 'rails s -p ${BACKEND_PORT}' || true; sleep 2"


# 2. Update backend code
echo "📝 Updating backend code..."
ssh ${VPS_USER}@${VPS_IP} "cd ${BACKEND_PATH} && git pull origin main"


# --- Update Gemfile Ruby version to 3.0.2 ---
echo "Updating Gemfile Ruby version to 3.0.2..."
ssh ${VPS_USER}@${VPS_IP} << 'GEMFILE'
cd /root/da-ong-be
# Restore Gemfile from git first (undo any previous bad edits)
git checkout Gemfile 2>/dev/null || true
# Replace ruby version (handles both single and double quotes)
sed -i 's/ruby "[0-9.]*"/ruby "3.0.2"/' Gemfile
sed -i "s/ruby '[0-9.]*'/ruby '3.0.2'/" Gemfile
# Delete Gemfile.lock to force regeneration
rm -f Gemfile.lock
# Run bundle install
bundle install
GEMFILE
echo "Gemfile updated to Ruby 3.0.2 and bundle installed"

# 3. Update frontend code
echo "📝 Updating frontend code..."
ssh ${VPS_USER}@${VPS_IP} "cd ${FRONTEND_PATH} && git pull origin main"

# 4. Install backend dependencies
echo "💎 Installing backend gems..."
ssh ${VPS_USER}@${VPS_IP} "cd ${BACKEND_PATH} && bundle install --without development test"

# 5. Run migrations
echo "🗄️ Running database migrations..."
ssh ${VPS_USER}@${VPS_IP} "cd ${BACKEND_PATH} && RAILS_ENV=production bundle exec rails db:migrate"


# 6. Tạo file .env.production, cài dependencies và build FE trên server
echo "📦 Creating .env.production, installing dependencies & building FE on server..."
ssh ${VPS_USER}@${VPS_IP} "cd ${FRONTEND_PATH} && echo 'VITE_API_BASE_URL=https://nhahangdavaong.com/api/v1' > .env.production && npm install && npm run build"

# 8. Start backend (PM2)
echo "🚀 Starting backend on port ${BACKEND_PORT}..."
ssh ${VPS_USER}@${VPS_IP} "cd ${BACKEND_PATH} && pm2 start 'bundle exec rails s -p ${BACKEND_PORT} -e production' --name 'daong-api' --force"
ssh ${VPS_USER}@${VPS_IP} "mkdir -p /var/www/da-ong-fe && rm -rf /var/www/da-ong-fe/* && cp -r ${FRONTEND_PATH}/dist/* /var/www/da-ong-fe/ && chmod -R 755 /var/www/da-ong-fe && ls -l /var/www/da-ong-fe"

# 9. Reload Nginx
echo "🌐 Reloading Nginx..."
ssh ${VPS_USER}@${VPS_IP} "nginx -t && systemctl reload nginx"

echo "✅ Deploy complete!"
echo "Backend: http://${VPS_IP}:${BACKEND_PORT}"
echo "Frontend: http://${VPS_IP}:${FRONTEND_PORT}"
echo "Domain: https://nhahangdavaong.com"
