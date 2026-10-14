import { Zap } from 'lucide-react';

export function LoadingScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#04070d] text-white p-4">
      <div className="relative flex items-center justify-center">
        {/* Outer glowing pulsing ring */}
        <div className="w-24 h-24 rounded-full border border-emerald-500/20 animate-ping absolute" />
        <div className="w-20 h-20 rounded-full border border-cyan-500/40 animate-spin border-t-emerald-400 absolute" />
        
        {/* Core icon */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400 shadow-[0_0_30px_rgba(0,245,155,0.4)]">
          <Zap className="w-8 h-8 animate-pulse" />
        </div>
      </div>

      <div className="mt-8 text-center space-y-2">
        <h2 className="text-xl font-bold tracking-tight shimmer-text">
          HUNONIC COMMAND CENTER
        </h2>
        <p className="text-xs text-slate-400 font-mono tracking-wider uppercase">
          Đang kết nối lưới điện & đồng bộ telemetry...
        </p>
      </div>
    </div>
  );
}
