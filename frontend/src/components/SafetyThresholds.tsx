import { useState } from 'react';
import { Shield, Zap, AlertTriangle, Save, CheckCircle2, Sliders, Calendar } from 'lucide-react';

interface SafetyThresholdsProps {
  currentRatePrice?: string;
  closingDay?: number;
}

export function SafetyThresholds({ currentRatePrice = '3800', closingDay = 31 }: SafetyThresholdsProps) {
  const [thresholds, setThresholds] = useState({
    overpower: 6000,          // Watts
    overcurrent: 32,          // Amps
    overvoltage: 250,         // Volts
    undervoltage: 180,        // Volts
    leakage: 30,              // mA (chống giật)
    action: 'trip',           // 'trip' (ngắt rơle) or 'warn' (chỉ cảnh báo)
    closingDate: closingDay,
    ratePrice: currentRatePrice,
  });

  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await fetch('/api/device/thresholds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(thresholds),
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-400" />
            Cài Đặt Ngưỡng Bảo Vệ An Toàn & Giá Điện
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Thiết lập các giới hạn bảo vệ tự động của Aptomat / Công tơ thông minh Hunonic
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Protection Limits */}
        <div className="mystic-card p-6 space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800 text-sm font-bold text-cyan-400">
            <AlertTriangle className="w-4 h-4" />
            Ngưỡng Ngắt Điện & Bảo Vệ Thiết Bị
          </div>

          <div className="space-y-4 text-xs">
            {/* Overpower */}
            <div>
              <div className="flex justify-between font-semibold text-slate-300 mb-1.5">
                <span>Quá công suất (W)</span>
                <span className="text-cyan-300 font-mono font-bold">{thresholds.overpower} W</span>
              </div>
              <input
                type="range"
                min="500"
                max="12000"
                step="100"
                value={thresholds.overpower}
                onChange={(e) => setThresholds({ ...thresholds, overpower: Number(e.target.value) })}
                className="w-full accent-cyan-400 cursor-pointer"
              />
              <span className="text-[10px] text-slate-500">Phạm vi: 500W - 12,000W</span>
            </div>

            {/* Overcurrent */}
            <div>
              <div className="flex justify-between font-semibold text-slate-300 mb-1.5">
                <span>Quá dòng tải (A)</span>
                <span className="text-cyan-300 font-mono font-bold">{thresholds.overcurrent} A</span>
              </div>
              <input
                type="range"
                min="5"
                max="63"
                step="1"
                value={thresholds.overcurrent}
                onChange={(e) => setThresholds({ ...thresholds, overcurrent: Number(e.target.value) })}
                className="w-full accent-cyan-400 cursor-pointer"
              />
              <span className="text-[10px] text-slate-500">Phạm vi: 5A - 63A</span>
            </div>

            {/* Overvoltage */}
            <div>
              <div className="flex justify-between font-semibold text-slate-300 mb-1.5">
                <span>Quá điện áp (V)</span>
                <span className="text-amber-400 font-mono font-bold">{thresholds.overvoltage} V</span>
              </div>
              <input
                type="range"
                min="230"
                max="280"
                step="2"
                value={thresholds.overvoltage}
                onChange={(e) => setThresholds({ ...thresholds, overvoltage: Number(e.target.value) })}
                className="w-full accent-amber-400 cursor-pointer"
              />
              <span className="text-[10px] text-slate-500">Phạm vi: 230V - 280V</span>
            </div>

            {/* Undervoltage */}
            <div>
              <div className="flex justify-between font-semibold text-slate-300 mb-1.5">
                <span>Thấp điện áp (V)</span>
                <span className="text-amber-400 font-mono font-bold">{thresholds.undervoltage} V</span>
              </div>
              <input
                type="range"
                min="140"
                max="200"
                step="2"
                value={thresholds.undervoltage}
                onChange={(e) => setThresholds({ ...thresholds, undervoltage: Number(e.target.value) })}
                className="w-full accent-amber-400 cursor-pointer"
              />
              <span className="text-[10px] text-slate-500">Phạm vi: 140V - 200V</span>
            </div>

            {/* Leakage Protection */}
            <div>
              <div className="flex justify-between font-semibold text-slate-300 mb-1.5">
                <span>Dòng rò chống giật (mA)</span>
                <span className="text-emerald-400 font-mono font-bold">{thresholds.leakage} mA</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                step="5"
                value={thresholds.leakage}
                onChange={(e) => setThresholds({ ...thresholds, leakage: Number(e.target.value) })}
                className="w-full accent-emerald-400 cursor-pointer"
              />
              <span className="text-[10px] text-slate-500">Chuẩn an toàn dân dụng: 30mA</span>
            </div>
          </div>
        </div>

        {/* Action & Electricity Pricing */}
        <div className="mystic-card p-6 space-y-6 flex flex-col justify-between">
          <div className="space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800 text-sm font-bold text-emerald-400">
              <Sliders className="w-4 h-4" />
              Hành Động Khi Vi Phạm & Cài Đặt Giá
            </div>

            {/* Action Trigger */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">Hành động khi chạm ngưỡng bảo vệ:</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setThresholds({ ...thresholds, action: 'trip' })}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all ${
                    thresholds.action === 'trip'
                      ? 'bg-rose-500/20 border-rose-500/60 text-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.3)]'
                      : 'bg-slate-900/40 border-slate-800 text-slate-400'
                  }`}
                >
                  ⚡ Tự ngắt điện ngay (Trip)
                </button>

                <button
                  type="button"
                  onClick={() => setThresholds({ ...thresholds, action: 'warn' })}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all ${
                    thresholds.action === 'warn'
                      ? 'bg-amber-500/20 border-amber-500/60 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                      : 'bg-slate-900/40 border-slate-800 text-slate-400'
                  }`}
                >
                  🔔 Chỉ gửi cảnh báo
                </button>
              </div>
            </div>

            {/* Closing Date */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-cyan-400" />
                Ngày chốt số điện hàng tháng:
              </label>
              <select
                value={thresholds.closingDate}
                onChange={(e) => setThresholds({ ...thresholds, closingDate: Number(e.target.value) })}
                className="w-full p-2.5 rounded-xl bg-slate-900/80 border border-slate-700 text-white text-xs font-bold focus:border-cyan-400 outline-none"
              >
                {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={d}>
                    Ngày {d} hàng tháng
                  </option>
                ))}
              </select>
            </div>

            {/* Rate Price */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-emerald-400" />
                Đơn giá điện tự thiết lập (₫/kWh):
              </label>
              <input
                type="number"
                value={thresholds.ratePrice}
                onChange={(e) => setThresholds({ ...thresholds, ratePrice: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-slate-900/80 border border-slate-700 text-white text-xs font-bold focus:border-emerald-400 outline-none font-mono"
                placeholder="VD: 3800"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4 border-t border-slate-800">
            <button
              type="submit"
              disabled={saving}
              className={`w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                savedSuccess
                  ? 'bg-emerald-500 text-slate-950 shadow-[0_0_20px_rgba(0,245,155,0.6)]'
                  : 'btn-mystic'
              }`}
            >
              {savedSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Đã Lưu Cấu Hình An Toàn
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {saving ? 'Đang lưu...' : 'Lưu Thay Đổi Lên Thiết Bị'}
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
