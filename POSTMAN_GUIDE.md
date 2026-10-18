# HƯỚNG DẪN KIỂM THỬ TOÀN DIỆN BÀI TẬP P2 QUA POSTMAN
**Hệ thống:** E-Commerce Monolith MVP (Express.js + Prisma ORM + PostgreSQL)  
**Cổng dịch vụ (Port):** `http://localhost:5000`  
**File Postman Collection:** [`P2/postman_collection.json`](file:///d:/HK1_26_27/Bai_Tap_Thay_The_PROJECT/Project/P2/postman_collection.json)

---

## 1. TỔNG QUAN BỘ KIỂM THỬ POSTMAN P2

Bộ kiểm thử Postman cho P2 bao gồm **17 Test Cases** được chia thành 4 nhóm nghiệp vụ chính:
- **Nhóm 1 (System & Health):** 1 Test Case (Kiểm tra API và kết nối PostgreSQL qua Prisma).
- **Nhóm 2 (Authentication & Authorization):** 6 Test Cases (Đăng ký, Đăng nhập Admin/Customer, Băm bcrypt, Bảo mật JWT).
- **Nhóm 3 (Products Management):** 5 Test Cases (CRUD sản phẩm, Bảo vệ quyền truy cập bằng JWT, Kiểm tra tồn tại).
- **Nhóm 4 (Orders & Shipments):** 5 Test Cases (Prisma Transaction nguyên tử: Tạo Order + OrderDetail + Shipment, Trừ kho, Kiểm tra tồn kho, Chặn không token).

---

## 2. BẢNG MA TRẬN 17 TEST CASES CHI TIẾT (TEST MATRIX)

| STT | Mã Test Case | Nhóm chức năng | Kịch bản kiểm thử | Dữ liệu đầu vào | Mã HTTP kỳ vọng | Tiêu chí đánh giá kết quả |
| :---: | :--- | :--- | :--- | :--- | :---: | :--- |
| **1** | `TC-P2-SYS-01` | System & Health | Kiểm tra Health Check | `GET /health` | `200 OK` | `status: "OK"`, `database: "connected"` |
| **2** | `TC-P2-AUTH-01` | Authentication | Đăng ký Customer mới hợp lệ | `POST /api/auth/register` kèm username, password, fullname | `201 Created` | Tạo user thành công, mật khẩu băm bcrypt, có `uid` |
| **3** | `TC-P2-AUTH-02` | Authentication | Đăng ký username đã tồn tại | `POST /api/auth/register` với username trùng lặp | `409 Conflict` | Báo lỗi `Username already exists` |
| **4** | `TC-P2-AUTH-03` | Authentication | Đăng ký thiếu password | `POST /api/auth/register` thiếu trường password | `400 Bad Request` | Báo lỗi thiếu trường bắt buộc |
| **5** | `TC-P2-AUTH-04` | Authentication | Đăng nhập Admin thành công | `POST /api/auth/login` với `admin` / `admin123` | `200 OK` | Trả về JWT Access Token, tự động gán vào `{{token}}` |
| **6** | `TC-P2-AUTH-05` | Authentication | Đăng nhập Customer vừa tạo | `POST /api/auth/login` với tài khoản tạo ở TC-01 | `200 OK` | Trả về JWT Token, tự động gán vào `{{customer_token}}` |
| **7** | `TC-P2-AUTH-06` | Authentication | Đăng nhập sai mật khẩu | `POST /api/auth/login` với mật khẩu sai | `401 Unauthorized` | Từ chối đăng nhập: `Invalid credentials` |
| **8** | `TC-P2-PROD-01` | Products | Lấy danh sách sản phẩm (Public)| `GET /api/products` không cần token | `200 OK` | Trả về mảng danh sách sản phẩm |
| **9** | `TC-P2-PROD-02` | Products | Thêm sản phẩm mới (Admin) | `POST /api/products` có Bearer Token | `201 Created` | Tạo sản phẩm thành công, lưu `pid` vào `{{created_pid}}` |
| **10**| `TC-P2-PROD-03` | Products | Thêm sản phẩm không có JWT | `POST /api/products` KHÔNG có Authorization header | `401 Unauthorized` | Bị middleware chặn: `Access token required` |
| **11**| `TC-P2-PROD-04` | Products | Lấy chi tiết sản phẩm hợp lệ | `GET /api/products/{{created_pid}}` | `200 OK` | Trả về thông tin sản phẩm khớp với `pid` vừa tạo |
| **12**| `TC-P2-PROD-05` | Products | Cập nhật giá và tồn kho | `PUT /api/products/{{created_pid}}` có Bearer Token | `200 OK` | Tồn kho được cập nhật thành công (ví dụ: 45) |
| **13**| `TC-P2-ORD-01` | Orders & Shipments | Đặt hàng hợp lệ (Transaction) | `POST /api/orders` với Customer Token, pid và số lượng 2 | `201 Created` | Tạo Order, tạo OrderDetail, trừ kho, tạo Shipment `Pending` |
| **14**| `TC-P2-ORD-02` | Orders & Shipments | Đặt hàng không có JWT token | `POST /api/orders` KHÔNG có Authorization header | `401 Unauthorized` | Bị chặn: yêu cầu xác thực người dùng |
| **15**| `TC-P2-ORD-03` | Orders & Shipments | Đặt số lượng vượt tồn kho | `POST /api/orders` với số lượng `qty = 9999` | `400 Bad Request` | Transaction rollback, báo lỗi `Insufficient stock` |
| **16**| `TC-P2-ORD-04` | Orders & Shipments | Đặt sản phẩm không tồn tại | `POST /api/orders` với `pid = 999999` | `400 Bad Request` | Transaction rollback, báo `Product not found` |
| **17**| `TC-P2-ORD-05` | Orders & Shipments | Lấy danh sách đơn hàng đã đặt | `GET /api/orders` có Bearer Token | `200 OK` | Trả về danh sách đơn hàng kèm chi tiết và Shipment |

---

## 3. HƯỚNG DẪN IMPORT VÀ CHẠY TRÊN POSTMAN

### Bước 1: Khởi động hệ thống P2
Trước khi mở Postman, đảm bảo container của P2 đang chạy:
```powershell
cd D:\HK1_26_27\Bai_Tap_Thay_The_PROJECT\Project\P2
docker compose up -d
```
*(Cổng API: `http://localhost:5000`)*.

### Bước 2: Import Collection vào Postman
1. Mở ứng dụng **Postman**.
2. Nhấn nút **Import** ở góc trên bên trái.
3. Chọn tab **Raw text**.
4. Mở file [`P2/postman_collection.json`](file:///d:/HK1_26_27/Bai_Tap_Thay_The_PROJECT/Project/P2/postman_collection.json), nhấn **Ctrl + A** rồi **Ctrl + C** (copy toàn bộ nội dung).
5. Dán vào ô text của Postman $\rightarrow$ bấm **Continue** $\rightarrow$ **Import**.

### Bước 3: Chạy tự động 17 Test Cases (Tính năng Runner)
1. Ở danh sách Collection bên trái, nhấp vào **`E-Commerce Monolith MVP (P2) - Full Test Suite`**.
2. Nhấn nút **Run** (nút màu xanh hoặc dấu ba chấm `...` $\rightarrow$ **Run collection**).
3. Bấm nút màu cam **"Run E-Commerce Monolith MVP (P2)..."**.
4. Postman sẽ tự động chạy toàn bộ 17 test cases và hiển thị kết quả **17/17 Passed (Màu xanh lá)**!

---

## 4. CHI TIẾT TỪNG REQUEST KHI TEST THỦ CÔNG

### 4.1. `GET /health`
- **Mục đích:** Kiểm tra ứng dụng và kết nối cơ sở dữ liệu PostgreSQL qua Prisma query (`SELECT 1`).
- **Headers:** *(Trống)*
- **Response mẫu:**
  ```json
  {
    "status": "OK",
    "database": "connected",
    "timestamp": "2026-09-27T09:35:04.375Z"
  }
  ```

### 4.2. `POST /api/auth/login` (Admin)
- **Mục đích:** Đăng nhập tài khoản Admin, nhận mã thông báo bảo mật JWT.
- **Headers:** `Content-Type: application/json`
- **Body:**
  ```json
  {
    "username": "admin",
    "password": "admin123"
  }
  ```
- **Response mẫu:**
  ```json
  {
    "message": "Login successful",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "uid": 1,
      "username": "admin",
      "fullname": "System Administrator",
      "role": "Admin",
      "membership": "Gold"
    }
  }
  ```

### 4.3. `POST /api/products` (Tạo sản phẩm)
- **Mục đích:** Thêm sản phẩm mới vào bảng `Product`. Yêu cầu có JWT Token.
- **Headers:**
  - `Content-Type`: `application/json`
  - `Authorization`: `Bearer {{token}}`
- **Body:**
  ```json
  {
    "pname": "Mechanical Keyboard RGB Custom",
    "price": 120.00,
    "quantity": 50
  }
  ```
- **Response mẫu:**
  ```json
  {
    "pid": 11,
    "pname": "Mechanical Keyboard RGB Custom",
    "price": "120",
    "quantity": 50
  }
  ```

### 4.4. `POST /api/orders` (Giao dịch đặt hàng)
- **Mục đích:** Đặt hàng thông qua Prisma Transaction nguyên tử (Atomic Transaction):
  1. Tạo bản ghi `Order` với `uid`.
  2. Kiểm tra tồn kho của `Product`, nếu đủ thì trừ tồn kho.
  3. Tạo bản ghi `OrderDetail` (khóa chính phức hợp `oid`, `pid`).
  4. Tự động sinh bản ghi `Shipment` ở trạng thái ban đầu là `Pending`.
- **Headers:**
  - `Content-Type`: `application/json`
  - `Authorization`: `Bearer {{customer_token}}`
- **Body:**
  ```json
  {
    "items": [
      {
        "pid": 1,
        "qty": 2
      }
    ]
  }
  ```
- **Response mẫu:**
  ```json
  {
    "message": "Order created successfully",
    "order": {
      "oid": 5,
      "uid": 6,
      "createat": "2026-09-27T09:40:12.345Z",
      "orderDetails": [
        {
          "oid": 5,
          "pid": 1,
          "qty": 2,
          "unit_price": "79.99",
          "product": {
            "pid": 1,
            "pname": "Wireless Mechanical Keyboard",
            "price": "79.99",
            "quantity": 48
          }
        }
      ],
      "shipments": [
        {
          "shipid": 5,
          "oid": 5,
          "status": "Pending"
        }
      ]
    }
  }
  ```
