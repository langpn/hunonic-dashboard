import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';

export interface DailyPoint {
  date: string;
  kwh: number;
  solar?: number;
}

interface DailyChartProps {
  data: DailyPoint[];
  ratePrice?: number;
}

export function DailyChart({ data, ratePrice = 3800 }: DailyChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-500 text-sm">
        Chưa có dữ liệu tiêu thụ cho tháng này
      </div>
    );
  }

  const values = data.map((d) => d.kwh);
  const maxKwh = Math.max(...values, 1);
  const totalMonthKwh = parseFloat(values.reduce((s, v) => s + v, 0).toFixed(2));
  const activeDays = data.filter((d) => d.kwh > 0).length || 1;
  const avgKwh = parseFloat((totalMonthKwh / activeDays).toFixed(2));

  // Highest day
  const maxDay = data.reduce((max, d) => (d.kwh > max.kwh ? d : max), data[0]);

  // Selected item
  const selectedItem =
    hoveredIndex !== null ? data[hoveredIndex] : data[data.length - 1];

  // SVG dimensions
  const width = 1000;
  const height = 280;
  const paddingX = 40;
  const paddingY = 40;
  const chartWidth = width - paddingX * 2;
  const chartHeight = height - paddingY * 2;

  // Calculate coordinates
  const points = data.map((d, i) => {
    const x = paddingX + (i / Math.max(1, data.length - 1)) * chartWidth;
    const y = height - paddingY - (d.kwh / maxKwh) * chartHeight;
    return { x, y, ...d };
  });

  // SVG Area path (curved)
  const linePath = points.reduce((acc, p, i) => {
    if (i === 0) return `M ${p.x} ${p.y}`;
    const prev = points[i - 1];
    const cx = (prev.x + p.x) / 2;
    return `${acc} C ${cx} ${prev.y}, ${cx} ${p.y}, ${p.x} ${p.y}`;
  }, '');

  const areaPath = `${linePath} L ${points[points.length - 1].x} ${
    height - paddingY
  } L ${points[0].x} ${height - paddingY} Z`;

  return (
    <div className="space-y-6">
      {/* Telemetry Indicator Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
        <div>
          <p className="text-xs text-slate-400">Ngày được chọn</p>
          <p className="text-base sm:text-lg font-bold text-white mt-0.5">
            {selectedItem?.date
              ? format(parseISO(selectedItem.date), 'dd/MM/yyyy', { locale: vi })
              : 'N/A'}
          </p>
        </div>

        <div>
          <p className="text-xs text-slate-400">Tiêu thụ trong ngày</p>
          <p className="text-base sm:text-lg font-bold text-emerald-400 mt-0.5">
            {selectedItem?.kwh.toFixed(2)} <span className="text-xs font-normal">kWh</span>
          </p>
        </div>

        <div>
          <p className="text-xs text-slate-400">Chi phí tạm tính ngày</p>
          <p className="text-base sm:text-lg font-bold text-cyan-300 mt-0.5">
            {Math.round((selectedItem?.kwh || 0) * ratePrice).toLocaleString('vi-VN')} ₫
          </p>
        </div>

        <div>
          <p className="text-xs text-slate-400">Ngày cao nhất tháng</p>
          <p className="text-base sm:text-lg font-bold text-amber-400 mt-0.5">
            {maxDay?.kwh.toFixed(2)} kWh{' '}
            <span className="text-xs font-normal text-slate-400">
              ({maxDay?.date ? format(parseISO(maxDay.date), 'dd/MM') : ''})
            </span>
          </p>
        </div>
      </div>

      {/* Pure Cyber SVG Area Chart */}
      <div className="relative overflow-hidden rounded-xl bg-slate-950/40 p-2 sm:p-4 border border-slate-800/60">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-64 overflow-visible"
        >
          <defs>
            {/* Luminous Neon Gradient Area Fill */}
            <linearGradient id="neonAreaGlow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00f59b" stopOpacity="0.45" />
              <stop offset="60%" stopColor="#00e5ff" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#04070d" stopOpacity="0.0" />
            </linearGradient>

            <filter id="neonStrokeGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#00f59b" floodOpacity="0.8" />
            </filter>
          </defs>

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = height - paddingY - ratio * chartHeight;
            const labelVal = (ratio * maxKwh).toFixed(1);
            return (
              <g key={ratio}>
                <line
                  x1={paddingX}
                  y1={y}
                  x2={width - paddingX}
                  y2={y}
                  stroke="rgba(255,255,255,0.06)"
                  strokeDasharray="4 4"
                />
                <text
                  x={paddingX - 8}
                  y={y + 4}
                  fill="#64748b"
                  fontSize="10"
                  textAnchor="end"
                  fontFamily="monospace"
                >
                  {labelVal}
                </text>
              </g>
            );
          })}

          {/* Area Fill */}
          <path d={areaPath} fill="url(#neonAreaGlow)" />

          {/* Glowing Stroke Line */}
          <path
            d={linePath}
            fill="none"
            stroke="#00f59b"
            strokeWidth="3"
            filter="url(#neonStrokeGlow)"
          />

          {/* Interactive Data Points */}
          {points.map((p, i) => {
            const isHovered = hoveredIndex === i;
            const isHighest = p.kwh === maxKwh && maxKwh > 0;

            return (
              <g
                key={i}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIndex(i)}
              >
                {/* Invisible large hit area */}
                <circle cx={p.x} cy={p.y} r="14" fill="transparent" />

                {/* Point dot */}
                {(isHovered || isHighest || i % 5 === 0) && (
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={isHovered ? 6 : isHighest ? 5 : 3}
                    fill={isHighest ? '#f59e0b' : '#00f59b'}
                    stroke="#04070d"
                    strokeWidth="2"
                    className="transition-all duration-200"
                  />
                )}

                {/* Date label on X axis */}
                {(i % 4 === 0 || i === points.length - 1) && (
                  <text
                    x={p.x}
                    y={height - paddingY + 20}
                    fill="#64748b"
                    fontSize="10"
                    textAnchor="middle"
                    fontFamily="monospace"
                  >
                    {format(parseISO(p.date), 'dd/MM')}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Month Metrics Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 text-xs">
        <div className="p-3.5 rounded-xl bg-slate-900/40 border border-slate-800/60 flex items-center justify-between">
          <span className="text-slate-400">Tổng tiêu thụ tháng</span>
          <span className="text-white font-bold text-sm">{totalMonthKwh} kWh</span>
        </div>
        <div className="p-3.5 rounded-xl bg-slate-900/40 border border-slate-800/60 flex items-center justify-between">
          <span className="text-slate-400">Trung bình ngày hoạt động</span>
          <span className="text-emerald-400 font-bold text-sm">{avgKwh} kWh/ngày</span>
        </div>
        <div className="p-3.5 rounded-xl bg-slate-900/40 border border-slate-800/60 flex items-center justify-between">
          <span className="text-slate-400">Tiền điện tháng tạm tính</span>
          <span className="text-cyan-300 font-bold text-sm">
            {Math.round(totalMonthKwh * ratePrice).toLocaleString('vi-VN')} ₫
          </span>
        </div>
      </div>
    </div>
  );
}
