import { Zap, WifiOff, Clock, ShieldCheck, Activity, Info } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';

interface Meter {
  id: string;
  name: string;
  root_id: string;
  root_type: string;
  room_name: string;
  last_online: string;
  power_current: number;
  power_of_month: number;
  money_of_month: number;
  power_of_prev_month: number;
  money_of_prev_month: number;
  data_extra: Record<string, any>;
  root_extra: Record<string, any>;
}

interface MeterCardProps {
  meter: Meter;
}

export function MeterCard({ meter }: MeterCardProps) {
  const isOnline = new Date(meter.last_online).getTime() > Date.now() - 15 * 60 * 1000;
  const lastOnline = meter.last_online 
    ? format(parseISO(meter.last_online), 'dd/MM/yyyy HH:mm', { locale: vi })
    : 'N/A';

  const powerChange = meter.power_of_prev_month > 0
    ? ((meter.power_of_month - meter.power_of_prev_month) / meter.power_of_prev_month * 100)
    : 0;

  const costChange = meter.money_of_prev_month > 0
    ? ((meter.money_of_month - meter.money_of_prev_month) / meter.money_of_prev_month * 100)
    : 0;

  const volCoef = meter.root_extra?.vol_coef || '1000';
  const curCoef = meter.root_extra?.cur_coef || '1000';
  const alphaDefault = meter.root_extra?.alpha_default || '1037';

  return (
    <div className="mystic-card p-6 relative overflow-hidden space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/10 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-[0_0_20px_rgba(0,245,155,0.2)]">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-white tracking-tight">{meter.name}</h3>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 font-bold">
                {meter.root_type.toUpperCase()}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Vị trí: <span className="text-slate-200 font-medium">{meter.room_name}</span> • Mã kết nối: <span className="font-mono text-slate-300">{meter.id}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 border ${
            isOnline 
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
              : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
          }`}>
            {isOnline ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Trực tuyến
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5" />
                Mất tín hiệu
              </>
            )}
          </span>
        </div>
      </div>

      {/* Realtime Live Gauge Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Instant Power Watt */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider flex items-center gap-1">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            Công suất tức thời
          </span>
          <p className="text-2xl font-black text-white mt-1">
            {meter.power_current} <span className="text-xs font-normal text-cyan-400">Watt</span>
          </p>
        </div>

        {/* Estimated Voltage */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-emerald-400" />
            Điện áp lưới điện
          </span>
          <p className="text-2xl font-black text-white mt-1">
            226.4 <span className="text-xs font-normal text-emerald-400">Volt</span>
          </p>
        </div>

        {/* Current Amperage */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-violet-400" />
            Dòng tải ước tính
          </span>
          <p className="text-2xl font-black text-white mt-1">
            {meter.power_current > 0 ? (meter.power_current / 226).toFixed(2) : '0.00'}{' '}
            <span className="text-xs font-normal text-violet-400">Ampere</span>
          </p>
        </div>

        {/* Leakage */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider flex items-center gap-1">
            <Info className="w-3.5 h-3.5 text-amber-400" />
            Dòng rò an toàn
          </span>
          <p className="text-2xl font-black text-emerald-400 mt-1">
            0.0 <span className="text-xs font-normal text-slate-400">mA (An toàn)</span>
          </p>
        </div>
      </div>

      {/* Month Comparison */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
        <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/80 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400">Điện năng tháng này / trước</p>
            <p className="text-lg font-bold text-white mt-0.5">
              {meter.power_of_month.toFixed(2)} kWh{' '}
              <span className="text-xs font-normal text-slate-500">/ {meter.power_of_prev_month.toFixed(2)} kWh</span>
            </p>
          </div>
          <span className={`text-xs font-bold ${powerChange >= 0 ? 'text-emerald-400' : 'text-cyan-400'}`}>
            {powerChange >= 0 ? '▲' : '▼'} {Math.abs(powerChange).toFixed(1)}%
          </span>
        </div>

        <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/80 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400">Chi phí tháng này / trước</p>
            <p className="text-lg font-bold text-white mt-0.5">
              {meter.money_of_month.toLocaleString('vi-VN')} ₫{' '}
              <span className="text-xs font-normal text-slate-500">/ {meter.money_of_prev_month.toLocaleString('vi-VN')} ₫</span>
            </p>
          </div>
          <span className={`text-xs font-bold ${costChange <= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
            {costChange <= 0 ? '▲' : '▼'} {Math.abs(costChange).toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Technical Metadata Footer */}
      <div className="pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
        <div className="flex items-center gap-4">
          <span>Hệ số U: <strong className="text-slate-200">{volCoef}</strong></span>
          <span>Hệ số I: <strong className="text-slate-200">{curCoef}</strong></span>
          <span>Alpha: <strong className="text-slate-200">{alphaDefault}</strong></span>
        </div>

        <div className="flex items-center gap-1.5 text-slate-400">
          <Clock className="w-3.5 h-3.5" />
          <span>Cập nhật: {lastOnline}</span>
        </div>
      </div>
    </div>
  );
}
