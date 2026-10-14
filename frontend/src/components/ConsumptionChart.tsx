import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';

interface ConsumptionDataPoint {
  date: string;
  kwh: number;
  solar: number;
}

interface ConsumptionChartProps {
  data: ConsumptionDataPoint[];
}

export function ConsumptionChart({ data }: ConsumptionChartProps) {
  // Format data for chart
  const chartData = data.map((d, index) => ({
    ...d,
    name: format(parseISO(d.date), 'dd/MM', { locale: vi }),
    shortName: format(parseISO(d.date), 'dd', { locale: vi }),
    index,
  }));

  const maxKwh = Math.max(...chartData.map(d => d.kwh), 1);

  return (
    <div className="w-full h-[350px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorPower" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#00b33d" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#00b33d" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorSolar" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
            </linearGradient>
          </defs>
          
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke="#e2e8f0" 
            vertical={false}
            horizontal={true}
          />
          
          <XAxis 
            dataKey="shortName" 
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: '#64748b' }}
            interval="preserveStartEnd"
            dy={10}
          />
          
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: '#64748b' }}
            tickFormatter={(value) => `${value}kWh`}
            domain={[0, maxKwh * 1.3]}
          />
          
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              padding: '12px',
            }}
            formatter={(value: number, name: string) => [
              value.toFixed(2),
              name === 'kwh' ? 'Điện năng (kWh)' : name === 'solar' ? 'Năng lượng mặt trời (kWh)' : name,
            ]}
            labelFormatter={(label) => {
              const point = chartData.find(d => d.shortName === label);
              return point ? format(parseISO(point.date), 'EEEE, dd/MM/yyyy', { locale: vi }) : label;
            }}
          />
          
          <Legend 
            wrapperStyle={{ paddingTop: '10px' }}
            iconType="circle"
            formatter={(value) => value === 'kwh' ? 'Điện năng tiêu thụ' : 'Năng lượng mặt trời'}
          />
          
          <Area
            type="monotone"
            dataKey="kwh"
            name="Điện năng tiêu thụ"
            stroke="#00b33d"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorPower)"
            connectNulls={true}
          />
          
          {chartData.some(d => d.solar > 0) && (
            <Area
              type="monotone"
              dataKey="solar"
              name="Năng lượng mặt trời"
              stroke="#f59e0b"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorSolar)"
              connectNulls={true}
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
      
      {/* Summary Stats */}
      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="bg-gray-50 rounded-lg p-4 text-center">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Tổng tiêu thụ</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {data.reduce((sum, d) => sum + d.kwh, 0).toFixed(2)} kWh
          </p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4 text-center">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày cao nhất</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {Math.max(...data.map(d => d.kwh)).toFixed(2)} kWh
          </p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4 text-center">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Trung bình/ngày</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {(data.reduce((sum, d) => sum + d.kwh, 0) / data.length).toFixed(2)} kWh
          </p>
        </div>
      </div>
    </div>
  );
}