# 🚀 Deploy Nhà Hàng Sân Vườn lên VPS

## 1️⃣ Port sử dụng
- Backend (Rails API): **3011**
- Frontend (Vite/React): **5174**

## 2️⃣ Thư mục trên VPS
- Backend: `/root/da-ong-be`
- Frontend: `/root/da-ong-fe`

## 3️⃣ Script deploy tự động
Chạy trên máy local:
```bash
chmod +x deploy_nhahang.sh
./deploy_nhahang.sh
```

## 4️⃣ Cấu hình Nginx mẫu cho domain

```
server {
    listen 80;
    server_name nhahangsanvuon.com www.nhahangsanvuon.com;

    root /root/da-ong-fe/dist;
    index index.html;

    location /api {
        proxy_pass http://127.0.0.1:3011;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

- Sau khi sửa file cấu hình, reload nginx:
```bash
nginx -t && systemctl reload nginx
```

## 5️⃣ Kiểm tra
- Truy cập: https://nhahangsanvuon.com
- API: https://nhahangsanvuon.com/api

## 6️⃣ Lưu ý
- Không ảnh hưởng dự án chấm công (port 3001/5173)
- Nếu cần rollback, chỉ cần dừng process daong-api hoặc đổi lại port/nginx.
