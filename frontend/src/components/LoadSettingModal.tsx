import { useState, useEffect } from 'react';
import { Sliders, X, Check, Wind, Flame, Zap, Shield, Sparkles } from 'lucide-react';

interface LoadSettingModalProps {
  isOpen: boolean;
  onClose: () => void;
  deviceId: string;
  deviceName?: string;
  currentMaxA: number;
  onSave: (newMaxA: number) => void;
}

interface LoadPreset {
  label: string;
  desc: string;
  amperage: number;
  icon: typeof Wind;
  recommended?: boolean;
}

export function LoadSettingModal({
  isOpen,
  onClose,
  deviceName,
  currentMaxA,
  onSave,
}: LoadSettingModalProps) {
  const [maxAInput, setMaxAInput] = useState<string>(String(currentMaxA || 5.7));

  useEffect(() => {
    if (isOpen) {
      setMaxAInput(String(currentMaxA || 5.7));
    }
  }, [isOpen, currentMaxA]);

  if (!isOpen) return null;

  const presets: LoadPreset[] = [
    {
      label: 'Mitsubishi Heavy 13YZP (1.5 HP)',
      desc: 'Công suất đỉnh 1.240W • Dòng định mức cực đại tem dàn nóng',
      amperage: 5.7,
      icon: Wind,
      recommended: true,
    },
    {
      label: 'Điều hòa 1.0 HP (9.000 BTU)',
      desc: 'Công suất đỉnh ~900W • Dòng cực đại biến tần',
      amperage: 4.2,
      icon: Wind,
    },
    {
      label: 'Điều hòa 2.0 HP (18.000 BTU)',
      desc: 'Công suất đỉnh ~1.850W • Dòng cực đại biến tần',
      amperage: 8.5,
      icon: Wind,
    },
    {
      label: 'Bình nóng lạnh 2.500W',
      desc: 'Tải thuần trở 220V • Dòng chạy liên tục',
      amperage: 11.5,
      icon: Flame,
    },
    {
      label: 'Bếp từ đôi 4.000W',
      desc: 'Hai vùng nấu Booster tối đa',
      amperage: 18.0,
      icon: Zap,
    },
    {
      label: 'Aptomat tổng nhà 63A',
      desc: 'Đo lường phụ tải toàn bộ gia đình',
      amperage: 63.0,
      icon: Shield,
    },
  ];

  const handleApplyPreset = (amp: number) => {
    setMaxAInput(String(amp));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(maxAInput);
    if (!isNaN(val) && val > 0 && val <= 200) {
      onSave(val);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg panel-card p-6 sm:p-7 bg-white dark:bg-[#12161f] border border-slate-200 dark:border-white/10 shadow-2xl rounded-2xl overflow-hidden space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Cài Đặt Định Mức Tải Thiết Bị
              </h2>
              <p className="text-xs text-slate-400">
                {deviceName || 'Công tơ điện'} • Tính % tải chính xác theo định mức phần cứng
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form & Presets */}
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          {/* Custom Input */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>Dòng điện tối đa của thiết bị (Ampe max)</span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                100% tải = {maxAInput || '0'} A
              </span>
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                min="0.5"
                max="200"
                value={maxAInput}
                onChange={(e) => setMaxAInput(e.target.value)}
                placeholder="VD: 5.7"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-[#1a202c] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white font-mono text-sm font-bold outline-none focus:border-emerald-500 transition-colors"
                required
              />
              <span className="absolute right-3.5 top-2.5 text-xs font-mono font-semibold text-slate-400">
                Ampe (A)
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Thanh đo tải trên Dashboard sẽ tính tỷ lệ dựa trên con số này: <code className="font-mono">% Tải = (Dòng đo được / Ampe max) × 100</code>.
            </p>
          </div>

          {/* Quick Presets Selection */}
          <div className="space-y-2 pt-1">
            <span className="font-semibold text-slate-400 uppercase text-[10px] block">
              Chọn nhanh cấu hình theo thiết bị phổ biến:
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {presets.map((preset) => {
                const Icon = preset.icon;
                const isSelected = parseFloat(maxAInput) === preset.amperage;

                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => handleApplyPreset(preset.amperage)}
                    className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shadow-sm'
                        : 'border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50 dark:bg-[#181d28] text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 w-full">
                      <div className="flex items-center gap-1.5 font-bold truncate">
                        <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">{preset.label}</span>
                      </div>
                      {preset.recommended && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-600 text-white flex-shrink-0 flex items-center gap-0.5">
                          <Sparkles className="w-2.5 h-2.5" /> Chuẩn
                        </span>
                      )}
                    </div>

                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 line-clamp-1">
                      {preset.desc}
                    </p>

                    <div className="mt-2 pt-2 border-t border-black/5 dark:border-white/5 flex items-center justify-between">
                      <span className="text-[10px] text-slate-400">Định mức:</span>
                      <strong className="font-mono text-xs font-black">
                        {preset.amperage.toFixed(1)} A
                      </strong>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-white/5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="btn-emerald px-5"
            >
              <Check className="w-4 h-4" />
              <span>Lưu Cài Đặt Tải</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
