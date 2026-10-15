# ⚡ Hunonic Studio Monitor (v3.0 Dynamic Edition)

> **Trạm giám sát năng lượng thông minh chuẩn Studio cho công tơ Hunonic EKMeter (Kẹp dòng CT), ElMeter và ATM Wifi.**  
> Tự vận hành (Self-hosted), đa thiết bị động, **KHÔNG cần tải app của nhà sản xuất**, bảo vệ dữ liệu 2 tầng (Dual-Layer Sync — Không bao giờ mất dữ liệu).

---

## 🌟 Điểm Nổi Bật (Key Highlights)

- 🚫 **Zero-App Onboarding:** Cài đặt Wi-Fi và giám sát 100% trên trình duyệt Web. Giải phóng hoàn toàn khỏi app điện thoại nặng nề, quảng cáo hay yêu cầu cấp quyền vị trí.
- 🔄 **Đa Thiết Bị Động (Multi-Device Gateway):** Tự động phát hiện toàn bộ công tơ trong nhà bạn, hỗ trợ chuyển đổi giữa các công tơ bằng 1 cú nhấp chuột trên Header, hỗ trợ quét mã QR / dán mã công tơ (`H...`).
- 🛡️ **Bảo Hiểm Dữ Liệu 2 Tầng (No Vendor Lock-in):**
  - **Tầng 1 (Phần cứng & Cloud gốc):** Chỉ số điện gốc luôn được ghi vào chip nhớ Flash của công tơ và đồng bộ song song lên Cloud Hunonic 24/7.
  - **Tầng 2 (Web Server của bạn):** Lưu trữ dữ liệu phân tích chi tiết. **Nếu server của bạn bị hỏng hoặc xóa cài lại**, hệ thống tự động kéo toàn bộ lịch sử 12 tháng từ Cloud về chỉ trong 2 giây. Bạn không bao giờ mất một số điện nào!
- ⚡ **Realtime Telemetry Deck (60fps):** Đo công suất (Watt), điện áp thực tế lưới điện (~224V), dòng tải Ampe với nhịp biến thiên sống động theo tải thực tế của thiết bị.
- ❄️ **Inverter Load Intelligence (0.1A ➔ 6.5A):** Nhận diện chuẩn xác 5 cấp độ vận hành của động cơ máy nén Inverter (Chế độ chờ Standby 0.1A ➔ Quạt gió 0.3A ➔ Duy trì ECO 1.0A ➔ Tải cao 2.9A ➔ Turbo cực đại 4.0A - 6.5A), đi kèm thanh đo % tải trực quan.
- 📅 **Ma Trận Lịch Heatmap Kiến Trúc:** Lấy cảm hứng từ Linear & Apple Health, xem nhanh tiêu thụ 30 ngày trong tháng kèm thanh nhiệt vi mô và tooltip chi tiết số tiền tạm tính.
- 🗄️ **Native C++ SQLite WAL Engine:** Tích phân công suất thời gian thực theo toán học hình thang, tự động lưu trữ 60 ngày với dung lượng siêu nhẹ (< 100KB).
- 🌓 **Nordic Precision Dark/Light Mode:** Thiết kế tối giản, sạch sẽ, chuẩn xác cho cả máy tính, máy tính bảng và điện thoại (hỗ trợ cài đặt PWA Home Screen).

---

## 🚀 Hướng Dẫn Sử Dụng Nhanh (Dành Cho Người Dùng)

### Bước 1: Kết nối Wi-Fi cho công tơ (Hoàn toàn không cần App)
1. Cấp nguồn cho công tơ Hunonic. Nhấn giữ nút tròn trên thân công tơ 5 giây đến khi đèn nhấp nháy nhanh.
2. Dùng điện thoại hoặc máy tính mở cài đặt Wi-Fi, kết nối vào mạng Wi-Fi do công tơ phát ra (tên dạng `HUNONIC_...`, không có mật khẩu).
3. Mở trình duyệt web truy cập địa chỉ cổng nội bộ:  
   👉 **`http://192.168.4.1/wificonfig`**
4. Chọn tên Wi-Fi nhà bạn, nhập mật khẩu và bấm **Save (Lưu)**. Công tơ sẽ tự kết nối vào mạng gia đình.

---

### Bước 2: Đăng nhập & Giám sát trên Web
1. Truy cập vào trang web: **`https://hunonic.langpn.xyz`** (hoặc server tự host của bạn).
2. Nhập số điện thoại và mật khẩu tài khoản Hunonic của bạn.
3. Hệ thống sẽ tự động quét danh sách thiết bị và hiển thị ngay bảng điều khiển đo đạc.

---

### Bước 3: Đổi hoặc Thêm công tơ mới
- **Chuyển đổi công tơ:** Bấm vào tên công tơ ở góc trên bên trái Header để chọn công tơ phòng khách, phòng ngủ hoặc tổng nhà.
- **Thêm công tơ:** Bấm nút **"+ Thêm công tơ"** ở thanh Header ➔ Nhập hoặc quét mã QR (ví dụ `H26230844153246002`) in trên thân công tơ.

---

## 🛠️ Hướng Dẫn Tự Triển Khai Server (Self-Host Docker Compose)

Hệ thống được đóng gói thành **1 Docker image duy nhất** chứa cả Backend Hono và Frontend Vite tĩnh, chiếm chưa tới **40MB RAM**.

### 1. Triển khai bằng Docker Compose (Khuyên dùng)

Tạo file `docker-compose.yml`:

```yaml
version: '3.8'

services:
  hunonic-dashboard:
    image: ghcr.io/langpn/hunonic-dashboard:latest
    container_name: hunonic-monitor
    restart: unless-stopped
    ports:
      - "3000:3000"
    volumes:
      - ./data:/app/data
    environment:
      - PORT=3000
      - NODE_ENV=production
      # (Tùy chọn) Điền sẵn tài khoản nếu muốn server tự login chạy ngầm
      - HUNONIC_PHONE=0353700780
      - HUNONIC_PASSWORD=MatKhauCuaBan
```

Khởi chạy container:
```bash
docker compose up -d
```
Truy cập: **`http://localhost:3000`**

---

### 2. Triển khai lên Coolify (Server máy ảo UTM / VPS)

1. Mở giao diện quản trị **Coolify**.
2. Chọn **Create New Resource** ➔ **Public Repository** (hoặc Docker Compose).
3. Nhập link GitHub: `https://github.com/langpn/hunonic-dashboard` (Branch: `main`).
4. Thêm biến môi trường trong Coolify:
   - `PORT`: `3000`
5. Nhấn **Deploy**. Coolify sẽ tự động nhận diện multi-stage build và thiết lập SSL HTTPS tự động.

---

## 📡 Danh Mục API Endpoints

Hệ thống cung cấp sẵn REST API đầy đủ cho nhà phát triển muốn tích hợp vào Home Assistant hoặc hệ thống Smart Home khác:

| Endpoint | Method | Mô tả |
| :--- | :--- | :--- |
| `/health` | `GET` | Kiểm tra trạng thái máy chủ, uptime và dung lượng RAM |
| `/api/device/realtime` | `GET` | Lấy dữ liệu công suất W, điện áp V, dòng tải A thời gian thực (`?device_id=...`) |
| `/api/dashboard/summary` | `GET` | Toàn bộ dữ liệu tổng quan: Hôm nay, tháng này, biểu giá, danh sách công tơ |
| `/api/dashboard/history` | `GET` | Truy vấn lịch sử theo năm (`type=year`), ngày (`type=day`), hoặc khoảng ngày (`type=custom`) |
| `/api/devices/list` | `GET` | Danh sách tất cả công tơ điện và phòng ốc trong tài khoản |
| `/api/devices/claim` | `POST` | Khai báo và nhận diện công tơ mới qua mã QR / Serial (`H...`) |
| `/api/auth/login` | `POST` | Đăng nhập tài khoản Hunonic từ giao diện Web |
| `/api/system/status` | `GET` | Chẩn đoán cơ sở dữ liệu SQLite C++ và dung lượng lưu trữ 60 ngày |

---

## 📐 Kiến Trúc Kỹ Thuật (System Design)

```
┌────────────────────────────────────────────────────────────────────────┐
│                   HUNONIC PRECISION STUDIO GATEWAY                     │
├────────────────────────────────┬───────────────────────────────────────┤
│  BACKEND (Hono v4 Engine)      │  FRONTEND (Nordic Precision Studio)   │
│  • C++ Native node:sqlite WAL  │  • React 18 + Vite (Siêu nhẹ)         │
│  • Mathematical Trap. Integral │  • Custom Architectural SVG Heatmap   │
│  • Self-Healing Session Guard  │  • Tailored 5-Tier Inverter Gauges    │
│  • Dynamic Device Dispatcher   │  • Bundle: ~72 kB gzip (Tải < 200ms)  │
└────────────────────────────────┴───────────────────────────────────────┘
                                 │
                 ┌───────────────▼───────────────┐
                 │     Single Port: 3000         │
                 │   Multi-Tenant & Zero-App     │
                 └───────────────────────────────┘
```

---

## 🔒 Cam Kết Không Khóa Dữ Liệu (No Vendor Lock-in)

- Bạn hoàn toàn làm chủ dữ liệu của mình. Dữ liệu trên công tơ và Cloud gốc Hunonic không bao giờ bị can thiệp hay xóa mất.
- Nếu server này dừng hoạt động, bạn chỉ cần mở lại app chính hãng của Hunonic trên điện thoại, toàn bộ dữ liệu tiền điện vẫn còn nguyên vẹn 100%.

---

## 📜 Giấy Phép (License)

Phát hành dưới giấy phép mã nguồn mở **MIT License** — Tự do sử dụng, chỉnh sửa và triển khai phục vụ cộng đồng.  
Tác giả & Kiến trúc sư: **Lang Pham Ngoc (`langpn.dev`)**.
