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
      <div className="h-56 flex items-center justify-center text-slate-400 text-xs">
        Chưa có dữ liệu tiêu thụ cho tháng này
      </div>
    );
  }

  const values = data.map((d) => d.kwh);
  const maxKwh = Math.max(...values, 1);
  const totalMonthKwh = parseFloat(values.reduce((s, v) => s + v, 0).toFixed(2));
  const activeDays = data.filter((d) => d.kwh > 0).length || 1;
  const avgKwh = parseFloat((totalMonthKwh / activeDays).toFixed(2));
  const maxDay = data.reduce((max, d) => (d.kwh > max.kwh ? d : max), data[0]);

  // Selected item
  const selectedItem =
    hoveredIndex !== null ? data[hoveredIndex] : data[data.length - 1];

  // SVG dimensions
  const width = 1000;
  const height = 240;
  const paddingX = 35;
  const paddingY = 35;
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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 transition-colors">
        <div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">Ngày chọn</p>
          <p className="text-sm font-bold text-slate-800 dark:text-white mt-0.5">
            {selectedItem?.date
              ? format(parseISO(selectedItem.date), 'dd/MM/yyyy', { locale: vi })
              : 'N/A'}
          </p>
        </div>

        <div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">Tiêu thụ</p>
          <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
            {selectedItem?.kwh.toFixed(2)} <span className="text-xs font-normal">kWh</span>
          </p>
        </div>

        <div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">Chi phí tạm tính</p>
          <p className="text-sm font-bold text-sky-600 dark:text-sky-400 mt-0.5">
            {Math.round((selectedItem?.kwh || 0) * ratePrice).toLocaleString('vi-VN')} ₫
          </p>
        </div>

        <div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">Cao nhất tháng</p>
          <p className="text-sm font-bold text-amber-600 dark:text-amber-400 mt-0.5">
            {maxDay?.kwh.toFixed(2)} kWh{' '}
            <span className="text-xs font-normal text-slate-400">
              ({maxDay?.date ? format(parseISO(maxDay.date), 'dd/MM') : ''})
            </span>
          </p>
        </div>
      </div>

      {/* SVG Line / Area */}
      <div className="relative overflow-hidden rounded-xl bg-slate-50/60 dark:bg-slate-950/40 p-2 sm:p-4 border border-slate-200 dark:border-slate-800/80">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-56 overflow-visible"
        >
          <defs>
            <linearGradient id="cleanAreaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.33, 0.66, 1].map((ratio) => {
            const y = height - paddingY - ratio * chartHeight;
            const labelVal = (ratio * maxKwh).toFixed(1);
            return (
              <g key={ratio}>
                <line
                  x1={paddingX}
                  y1={y}
                  x2={width - paddingX}
                  y2={y}
                  stroke="currentColor"
                  className="text-slate-200 dark:text-slate-800/60"
                  strokeDasharray="4 4"
                />
                <text
                  x={paddingX - 8}
                  y={y + 4}
                  className="fill-slate-400 dark:fill-slate-500 text-[10px]"
                  textAnchor="end"
                  fontFamily="monospace"
                >
                  {labelVal}
                </text>
              </g>
            );
          })}

          {/* Area Fill */}
          <path d={areaPath} fill="url(#cleanAreaGradient)" />

          {/* Stroke Line */}
          <path
            d={linePath}
            fill="none"
            stroke="#10b981"
            strokeWidth="2.5"
            strokeLinecap="round"
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
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Hit area */}
                <circle cx={p.x} cy={p.y} r="14" fill="transparent" />

                {/* Point */}
                {(isHovered || isHighest || i % 5 === 0) && (
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={isHovered ? 5.5 : isHighest ? 4.5 : 3}
                    fill={isHighest ? '#f59e0b' : '#10b981'}
                    stroke="white"
                    strokeWidth="1.5"
                    className="transition-all duration-150"
                  />
                )}

                {/* Date label on X axis */}
                {(i % 4 === 0 || i === points.length - 1) && (
                  <text
                    x={p.x}
                    y={height - paddingY + 20}
                    className="fill-slate-400 dark:fill-slate-500 text-[10px]"
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

      {/* Summary Footer */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-600 dark:text-slate-400 pt-1">
        <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <span>Tổng tháng này</span>
          <strong className="text-slate-900 dark:text-white text-sm">{totalMonthKwh} kWh</strong>
        </div>
        <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <span>Bình quân ngày chạy</span>
          <strong className="text-emerald-600 dark:text-emerald-400 text-sm">{avgKwh} kWh/ngày</strong>
        </div>
        <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <span>Tiền điện tạm tính</span>
          <strong className="text-sky-600 dark:text-sky-400 text-sm">
            {Math.round(totalMonthKwh * ratePrice).toLocaleString('vi-VN')} ₫
          </strong>
        </div>
      </div>
    </div>
  );
}
