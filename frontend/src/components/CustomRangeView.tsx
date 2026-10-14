import { useState } from 'react';
import { Calendar, ArrowRight, Loader2 } from 'lucide-react';
import { DailyChart } from './DailyChart';

interface CustomRangeViewProps {
  ratePrice?: number;
  token?: string | null;
}

export function CustomRangeView({ ratePrice = 3800, token }: CustomRangeViewProps) {
  const todayStr = new Date().toISOString().slice(0, 10);
  const monthAgoStr = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const [startDate, setStartDate] = useState(monthAgoStr);
  const [endDate, setEndDate] = useState(todayStr);
  const [data, setData] = useState<any[]>([]);
  const [totalKwh, setTotalKwh] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleFetchRange = async (start: string, end: string) => {
    setLoading(true);
    setHasSearched(true);
    try {
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/dashboard/history?type=custom&start=${start}&end=${end}`, { headers });
      const json = await res.json();

      if (json.success && json.data) {
        setTotalKwh(json.data.total_power || 0);
        setTotalPrice(json.data.total_price || Math.round((json.data.total_power || 0) * ratePrice));
        setData(json.data.graph_data || []);
      }
    } catch (e) {
      console.warn('Failed to fetch custom range:', e);
    } finally {
      setLoading(false);
    }
  };

  // Quick Presets
  const setPreset = (daysAgo: number) => {
    const end = todayStr;
    const start = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    setStartDate(start);
    setEndDate(end);
    handleFetchRange(start, end);
  };

  const setLastMonthPreset = () => {
    const now = new Date();
    const prevMonth = now.getMonth() === 0 ? 12 : now.getMonth();
    const prevYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
    const lastDay = new Date(prevYear, prevMonth, 0).getDate();
    const start = `${prevYear}-${prevMonth.toString().padStart(2, '0')}-01`;
    const end = `${prevYear}-${prevMonth.toString().padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}`;
    setStartDate(start);
    setEndDate(end);
    handleFetchRange(start, end);
  };

  return (
    <div className="space-y-5">
      {/* Date Pickers Form */}
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="w-full sm:flex-1 space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Từ ngày</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-white outline-none focus:border-[#00B33D]"
            />
          </div>

          <ArrowRight className="w-4 h-4 text-slate-400 hidden sm:block mt-5" />

          <div className="w-full sm:flex-1 space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Đến ngày</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-white outline-none focus:border-[#00B33D]"
            />
          </div>

          <button
            onClick={() => handleFetchRange(startDate, endDate)}
            disabled={loading}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#00B33D] hover:bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm mt-0 sm:mt-5 transition-all"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Tra Cứu'}
          </button>
        </div>

        {/* Quick Range Presets */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          <span className="text-slate-400 text-[11px]">Chọn nhanh:</span>
          <button
            onClick={() => setPreset(7)}
            className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-[#00B33D] text-[11px] font-medium"
          >
            7 ngày qua
          </button>
          <button
            onClick={() => setPreset(30)}
            className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-[#00B33D] text-[11px] font-medium"
          >
            30 ngày qua
          </button>
          <button
            onClick={setLastMonthPreset}
            className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-[#00B33D] text-[11px] font-medium text-[#00B33D]"
          >
            Tháng trước (Tháng 9)
          </button>
        </div>
      </div>

      {/* Results View */}
      {loading ? (
        <div className="h-56 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-[#00B33D]" />
        </div>
      ) : hasSearched ? (
        <div className="space-y-4">
          {/* Summary Strip */}
          <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 text-center">
            <div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Tổng điện tiêu thụ</span>
              <p className="text-2xl font-black text-[#00B33D] dark:text-[#10B981] mt-0.5">
                {totalKwh.toFixed(2)} <span className="text-sm font-normal">kWh</span>
              </p>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Tổng chi phí tạm tính</span>
              <p className="text-2xl font-black text-[#EF4444] mt-0.5">
                {totalPrice.toLocaleString('vi-VN')} <span className="text-sm font-normal">₫</span>
              </p>
            </div>
          </div>

          {/* Daily Trend Chart */}
          <DailyChart data={data} ratePrice={ratePrice} />
        </div>
      ) : (
        <div className="h-44 flex flex-col items-center justify-center text-slate-400 text-xs border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
          <Calendar className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2" />
          <span>Chọn khoảng thời gian và bấm "Tra cứu" để xem biểu đồ tiêu thụ</span>
        </div>
      )}
    </div>
  );
}
