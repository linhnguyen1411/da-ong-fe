#!/bin/bash
# Build frontend cho production. Sau khi chạy xong, thư mục dist/ sẽ chứa file để deploy.
set -e
cd "$(dirname "$0")"
echo "Building frontend..."
npm run build
echo "Build xong. Output: $(pwd)/dist"
echo "Deploy: copy nội dung thư mục dist/ lên server (hosting tĩnh hoặc thư mục public của backend)."
