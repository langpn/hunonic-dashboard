import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  colorScheme?: 'emerald' | 'cyan' | 'violet' | 'amber' | 'rose';
  subtitle?: string;
  trend?: {
    value: number;
    label: string;
  };
  trendUp?: boolean;
}

const colorMap = {
  emerald: {
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    text: 'text-emerald-400',
    glow: 'group-hover:shadow-[0_0_25px_rgba(0,245,155,0.2)]',
    indicator: 'from-emerald-400 to-teal-500',
  },
  cyan: {
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/30',
    text: 'text-cyan-400',
    glow: 'group-hover:shadow-[0_0_25px_rgba(0,229,255,0.2)]',
    indicator: 'from-cyan-400 to-blue-500',
  },
  violet: {
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/30',
    text: 'text-violet-400',
    glow: 'group-hover:shadow-[0_0_25px_rgba(139,92,246,0.2)]',
    indicator: 'from-violet-400 to-fuchsia-500',
  },
  amber: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    text: 'text-amber-400',
    glow: 'group-hover:shadow-[0_0_25px_rgba(245,158,11,0.2)]',
    indicator: 'from-amber-400 to-orange-500',
  },
  rose: {
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/30',
    text: 'text-rose-400',
    glow: 'group-hover:shadow-[0_0_25px_rgba(244,63,94,0.2)]',
    indicator: 'from-rose-400 to-pink-500',
  },
};

export function StatCard({
  title,
  value,
  icon: Icon,
  colorScheme = 'emerald',
  subtitle,
  trend,
  trendUp,
}: StatCardProps) {
  const scheme = colorMap[colorScheme];

  return (
    <div
      className={`group mystic-card p-6 relative overflow-hidden transition-all duration-300 ${scheme.glow}`}
    >
      {/* Top Accent Line */}
      <div
        className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${scheme.indicator} opacity-70 group-hover:opacity-100 transition-opacity`}
      />

      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-wider font-semibold text-slate-400">
            {title}
          </p>
          <p className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight pt-1">
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-slate-400 font-medium">{subtitle}</p>
          )}
        </div>

        <div
          className={`p-3 rounded-xl ${scheme.bg} border ${scheme.border} ${scheme.text} transition-transform group-hover:scale-110 duration-300`}
        >
          <Icon className="w-6 h-6" />
        </div>
      </div>

      {trend && (
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
          <span
            className={`font-semibold flex items-center gap-1 ${
              trendUp ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {trendUp ? '▲' : '▼'} {Math.abs(trend.value).toFixed(1)}%
          </span>
          <span className="text-slate-500">{trend.label}</span>
        </div>
      )}
    </div>
  );
}
