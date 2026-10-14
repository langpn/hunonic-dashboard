import { useState } from 'react';
import { Home, LogOut, Moon, ShieldAlert, Sparkles, Check, ZapOff } from 'lucide-react';

interface Scenario {
  id: string;
  name: string;
  description: string;
  icon: any;
  colorScheme: 'emerald' | 'cyan' | 'violet' | 'amber' | 'rose';
  actionsCount: number;
}

const scenarios: Scenario[] = [
  {
    id: 'arrive_home',
    name: 'Về Nhà',
    description: 'Bật đèn phòng khách, mở hé cửa cuốn, bật điều hòa 25°C',
    icon: Home,
    colorScheme: 'emerald',
    actionsCount: 3,
  },
  {
    id: 'leave_home',
    name: 'Ra Ngoài',
    description: 'Tắt toàn bộ đèn, đóng kín cửa cuốn, bật chế độ bảo vệ',
    icon: LogOut,
    colorScheme: 'cyan',
    actionsCount: 4,
  },
  {
    id: 'sleep_mode',
    name: 'Đi Ngủ',
    description: 'Tắt đèn sinh hoạt, bật đèn ngủ ấm 10%, hẹn giờ điều hòa',
    icon: Moon,
    colorScheme: 'violet',
    actionsCount: 3,
  },
  {
    id: 'security_alert',
    name: 'Báo Động An Ninh',
    description: 'Khóa cửa cuốn, kích hoạt còi hú SOS và nhấp nháy đèn',
    icon: ShieldAlert,
    colorScheme: 'rose',
    actionsCount: 4,
  },
  {
    id: 'eco_saving',
    name: 'Tiết Kiệm Điện Đêm',
    description: 'Tắt bình nóng lạnh và các thiết bị công suất cao không dùng',
    icon: ZapOff,
    colorScheme: 'amber',
    actionsCount: 2,
  },
];

const colorThemes = {
  emerald: {
    bg: 'bg-emerald-500/10 hover:bg-emerald-500/20',
    border: 'border-emerald-500/30 hover:border-emerald-500/60',
    text: 'text-emerald-400',
    glow: 'hover:shadow-[0_0_25px_rgba(0,245,155,0.25)]',
  },
  cyan: {
    bg: 'bg-cyan-500/10 hover:bg-cyan-500/20',
    border: 'border-cyan-500/30 hover:border-cyan-500/60',
    text: 'text-cyan-400',
    glow: 'hover:shadow-[0_0_25px_rgba(0,229,255,0.25)]',
  },
  violet: {
    bg: 'bg-violet-500/10 hover:bg-violet-500/20',
    border: 'border-violet-500/30 hover:border-violet-500/60',
    text: 'text-violet-400',
    glow: 'hover:shadow-[0_0_25px_rgba(139,92,246,0.25)]',
  },
  rose: {
    bg: 'bg-rose-500/10 hover:bg-rose-500/20',
    border: 'border-rose-500/30 hover:border-rose-500/60',
    text: 'text-rose-400',
    glow: 'hover:shadow-[0_0_25px_rgba(244,63,94,0.25)]',
  },
  amber: {
    bg: 'bg-amber-500/10 hover:bg-amber-500/20',
    border: 'border-amber-500/30 hover:border-amber-500/60',
    text: 'text-amber-400',
    glow: 'hover:shadow-[0_0_25px_rgba(245,158,11,0.25)]',
  },
};

export function ScenarioHub() {
  const [activeScenario, setActiveScenario] = useState<string | null>(null);

  const triggerScenario = async (id: string) => {
    setActiveScenario(id);
    try {
      await fetch('/api/device/control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ device_id: 'scenario', action: 'trigger_scenario', value: { scenario_id: id } }),
      });
    } finally {
      setTimeout(() => setActiveScenario(null), 1500);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-400" />
            Trung Tâm Kịch Bản & Ngữ Cảnh Tự Động
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Kích hoạt đồng loạt hàng loạt thiết bị với 1 chạm (Tương thích 100% ngữ cảnh trên app Hunonic)
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {scenarios.map((s) => {
          const theme = colorThemes[s.colorScheme];
          const Icon = s.icon;
          const isTriggering = activeScenario === s.id;

          return (
            <div
              key={s.id}
              className={`mystic-card p-6 flex flex-col justify-between transition-all duration-300 ${theme.glow}`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className={`p-3 rounded-xl border ${theme.bg} ${theme.border} ${theme.text}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-mono text-slate-400 bg-slate-900/60 px-2.5 py-1 rounded-full border border-slate-800">
                    {s.actionsCount} hành động
                  </span>
                </div>

                <h4 className="text-lg font-bold text-white mt-4">{s.name}</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">{s.description}</p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800/80">
                <button
                  disabled={isTriggering}
                  onClick={() => triggerScenario(s.id)}
                  className={`w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                    isTriggering
                      ? 'bg-emerald-500 text-slate-950 shadow-[0_0_20px_rgba(0,245,155,0.6)]'
                      : 'btn-mystic'
                  }`}
                >
                  {isTriggering ? (
                    <>
                      <Check className="w-4 h-4" />
                      Đã kích hoạt thành công
                    </>
                  ) : (
                    'Kích Hoạt Ngữ Cảnh'
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
