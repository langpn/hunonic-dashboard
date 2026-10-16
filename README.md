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

## 🔬 Nghiên Cứu Đảo Ngược & Giao Thức Mạng (REA Reverse-Engineering Specs)

Dự án được xây dựng dựa trên việc phân tích giao thức mạng và mã nguồn JavaScript của nền tảng chính thức **`https://web.hunonic.com`**:

### 1. WebSocket Gateway & Cơ Chế Đẩy Dữ Liệu Realtime
* **Điểm kết nối:** `wss://web.hunonic.com/gateway/ws?token=<USER_JWT_TOKEN>`
* **Cơ chế kênh (Topic Pub/Sub):** Mỗi thiết bị công tơ sở hữu 2 topic mã hóa Base64:
  - `topicpub`: Kênh thiết bị phát dữ liệu điện năng lên máy chủ.
  - `topicsub`: Kênh máy chủ truyền lệnh điều khiển và truy vấn xuống thiết bị.
* **Lệnh đo đạc thời gian thực (`CMD_10`):** Máy chủ chính thức gửi bản tin truy vấn `CMD_10` định kỳ **5 giây/lần** (`setInterval(..., 5000)`) để lấy trọn bộ thông số: Công suất (W), Điện áp (V), Dòng điện (A), Hệ số công suất (PF), Tần số (Hz) và Dòng rò (mA).

### 2. Thuật Toán Dẫn Xuất Khóa Mã Hóa Thiết Bị (AES-128-CBC)
Dữ liệu gửi nhận giữa máy chủ và công tơ được bảo vệ bằng chuẩn mã hóa đối xứng AES-128-CBC:
* **Khóa gốc (Master Key & IV):** Chuỗi 16 byte ký tự 0 ASCII (`"0000000000000000"`).
* **Quy trình sinh khóa:**
  1. Mã hóa chuỗi `root_id` của công tơ bằng AES-128-CBC với Master Key & IV.
  2. **Derived AES Key (16 bytes):** Trích xuất từ byte 4 đến byte 20 của chuỗi mã hóa.
  3. **Derived AES IV (16 bytes):** Trích xuất từ byte 12 đến byte 28 của chuỗi mã hóa.
* **Giải mã payload:** Dữ liệu bản tin Base64 được giải mã qua AES-128-CBC bằng cặp Derived Key & IV này.

### 3. Quy Chuẩn Giải Mã Công Suất (Deci-Watt Encoding)
* Máy chủ Hunonic mã hóa các giá trị công suất thực tế lớn hơn 130W dưới dạng **Deci-watt (0.1W)** để tối ưu băng thông truyền số nguyên.
* Ví dụ: Giá trị thô `1883` ➔ **`188.3 W`**; Giá trị thô `5125` ➔ **`512.5 W`**.
* Hệ thống tự động nhận diện ngưỡng `> 1300` và chia tỷ lệ `/ 10` chuẩn xác, triệt tiêu hoàn toàn lỗi nhân 10x công suất trước đây.

---

## 🧪 Hệ Thống Kiểm Thử Tự Động (Automated CI Test Suite)

Dự án tích hợp bộ kiểm thử tự động native của Node.js (`node:test` & `node:assert`), không cần cài đặt thêm bất kỳ thư viện ngoài nào:

```bash
npm test
```

### Các nhóm kiểm thử cốt tử (Test Suites):
1. **`tests/timezone.test.ts` (Kiểm thử Múi giờ Việt Nam GMT+7):**
   - Đảm bảo các khung giờ nửa đêm (00:01 AM, 02:19 AM, 06:59 AM) tại Việt Nam không bao giờ bị phương thức UTC `.toISOString()` kéo lùi về ngày hôm qua.
   - Bảo vệ mảng dữ liệu lịch sử không bị ghi đè nhầm số điện ngày trước.
2. **`tests/energy-integration.test.ts` (Kiểm thử Tích phân Năng lượng & Ampe):**
   - Kiểm tra thuật toán giải mã Deci-watt.
   - Kiểm thử công thức tính dòng điện Ampe theo hệ số công suất động $P = U \cdot I \cdot \cos\varphi$ (kẹp trần 5.7A theo máy lạnh Mitsubishi Heavy 13YZP).
   - Kiểm thử tích phân hình thang năng lượng: 1000W chạy trong 1 giờ cho ra đúng $1.000\text{ kWh}$.
3. **`tests/sqlite-reconciliation.test.ts` (Kiểm thử Bất biến Đối soát SQLite):**
   - Kiểm thử cơ chế nén dữ liệu phồng (Scale-down).
   - Kiểm thử cơ chế bù dữ liệu khuyết (Scale-up) khi SQLite bị hụt so với Cloud, triệt tiêu hoàn toàn hiện tượng lệch $0.149\text{ kWh}$.
4. **`tests/api-contracts.test.ts` (Kiểm thử Hợp đồng API REST):**
   - Kiểm thử in-memory toàn bộ các endpoint `/health`, `/api/device/realtime`, `/api/dashboard/history`.

---

## 🔒 Cam Kết Không Khóa Dữ Liệu (No Vendor Lock-in)

- Bạn hoàn toàn làm chủ dữ liệu của mình. Dữ liệu trên công tơ và Cloud gốc Hunonic không bao giờ bị can thiệp hay xóa mất.
- Nếu server này dừng hoạt động, bạn chỉ cần mở lại app chính hãng của Hunonic trên điện thoại, toàn bộ dữ liệu tiền điện vẫn còn nguyên vẹn 100%.

---

## 📜 Giấy Phép (License)

Phát hành dưới giấy phép mã nguồn mở **MIT License** — Tự do sử dụng, chỉnh sửa và triển khai phục vụ cộng đồng.  
Tác giả & Kiến trúc sư: **Lang Pham Ngoc (`langpn.dev`)**.
