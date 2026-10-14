import { ConsumptionChart } from './ConsumptionChart';
import { MeterCard } from './MeterCard';
import { StatCard } from './StatCard';
import { RefreshCw, Zap, DollarSign, TrendingUp, TrendingDown, Calendar, Activity } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import type { SummaryData } from '../App';

interface DashboardProps {
  summary: SummaryData;
  onRefresh: () => void;
}

export function Dashboard({ summary, onRefresh }: DashboardProps) {
  const { home, electricMeters, today, currentMonth, electricityRate } = summary;
  const primaryMeter = electricMeters[0];
  
  const powerChange = primaryMeter && primaryMeter.power_of_prev_month > 0
    ? ((primaryMeter.power_of_month - primaryMeter.power_of_prev_month) / primaryMeter.power_of_prev_month * 100)
    : 0;

  const isOnline = primaryMeter && new Date(primaryMeter.last_online).getTime() > Date.now() - 15 * 60 * 1000;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Hunonic Energy Monitor</h1>
                <p className="text-sm text-gray-500">{home.name}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm">
                <span className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                <span className="text-gray-600 font-medium">{isOnline ? 'Trực tuyến' : 'Ngoại tuyến'}</span>
              </div>
              <button
                onClick={onRefresh}
                className="btn btn-secondary flex items-center gap-2 hover:bg-gray-200"
              >
                <RefreshCw className="w-4 h-4" />
                Làm mới
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Core Daily Highlight Box */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-2xl p-6 sm:p-8 text-white mb-8 shadow-lg">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="flex items-center gap-2 text-emerald-200 text-sm font-semibold uppercase tracking-wider">
                <Calendar className="w-4 h-4" />
                Hôm nay ({format(new Date(), 'dd/MM/yyyy', { locale: vi })})
              </div>
              <div className="text-4xl sm:text-5xl font-extrabold mt-2 tracking-tight">
                {today.kwh.toFixed(2)} <span className="text-2xl sm:text-3xl font-medium text-emerald-200">kWh</span>
              </div>
              <p className="text-emerald-100 text-sm mt-1">
                Chi phí ước tính: <span className="font-semibold">{today.cost_estimated.toLocaleString('vi-VN')} ₫</span>
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 sm:text-right">
              <div className="text-xs uppercase text-emerald-200 font-medium flex items-center sm:justify-end gap-1.5">
                <Activity className="w-4 h-4 text-emerald-300" />
                Công suất thời gian thực
              </div>
              <div className="text-3xl font-bold mt-1 text-white">
                {today.power_current_w} <span className="text-lg font-normal text-emerald-200">W</span>
              </div>
              <div className="text-xs text-emerald-200 mt-0.5">
                Đơn giá: {electricityRate?.price ? parseInt(electricityRate.price).toLocaleString('vi-VN') : '3,800'} ₫/kWh
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Điện tiêu thụ hôm nay"
            value={`${today.kwh.toFixed(2)} kWh`}
            icon={Zap}
            iconColor="text-yellow-500 bg-yellow-100"
            subtitle={`Ước tính: ${today.cost_estimated.toLocaleString('vi-VN')} ₫`}
          />

          <StatCard
            title="Công suất tức thời"
            value={`${today.power_current_w} W`}
            icon={Activity}
            iconColor="text-blue-500 bg-blue-100"
            subtitle="Đo từ công tơ điện tử"
          />
          
          <StatCard
            title="Tổng điện tháng này"
            value={`${currentMonth?.total_power?.toFixed(2) || primaryMeter?.power_of_month?.toFixed(2) || 0} kWh`}
            icon={Zap}
            iconColor="text-emerald-500 bg-emerald-100"
            trend={{ value: powerChange, label: 'so với tháng trước' }}
            trendUp={powerChange >= 0}
          />
          
          <StatCard
            title="Chi phí tháng này"
            value={`${(currentMonth?.total_price || primaryMeter?.money_of_month || 0).toLocaleString('vi-VN')} ₫`}
            icon={DollarSign}
            iconColor="text-purple-500 bg-purple-100"
            subtitle={electricityRate?.group_name || 'Tự thiết lập'}
          />
        </div>

        {/* Meter Details */}
        <div className="mb-8">
          {electricMeters.map((meter) => (
            <MeterCard key={meter.id} meter={meter as any} />
          ))}
        </div>

        {/* Consumption Chart */}
        {currentMonth && (
          <div className="card">
            <div className="p-6 border-b border-gray-100">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Biểu đồ tiêu thụ điện theo ngày</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Tháng {format(new Date(), 'MM/yyyy', { locale: vi })} • 
                    Tổng tháng: {currentMonth.total_power.toFixed(2)} kWh • 
                    Tạm tính: {currentMonth.total_price.toLocaleString('vi-VN')} ₫
                  </p>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-100 px-3 py-1.5 rounded-lg">
                  <Calendar className="w-4 h-4 text-gray-600" />
                  <span>{currentMonth.daily_data.length} ngày trong tháng</span>
                </div>
              </div>
            </div>
            <div className="p-6">
              <ConsumptionChart data={currentMonth.daily_data} />
            </div>
          </div>
        )}

        {/* Month Boundaries summary */}
        {currentMonth && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-8">
            <StatCard
              title="Chỉ số công tơ đầu tháng"
              value={`${currentMonth.first_power.toFixed(2)} kWh`}
              icon={TrendingUp}
              iconColor="text-gray-500 bg-gray-100"
            />
            <StatCard
              title="Chỉ số công tơ hiện tại"
              value={`${currentMonth.last_power.toFixed(2)} kWh`}
              icon={TrendingDown}
              iconColor="text-gray-500 bg-gray-100"
            />
            <StatCard
              title="Mức tiêu thụ bình quân/ngày"
              value={`${(currentMonth.total_power / (currentMonth.daily_data.filter(d => d.kwh > 0).length || 1)).toFixed(2)} kWh`}
              icon={Zap}
              iconColor="text-primary-500 bg-primary-100"
            />
          </div>
        )}
      </main>
    </div>
  );
}
