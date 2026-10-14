#!/bin/bash
# ==============================================================================
# Script khởi chạy Hunonic Dashboard Local
# ==============================================================================

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
cd "$DIR"

echo "⚡ Đang kiểm tra cổng 3000..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

echo "🚀 Khởi động Hunonic Dashboard Server..."
node dist/index.js &
SERVER_PID=$!

sleep 2

# Kiểm tra health
HEALTH=$(curl -s http://localhost:3000/health 2>/dev/null || echo "")

if [[ $HEALTH == *"ok"* ]]; then
  echo "✅ Dashboard đã sẵn sàng tại: http://localhost:3000"
  echo "📊 Đang mở trình duyệt..."
  open "http://localhost:3000" 2>/dev/null || true
  echo "👉 Nhấn Ctrl + C để dừng server."
  wait $SERVER_PID
else
  echo "❌ Khởi động thất bại. Kiểm tra log phía trên."
  kill $SERVER_PID 2>/dev/null || true
  exit 1
fi
