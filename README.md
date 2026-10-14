# Hunonic Electric Meter Dashboard

Self-hosted dashboard for monitoring Hunonic electric meter (công tơ điện tử) consumption data. Built with Hono (backend) + React (frontend), deployable via Docker Compose on Coolify.

## 🎯 Features

- 📊 **Real-time consumption charts** - Daily kWh usage with area charts
- 💰 **Cost tracking** - Monthly electricity cost with tiered pricing support
- 📱 **Mobile responsive** - Works on phone, tablet, desktop
- 🔐 **Secure** - Token-based auth, auto-refresh, MD5 password hashing
- 🐳 **Docker ready** - One-command deployment with Docker Compose
- ☁️ **Coolify compatible** - Designed for self-hosted Coolify deployment

## 🏗 Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌──────────────────┐
│   Frontend      │────▶│   Backend       │────▶│   Hunonic API    │
│   (React +      │     │   (Hono +       │     │   (web.hunonic.  │
│   Vite +        │     │   TypeScript)   │     │   com)           │
│   Tailwind)     │     │                 │     │                  │
└─────────────────┘     └─────────────────┘     └──────────────────┘
        │                       │
        │              ┌────────▼────────┐
        └─────────────▶│   Nginx Proxy   │
                       │   (Frontend     │
                       │    serves       │
                       │    static,      │
                       │    proxies API) │
                       └─────────────────┘
```

## 🚀 Quick Start

### 1. Clone & Configure

```bash
git clone <your-repo>
cd hunonic-dashboard

# Copy environment template
cp .env.example .env

# Edit .env with your credentials
nano .env
```

### 2. Configure `.env`

```bash
# REQUIRED - Your Hunonic credentials
HUNONIC_PHONE=+84353700780
HUNONIC_PASSWORD=your_password_here

# OPTIONAL - Server config
PORT=3000
NODE_ENV=production
JWT_SECRET=generate-a-secure-random-string-here
CORS_ORIGIN=https://your-domain.com
```

### 3. Deploy with Docker Compose

```bash
# Build and start
docker-compose up -d --build

# Check logs
docker-compose logs -f

# Check health
curl http://localhost/health
```

### 4. Access Dashboard

- Frontend: `http://your-server-ip` (port 80)
- Backend API: `http://your-server-ip/api/*`
- Health check: `http://your-server-ip/health`

---

## 📦 Coolify Deployment

### Method 1: Docker Compose (Recommended)

1. In Coolify, create new **Resource** → **Docker Compose**
2. Paste the contents of `docker-compose.yml`
3. Set environment variables in Coolify UI:
   - `HUNONIC_PHONE`
   - `HUNONIC_PASSWORD`
   - `JWT_SECRET`
   - `CORS_ORIGIN` (your Coolify domain)
4. Deploy!

### Method 2: Separate Services

If you prefer separate services in Coolify:

1. **Backend Service:**
   - Build from `Dockerfile.backend`
   - Port: 3000
   - Env vars: `HUNONIC_PHONE`, `HUNONIC_PASSWORD`, `JWT_SECRET`, `CORS_ORIGIN`

2. **Frontend Service:**
   - Build from `frontend/Dockerfile.frontend`
   - Port: 80
   - Depends on: backend
   - Uses `nginx.conf` for proxy

---

## 🔧 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/api/homes` | GET | List homes |
| `/api/homes/:id/devices` | GET | Devices in home |
| `/api/devices/electric-meters` | GET | Electric meter devices |
| `/api/devices/:rootId/electricity-rate` | GET | Electricity pricing |
| `/api/devices/:rootId/consumption` | POST | Consumption graph data |
| `/api/devices/:rootId/consumption/current-month` | GET | Current month data |
| `/api/devices/:rootId/consumption/yearly` | GET | Yearly data |
| `/api/dashboard/summary` | GET | Full dashboard summary |

### Consumption Graph Parameters

```json
{
  "type": "2",           // 1=year, 2=month, 3=custom
  "time_start": "2026-09-01",
  "time_end": "2026-09-30",
  "year": "2026",
  "month": "9"           // optional, for month view
}
```

---

## 🛠 Development

```bash
# Backend
cd hunonic-dashboard
npm install
npm run dev          # Hot reload on port 3000

# Frontend (separate terminal)
cd frontend
npm install
npm run dev          # Hot reload on port 5173
```

---

## 📁 Project Structure

```
hunonic-dashboard/
├── .env.example              # Environment template
├── docker-compose.yml        # Docker Compose config
├── Dockerfile.backend        # Backend Dockerfile
├── nginx.conf                # Nginx reverse proxy config
├── package.json              # Backend dependencies
├── tsconfig.json             # TypeScript config
├── src/
│   ├── index.ts              # Hono server entry
│   └── lib/
│       └── hunonic-api.ts    # Hunonic API client
└── frontend/
    ├── package.json
    ├── vite.config.ts
    ├── tailwind.config.js
    ├── Dockerfile.frontend
    ├── index.html
    ├── nginx.conf
    ├── public/
    │   └── logo.svg
    └── src/
        ├── main.tsx
        ├── App.tsx
        ├── index.css
        └── components/
            ├── Dashboard.tsx
            ├── StatCard.tsx
            ├── MeterCard.tsx
            ├── ConsumptionChart.tsx
            ├── LoadingScreen.tsx
            └── ErrorScreen.tsx
```

---

## 🔐 Security Notes

1. **Never commit `.env`** - Add to `.gitignore`
2. **Use strong JWT_SECRET** - Generate with `openssl rand -base64 32`
3. **Enable HTTPS** - Configure SSL in Coolify (Let's Encrypt auto)
4. **Restrict CORS** - Set `CORS_ORIGIN` to your domain only
5. **Firewall** - Only expose ports 80/443, keep 3000 internal

---

## 🐛 Troubleshooting

### Login fails
- Verify phone format: `+84353700780` (with country code)
- Password is MD5 hashed automatically by backend

### No data showing
- Check device is online in Hunonic app
- Verify `root_id` matches your electric meter
- Check backend logs: `docker-compose logs backend`

### Chart empty
- Ensure date range has data
- Try different `type` (1=year, 2=month, 3=custom)

### Coolify deployment issues
- Check build logs for TypeScript errors
- Ensure all env vars are set in Coolify UI
- Verify `nginx.conf` is copied to frontend container

---

## 📝 License

MIT License - Feel free to modify for your needs.

---

## 🙏 Credits

- Reverse engineered from Hunonic iOS app (IPA) and web app
- Built with [Hono](https://hono.dev), [React](https://react.dev), [Tailwind CSS](https://tailwindcss.com), [Recharts](https://recharts.org)
- Deployed on [Coolify](https://coolify.io)