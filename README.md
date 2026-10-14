# ⚡ Hunonic Cyber HUD (v2.0 Ultra-Lean Edition)

Hệ thống Dashboard tự host (Self-hosted) giám sát năng lượng, công tơ điện tử và điều khiển thiết bị thông minh Hunonic. Thiết kế theo phong cách **Darkmode Huyền Bí & Lộng Lẫy (Ethereal Cyber-Abyss)**, tối ưu hiệu năng tối đa cho điện thoại và máy chủ tự host qua UTM / Coolify.

---

## 🌟 Điểm Nổi Bật (Key Highlights)

- ⚡ **Theo dõi điện năng thời gian thực**:
  - Đo công suất tức thời (**Watt**) qua đồng hồ HUD phát quang động.
  - Số điện tiêu thụ hôm nay (**kWh**) và chi phí tạm tính (**₫**).
  - Tổng số điện và hóa đơn tạm tính của tháng hiện tại theo biểu giá điện.
- 🕒 **Biểu đồ tiêu thụ điện theo giờ (24h Chart)**:
  - Phân tích chi tiết lượng điện tiêu thụ trong từng khung giờ (0h - 24h).
  - Tự động phát hiện và cảnh báo khung giờ cao điểm sử dụng điện nhiều nhất trong ngày.
- 🧹 **Cơ chế tự bảo vệ máy chủ & Lưu trữ 2 tháng (Self-Healing Overload Guard)**:
  - **Giới hạn lưu trữ nghiêm ngặt 60 ngày (2 tháng)**: Tự động xóa sạch các bản ghi cũ hơn để giải phóng bộ nhớ.
  - **Tự động dọn dẹp khi máy chủ quá tải**: Nếu RAM heap hoặc lưu trữ vượt ngưỡng an toàn, hệ thống tự động co rút thời gian lưu trữ xuống 30 ngày để bảo vệ máy chủ UTM không bao giờ bị nghẽn hay tràn RAM.
  - Hỗ trợ nút dọn dẹp bộ nhớ thủ công với 1 chạm.
- 🎛️ **Bản sao tính năng đầy đủ của App (Full Feature Parity)**:
  - **Công tơ & Aptomat**: Bật/tắt rơ-le an toàn, khóa an toàn trẻ em, xem dòng rò (mA), dòng tải (A), điện áp (V).
  - **Công tắc thông minh**: Điều khiển bật/tắt từng kênh (1 - 4 nút).
  - **Cửa cuốn & Cổng tự động**: Mở, Dừng, Đóng, Mở hé thoáng khí 20%.
  - **Điều hòa & IR Remote**: Tăng giảm nhiệt độ, chế độ Lạnh/Khô/Gió/Auto, tốc độ quạt.
  - **Khóa cửa thông minh (TadoLock/TTLock)**: Xem pin %, mở khóa từ xa.
  - **Cảm biến an ninh**: Cảm biến khói, cảm biến hiện diện Radar.
- 🔮 **Ngữ cảnh & Kịch bản 1 chạm**: Về nhà, Ra ngoài, Đi ngủ, Báo động an ninh, Tiết kiệm điện.
- 🛡️ **Cài đặt ngưỡng bảo vệ**: Cài đặt ngắt tải khi quá công suất (W), quá dòng (A), quá áp (V), thấp áp (V), rò điện (mA).
- 🚀 **Hiệu năng siêu tối ưu (Zero-Bloat)**:
  - Thay thế toàn bộ thư viện nặng bằng **Native Fetch** và **Native Node Crypto**.
  - Xóa bỏ Recharts, sử dụng **Pure Neon SVG Engine** siêu nhẹ: Bundle giảm hơn 60% (chỉ còn **71 kB** gzip), mượt mà 60fps trên điện thoại cũ.
  - Đóng gói toàn bộ Backend + Frontend vào **1 container duy nhất**, chiếm chưa đầy **40MB RAM**!

---

## 🏗️ Kiến Trúc Hệ Thống (Architecture)

```
┌────────────────────────────────────────────────────────────────────────┐
│                   UNIFIED ULTRA-LEAN ARCHITECTURE                      │
├────────────────────────────────┬───────────────────────────────────────┤
│  BACKEND (Hono + Native API)   │  FRONTEND (Cyber Mystic HUD)          │
│  • Hono v4 (Engine siêu nhẹ)   │  • Vite + React 18 (Gọn gàng)         │
│  • Native fetch (0KB runtime)  │  • Pure Neon SVG Engine (0KB Bloat)   │
│  • Native crypto (C++ speed)   │  • Tailwind CSS Ethereal Dark         │
│  • Hourly 2-Month Storage      │  • Quantum Glassmorphism              │
│  • Background Sampler (5 min)  │  • Bundle: 71 kB gzip (Tải tức thì)   │
└────────────────────────────────┴───────────────────────────────────────┘
                                 │
                 ┌───────────────▼───────────────┐
                 │    Single Port: 3000          │
                 │    (Serves API + React SPA)   │
                 └───────────────────────────────┘
```

---

## 🚀 Hướng Dẫn Chạy & Cài Đặt

### 1. Chạy Thử Nghiệm Local (Mac / PC)

```bash
cd hunonic-dashboard

# 1. Điền thông tin vào .env
cp .env.example .env
nano .env
# HUNONIC_PHONE=0353700780
# HUNONIC_PASSWORD=La526488!

# 2. Khởi chạy 1 chạm
./start-local.sh
```

👉 Trình duyệt sẽ tự động mở tại **`http://localhost:3000`**.

---

### 2. Triển Khai Lên Coolify (Self-hosted trên Server UTM)

1. Mở giao diện Coolify trên server của bạn.
2. Tạo mới: **Create New Resource** ➔ **Docker Compose**.
3. Dán toàn bộ nội dung tệp `docker-compose.yml`.
4. Điền các biến môi trường (Environment Variables) trong Coolify:
   - `HUNONIC_PHONE`: `0353700780`
   - `HUNONIC_PASSWORD`: `La526488!`
   - `PORT`: `3000`
5. Nhấn **Deploy**. Coolify sẽ build multi-stage và chạy 1 container duy nhất cực kỳ nhẹ nhàng (< 40MB RAM).

---

## 📡 API Endpoints Cung Cấp

| Endpoint | Method | Chức năng |
|---|---|---|
| `/health` | GET | Kiểm tra tình trạng server, thời gian uptime & dung lượng RAM |
| `/api/dashboard/summary` | GET | Dữ liệu tổng quan: Công suất W, điện hôm nay, tháng này, biểu giá |
| `/api/dashboard/hourly` | GET | Dữ liệu tiêu thụ 24 giờ trong ngày (kèm giờ cao điểm) |
| `/api/system/status` | GET | Báo cáo lưu trữ 2 tháng & tình trạng tải của máy chủ |
| `/api/system/prune` | POST | Kích hoạt tự động dọn dẹp dữ liệu cũ thủ công |
| `/api/device/control` | POST | Điều khiển thiết bị: Công tắc, Cửa cuốn, Rèm, Điều hòa, Khóa |
| `/api/device/thresholds` | POST | Cài đặt ngưỡng bảo vệ an toàn (W, A, V, mA) |
