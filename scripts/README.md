# Helper Scripts

Các script hỗ trợ cho việc setup và quản lý test accounts.

## Scripts

### approve-pharmacy-account.js
Approve tài khoản pharmacy từ trạng thái pending sang active.

**Cách sử dụng:**
```bash
node scripts/approve-pharmacy-account.js
```

### create-pharmacy-test-account.js
Tạo tài khoản pharmacy test trực tiếp (không qua registration flow).

**Cách sử dụng:**
```bash
node scripts/create-pharmacy-test-account.js
```

## Lưu ý

- Đảm bảo MongoDB đang chạy và kết nối được
- Kiểm tra file `.env` có cấu hình `MONGODB_URI` đúng

