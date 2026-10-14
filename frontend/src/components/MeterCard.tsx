import { Zap, WifiOff, Clock, CheckCircle, Info } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';

interface Meter {
  id: string;
  name: string;
  root_id: string;
  root_type: string;
  room_name: string;
  last_online: string;
  power_of_month: number;
  money_of_month: number;
  power_of_prev_month: number;
  money_of_prev_month: number;
  data_extra: string;
  root_extra: string;
}

interface MeterCardProps {
  meter: Meter;
}

function parseExtra(extra: string) {
  try {
    return JSON.parse(extra.replace(/\\"/g, '"'));
  } catch {
    return {};
  }
}

export function MeterCard({ meter }: MeterCardProps) {
  const dataExtra = parseExtra(meter.data_extra);
  const rootExtra = parseExtra(meter.root_extra);
  
  const isOnline = new Date(meter.last_online).getTime() > Date.now() - 10 * 60 * 1000;
  const lastOnline = format(parseISO(meter.last_online), 'dd/MM/yyyy HH:mm', { locale: vi });
  
  const powerChange = meter.power_of_prev_month > 0
    ? ((meter.power_of_month - meter.power_of_prev_month) / meter.power_of_prev_month * 100)
    : 0;
  
  const costChange = meter.money_of_prev_month > 0
    ? ((meter.money_of_month - meter.money_of_prev_month) / meter.money_of_prev_month * 100)
    : 0;

  const powerCurrent = dataExtra.power_current || 0;
  const alphaDefault = rootExtra.alpha_default || 'N/A';
  const volCoef = rootExtra.vol_coef || 'N/A';
  const curCoef = rootExtra.cur_coef || 'N/A';

  return (
    <div className="card">
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
              <Zap className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{meter.name}</h3>
              <p className="text-sm text-gray-500">{meter.room_name} • {meter.root_type.toUpperCase()}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${isOnline ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {isOnline ? (
                <>
                  <CheckCircle className="w-3 h-3" />
                  Trực tuyến
                </>
              ) : (
                <>
                  <WifiOff className="w-3 h-3" />
                  Ngoại tuyến
                </>
              )}
            </span>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Monthly Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Điện năng tháng này</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{meter.power_of_month.toFixed(2)} kWh</p>
            <p className={`text-xs mt-1 ${powerChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {powerChange >= 0 ? '▲' : '▼'} {Math.abs(powerChange).toFixed(1)}% so với tháng trước
            </p>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Chi phí tháng này</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{meter.money_of_month.toLocaleString('vi-VN')} ₫</p>
            <p className={`text-xs mt-1 ${costChange <= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {costChange <= 0 ? '▲' : '▼'} {Math.abs(costChange).toFixed(1)}% so với tháng trước
            </p>
          </div>
        </div>

        {/* Real-time Info */}
        <div className="border-t border-gray-100 pt-6">
          <h4 className="text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
            <Info className="w-4 h-4" />
            Thông tin thời gian thực
          </h4>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="p-2 bg-primary-100 rounded-lg">
                <Zap className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Công suất hiện tại</p>
                <p className="font-semibold text-gray-900">{powerCurrent} W</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Info className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Hệ số điện áp</p>
                <p className="font-semibold text-gray-900">{volCoef}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="p-2 bg-green-100 rounded-lg">
                <Info className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Hệ số dòng điện</p>
                <p className="font-semibold text-gray-900">{curCoef}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Clock className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Cập nhật lần cuối</p>
                <p className="font-semibold text-gray-900 text-xs">{lastOnline}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Device Config */}
        <div className="border-t border-gray-100 pt-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Cấu hình thiết bị</h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex justify-between p-2 bg-gray-50 rounded">
              <span className="text-gray-500">Root ID</span>
              <span className="font-mono text-gray-900 truncate max-w-[150px]">{meter.root_id}</span>
            </div>
            <div className="flex justify-between p-2 bg-gray-50 rounded">
              <span className="text-gray-500">Device ID</span>
              <span className="font-mono text-gray-900">{meter.id}</span>
            </div>
            <div className="flex justify-between p-2 bg-gray-50 rounded">
              <span className="text-gray-500">Loại thiết bị</span>
              <span className="font-medium text-gray-900">{meter.root_type.toUpperCase()}</span>
            </div>
            <div className="flex justify-between p-2 bg-gray-50 rounded">
              <span className="text-gray-500">Alpha Default</span>
              <span className="font-semibold text-gray-900">{alphaDefault}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}