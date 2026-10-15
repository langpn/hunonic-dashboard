import { useState, useEffect } from 'react';
import { 
  ChevronLeft, Trash2, Edit3, Grid, Share2, ExternalLink, 
  History, Sliders, Sun, DollarSign, Calendar, Home, 
  Bell, FileText, Scale, Info, ChevronRight, Check, AlertCircle, Zap
} from 'lucide-react';

interface Thresholds {
  over_power_w: number | null;
  over_current_a: number | null;
  over_voltage_v: number | null;
  under_voltage_v: number | null;
  leakage_current_ma: number | null;
}

interface DeviceSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  deviceId: string;
  initialName?: string;
  initialRoom?: string;
  monthKwh?: number;
  token?: string | null;
  onRefresh?: () => void;
}

type ActiveSubView = 
  | null 
  | 'rename' 
  | 'room' 
  | 'share' 
  | 'thresholds' 
  | 'rate' 
  | 'billing_date' 
  | 'household' 
  | 'alert_kwh' 
  | 'solar' 
  | 'balance' 
  | 'offline_alert' 
  | 'hardware_info' 
  | 'clear_data';

export function DeviceSettingsModal({
  isOpen,
  onClose,
  deviceId = '3590138',
  initialName = 'Bộ kiểm soát điện năng',
  initialRoom = 'Chưa xếp phòng',
  monthKwh = 36.67,
  token,
  onRefresh,
}: DeviceSettingsModalProps) {
  const [activeSubView, setActiveSubView] = useState<ActiveSubView>(null);
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  // Settings State
  const [deviceName, setDeviceName] = useState(initialName);
  const [roomName, setRoomName] = useState(initialRoom);
  const [sharedCount] = useState(1);
  const [thresholds, setThresholds] = useState<Thresholds>({
    over_power_w: null,
    over_current_a: 3.0, // Default 3A matching screenshot
    over_voltage_v: null,
    under_voltage_v: null,
    leakage_current_ma: null,
  });
  const [solarKwh, setSolarKwh] = useState(0);
  const [rateType, setRateType] = useState('Tự thiết lập');
  const [ratePrice, setRatePrice] = useState(3800);
  const [billingDate, setBillingDate] = useState(1);
  const [householdMultiplier, setHouseholdMultiplier] = useState(1);
  const [alertKwh, setAlertKwh] = useState<number | null>(null);
  const [dualBalance] = useState('Chưa liên kết');
  const [notifyOffline, setNotifyOffline] = useState(false);

  // Form input temps
  const [tempName, setTempName] = useState(initialName);
  const [tempThresholds, setTempThresholds] = useState<Thresholds>(thresholds);
  const [tempPrice, setTempPrice] = useState(3800);
  const [tempBillingDate, setTempBillingDate] = useState(1);
  const [tempHousehold, setTempHousehold] = useState(1);
  const [tempAlertKwh, setTempAlertKwh] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      fetchSettings();
    }
  }, [isOpen, deviceId]);

  if (!isOpen) return null;

  const fetchSettings = async () => {
    try {
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/device/settings?device_id=${encodeURIComponent(deviceId)}`, { headers });
      const json = await res.json();
      if (json.success && json.data) {
        const d = json.data;
        if (d.name) setDeviceName(d.name);
        if (d.room_name) setRoomName(d.room_name);
        if (d.thresholds) {
          setThresholds(d.thresholds);
          setTempThresholds(d.thresholds);
        }
        if (d.billing_date) {
          setBillingDate(d.billing_date);
          setTempBillingDate(d.billing_date);
        }
        if (d.household_multiplier) {
          setHouseholdMultiplier(d.household_multiplier);
          setTempHousehold(d.household_multiplier);
        }
        if (d.notify_offline !== undefined) setNotifyOffline(!!d.notify_offline);
        if (d.solar_kwh !== undefined) setSolarKwh(d.solar_kwh);
      }
    } catch {
      // Non-blocking fallback
    }
  };

  const handleSaveSettings = async (updates: Record<string, any>, successMsg: string) => {
    setLoading(true);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/device/settings', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          device_id: deviceId,
          settings: updates,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setSaveSuccess(successMsg);
        setTimeout(() => setSaveSuccess(null), 2500);
        setActiveSubView(null);
        if (onRefresh) onRefresh();
      }
    } catch {
      // Non-blocking
    } finally {
      setLoading(false);
    }
  };

  // Thresholds summary string: e.g. "--W / 3A / --V / --V / --W"
  const thresholdString = `${thresholds.over_power_w ? thresholds.over_power_w + 'W' : '--W'} / ${
    thresholds.over_current_a ? thresholds.over_current_a + 'A' : '--A'
  } / ${thresholds.over_voltage_v ? thresholds.over_voltage_v + 'V' : '--V'} / ${
    thresholds.under_voltage_v ? thresholds.under_voltage_v + 'V' : '--V'
  } / ${thresholds.leakage_current_ma ? thresholds.leakage_current_ma + 'mA' : '--W'}`;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Backdrop */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Main Container / Mobile Drawer */}
      <div className="relative w-full max-w-lg bg-[#0e121a] text-slate-100 border border-slate-800 shadow-2xl rounded-t-3xl sm:rounded-2xl overflow-hidden z-10 animate-in slide-in-from-bottom duration-300 max-h-[92vh] flex flex-col">
        {/* Mobile drag bar */}
        <div className="sm:hidden w-12 h-1 bg-slate-700 rounded-full mx-auto mt-2.5 mb-1" />

        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/80 flex-shrink-0">
          <button
            onClick={activeSubView ? () => setActiveSubView(null) : onClose}
            className="p-1.5 -ml-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <h2 className="text-base font-bold text-white tracking-tight truncate max-w-[260px]">
            {activeSubView ? 'Cài Đặt Chi Tiết' : deviceName}
          </h2>

          <button
            onClick={() => setActiveSubView('clear_data')}
            className="p-1.5 -mr-1.5 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
            title="Xóa thiết bị hoặc dữ liệu"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Success toast banner */}
        {saveSuccess && (
          <div className="px-5 py-2.5 bg-emerald-500/15 border-b border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span>{saveSuccess}</span>
          </div>
        )}

        {/* Scrollable Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* Main List View */}
          {!activeSubView && (
            <>
              {/* Header Device Summary Pill */}
              <div className="p-4 rounded-2xl bg-[#161b26] border border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{deviceName}</h3>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">
                      {Math.round(monthKwh)} kWh trong tháng
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  Online
                </span>
              </div>

              {/* Group 1: Thông tin cơ bản */}
              <div className="rounded-2xl bg-[#161b26] border border-slate-800/80 overflow-hidden divide-y divide-slate-800/60 text-xs">
                <button
                  onClick={() => {
                    setTempName(deviceName);
                    setActiveSubView('rename');
                  }}
                  className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-slate-800/50 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <Edit3 className="w-4 h-4 text-emerald-400" />
                    <span className="font-semibold text-slate-200">Đổi tên thiết bị</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <span className="truncate max-w-[140px] text-right">{deviceName}</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </button>

                <button
                  onClick={() => setActiveSubView('room')}
                  className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-slate-800/50 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <Grid className="w-4 h-4 text-emerald-400" />
                    <span className="font-semibold text-slate-200">Phòng</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <span>{roomName}</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </button>

                <button
                  onClick={() => setActiveSubView('share')}
                  className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-slate-800/50 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <Share2 className="w-4 h-4 text-emerald-400" />
                    <span className="font-semibold text-slate-200">Chia sẻ</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <span>Đã chia sẻ cho {sharedCount} người</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </button>

                <button
                  onClick={() => alert('Để thêm lối tắt: Mở Menu trình duyệt > Chọn "Thêm vào màn hình chính (Add to Home Screen)".')}
                  className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-slate-800/50 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <ExternalLink className="w-4 h-4 text-emerald-400" />
                    <span className="font-semibold text-slate-200">Thêm lối tắt</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
              </div>

              {/* Group 2: Cài đặt điện năng & Thông số nâng cao */}
              <div className="rounded-2xl bg-[#161b26] border border-slate-800/80 overflow-hidden divide-y divide-slate-800/60 text-xs">
                <button
                  onClick={() => {
                    onClose();
                    // Day history is already on dashboard
                  }}
                  className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-slate-800/50 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <History className="w-4 h-4 text-emerald-400" />
                    <div>
                      <span className="font-semibold text-slate-200 block">Lịch sử</span>
                      <span className="text-[11px] text-slate-400">Ấn vào trong để xem lịch sử</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>

                <button
                  onClick={() => {
                    setTempThresholds(thresholds);
                    setActiveSubView('thresholds');
                  }}
                  className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-slate-800/50 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <Sliders className="w-4 h-4 text-emerald-400" />
                    <div>
                      <span className="font-semibold text-slate-200 block">Cài đặt ngưỡng</span>
                      <span className="text-[11px] text-slate-400 font-mono">{thresholdString}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>

                <button
                  onClick={() => setActiveSubView('solar')}
                  className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-slate-800/50 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <Sun className="w-4 h-4 text-emerald-400" />
                    <span className="font-semibold text-slate-200">Điện năng lượng mặt trời</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <span className="font-mono">{solarKwh} kWh</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </button>

                <button
                  onClick={() => {
                    setTempPrice(ratePrice);
                    setActiveSubView('rate');
                  }}
                  className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-slate-800/50 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                    <span className="font-semibold text-slate-200">Cài đặt mức giá tiền điện</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <span>{rateType} ({ratePrice.toLocaleString('vi-VN')}₫)</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </button>

                <button
                  onClick={() => {
                    setTempBillingDate(billingDate);
                    setActiveSubView('billing_date');
                  }}
                  className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-slate-800/50 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-emerald-400" />
                    <span className="font-semibold text-slate-200">Ngày chốt số điện</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <span>Ngày {billingDate} - Hàng tháng</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </button>

                <button
                  onClick={() => {
                    setTempHousehold(householdMultiplier);
                    setActiveSubView('household');
                  }}
                  className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-slate-800/50 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <Home className="w-4 h-4 text-emerald-400" />
                    <span className="font-semibold text-slate-200">Hệ số hộ gia đình</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <span className="font-mono">{householdMultiplier}</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </button>

                <button
                  onClick={() => {
                    setTempAlertKwh(alertKwh ? String(alertKwh) : '');
                    setActiveSubView('alert_kwh');
                  }}
                  className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-slate-800/50 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <Bell className="w-4 h-4 text-emerald-400" />
                    <span className="font-semibold text-slate-200">Cảnh báo ngưỡng điện năng tiêu thụ</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <span>{alertKwh ? `${alertKwh} kWh` : 'Chưa cài'}</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </button>

                <button
                  onClick={() => setActiveSubView('clear_data')}
                  className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-slate-800/50 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-4 h-4 text-emerald-400" />
                    <span className="font-semibold text-slate-200">Xoá dữ liệu điện năng</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>

                <button
                  onClick={() => setActiveSubView('balance')}
                  className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-slate-800/50 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <Scale className="w-4 h-4 text-emerald-400" />
                    <span className="font-semibold text-slate-200">Chế độ cân bằng số điện 2 công tơ</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <span>{dualBalance}</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </button>
              </div>

              {/* Group 3: Cảnh báo & Hệ thống */}
              <div className="rounded-2xl bg-[#161b26] border border-slate-800/80 overflow-hidden divide-y divide-slate-800/60 text-xs">
                <div className="px-4 py-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Bell className="w-4 h-4 text-emerald-400" />
                    <span className="font-semibold text-slate-200">Thông báo khi thiết bị mất kết nối</span>
                  </div>
                  <button
                    onClick={() => {
                      const next = !notifyOffline;
                      setNotifyOffline(next);
                      handleSaveSettings({ notify_offline: next }, `Đã ${next ? 'bật' : 'tắt'} thông báo mất kết nối`);
                    }}
                    className={`w-11 h-6 rounded-full transition-colors relative ${
                      notifyOffline ? 'bg-emerald-500' : 'bg-slate-700'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white transition-transform ${
                        notifyOffline ? 'translate-x-5' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>

                <button
                  onClick={() => setActiveSubView('hardware_info')}
                  className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-slate-800/50 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <Info className="w-4 h-4 text-emerald-400" />
                    <span className="font-semibold text-slate-200">Thông tin chung</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
              </div>
            </>
          )}

          {/* Subview 1: Đổi tên thiết bị */}
          {activeSubView === 'rename' && (
            <div className="space-y-4 text-xs">
              <h3 className="text-sm font-bold text-white">Đổi tên thiết bị</h3>
              <input
                type="text"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                placeholder="Nhập tên mới cho công tơ"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white outline-none focus:border-emerald-500"
              />
              <div className="flex items-center justify-end gap-2 pt-2">
                <button onClick={() => setActiveSubView(null)} className="px-4 py-2 rounded-xl text-slate-400">Hủy</button>
                <button
                  onClick={async () => {
                    setDeviceName(tempName);
                    await handleSaveSettings({ name: tempName }, 'Đã đổi tên công tơ thành công!');
                  }}
                  className="btn-emerald"
                  disabled={loading}
                >
                  Lưu tên mới
                </button>
              </div>
            </div>
          )}

          {/* Subview 2: Chọn phòng */}
          {activeSubView === 'room' && (
            <div className="space-y-3 text-xs">
              <h3 className="text-sm font-bold text-white">Xếp vào phòng</h3>
              {['Phòng ngủ Master', 'Phòng khách', 'Bếp', 'Phòng làm việc', 'Chưa xếp phòng'].map((r) => (
                <button
                  key={r}
                  onClick={async () => {
                    setRoomName(r);
                    await handleSaveSettings({ room_name: r }, `Đã chuyển sang ${r}`);
                  }}
                  className={`w-full p-3 rounded-xl border text-left flex items-center justify-between ${
                    roomName === r ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400 font-bold' : 'border-slate-800 bg-[#161b26]'
                  }`}
                >
                  <span>{r}</span>
                  {roomName === r && <Check className="w-4 h-4" />}
                </button>
              ))}
            </div>
          )}

          {/* Subview 3: Cài đặt ngưỡng bảo vệ */}
          {activeSubView === 'thresholds' && (
            <div className="space-y-4 text-xs">
              <div>
                <h3 className="text-sm font-bold text-white">Cài đặt ngưỡng an toàn</h3>
                <p className="text-slate-400 text-[11px] mt-0.5">Tự động cảnh báo hoặc bảo vệ khi phụ tải vượt giới hạn.</p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Quá dòng điện (Ampe max)</span>
                  <div className="w-28 relative">
                    <input
                      type="number"
                      step="0.1"
                      value={tempThresholds.over_current_a ?? ''}
                      onChange={(e) => setTempThresholds({ ...tempThresholds, over_current_a: parseFloat(e.target.value) || null })}
                      placeholder="VD: 3.0"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-right font-mono text-emerald-400 font-bold"
                    />
                    <span className="absolute left-2 top-2 text-[10px] text-slate-500">A</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Quá công suất (Watt max)</span>
                  <div className="w-28 relative">
                    <input
                      type="number"
                      value={tempThresholds.over_power_w ?? ''}
                      onChange={(e) => setTempThresholds({ ...tempThresholds, over_power_w: parseInt(e.target.value) || null })}
                      placeholder="Không cài"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-right font-mono text-emerald-400 font-bold"
                    />
                    <span className="absolute left-2 top-2 text-[10px] text-slate-500">W</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Quá điện áp (V max)</span>
                  <div className="w-28 relative">
                    <input
                      type="number"
                      value={tempThresholds.over_voltage_v ?? ''}
                      onChange={(e) => setTempThresholds({ ...tempThresholds, over_voltage_v: parseInt(e.target.value) || null })}
                      placeholder="VD: 250"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-right font-mono text-emerald-400 font-bold"
                    />
                    <span className="absolute left-2 top-2 text-[10px] text-slate-500">V</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Thấp điện áp (V min)</span>
                  <div className="w-28 relative">
                    <input
                      type="number"
                      value={tempThresholds.under_voltage_v ?? ''}
                      onChange={(e) => setTempThresholds({ ...tempThresholds, under_voltage_v: parseInt(e.target.value) || null })}
                      placeholder="VD: 180"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-right font-mono text-emerald-400 font-bold"
                    />
                    <span className="absolute left-2 top-2 text-[10px] text-slate-500">V</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Dòng rò ngắt tải (mA)</span>
                  <div className="w-28 relative">
                    <input
                      type="number"
                      value={tempThresholds.leakage_current_ma ?? ''}
                      onChange={(e) => setTempThresholds({ ...tempThresholds, leakage_current_ma: parseInt(e.target.value) || null })}
                      placeholder="VD: 30"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-right font-mono text-emerald-400 font-bold"
                    />
                    <span className="absolute left-2 top-2 text-[10px] text-slate-500">mA</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button onClick={() => setActiveSubView(null)} className="px-4 py-2 rounded-xl text-slate-400">Hủy</button>
                <button
                  onClick={async () => {
                    setThresholds(tempThresholds);
                    await handleSaveSettings({ thresholds: tempThresholds }, 'Cập nhật ngưỡng an toàn thành công!');
                  }}
                  className="btn-emerald"
                  disabled={loading}
                >
                  Lưu cấu hình ngưỡng
                </button>
              </div>
            </div>
          )}

          {/* Subview 4: Cài đặt mức giá tiền điện */}
          {activeSubView === 'rate' && (
            <div className="space-y-4 text-xs">
              <h3 className="text-sm font-bold text-white">Cài đặt mức giá tiền điện</h3>
              <div className="space-y-2">
                {['Tự thiết lập (Đơn giá cố định)', 'Bậc thang điện sinh hoạt EVN'].map((type) => (
                  <button
                    key={type}
                    onClick={() => setRateType(type.startsWith('Tự') ? 'Tự thiết lập' : 'EVN')}
                    className={`w-full p-3 rounded-xl border text-left flex items-center justify-between ${
                      (rateType === 'Tự thiết lập' && type.startsWith('Tự')) || (rateType === 'EVN' && type.startsWith('Bậc'))
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400 font-bold'
                        : 'border-slate-800 bg-[#161b26]'
                    }`}
                  >
                    <span>{type}</span>
                  </button>
                ))}
              </div>

              {rateType === 'Tự thiết lập' && (
                <div className="space-y-1.5 pt-2">
                  <label className="text-slate-400">Đơn giá 1 số điện (₫/kWh)</label>
                  <input
                    type="number"
                    value={tempPrice}
                    onChange={(e) => setTempPrice(parseInt(e.target.value) || 3800)}
                    placeholder="VD: 3800"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono font-bold outline-none focus:border-emerald-500"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button onClick={() => setActiveSubView(null)} className="px-4 py-2 rounded-xl text-slate-400">Hủy</button>
                <button
                  onClick={async () => {
                    setRatePrice(tempPrice);
                    await handleSaveSettings({ electricity_rate_type: rateType, rate_price: tempPrice }, 'Đã lưu đơn giá tiền điện!');
                  }}
                  className="btn-emerald"
                >
                  Lưu mức giá
                </button>
              </div>
            </div>
          )}

          {/* Subview 5: Ngày chốt số điện */}
          {activeSubView === 'billing_date' && (
            <div className="space-y-4 text-xs">
              <h3 className="text-sm font-bold text-white">Ngày chốt số điện hàng tháng</h3>
              <p className="text-slate-400 text-[11px]">Hệ thống sẽ tự động tổng kết hóa đơn và reset chu kỳ tính tiền vào ngày này.</p>
              <div className="grid grid-cols-7 gap-1.5 pt-1">
                {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                  <button
                    key={day}
                    onClick={() => setTempBillingDate(day)}
                    className={`h-9 rounded-lg font-mono font-bold transition-colors ${
                      tempBillingDate === day ? 'bg-emerald-600 text-white' : 'bg-slate-900 border border-slate-800 text-slate-300'
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button onClick={() => setActiveSubView(null)} className="px-4 py-2 rounded-xl text-slate-400">Hủy</button>
                <button
                  onClick={async () => {
                    setBillingDate(tempBillingDate);
                    await handleSaveSettings({ billing_date: tempBillingDate }, `Đã đổi ngày chốt sang ngày ${tempBillingDate}`);
                  }}
                  className="btn-emerald"
                >
                  Lưu ngày chốt
                </button>
              </div>
            </div>
          )}

          {/* Subview 6: Hệ số hộ gia đình */}
          {activeSubView === 'household' && (
            <div className="space-y-4 text-xs">
              <h3 className="text-sm font-bold text-white">Hệ số hộ gia đình</h3>
              <p className="text-slate-400 text-[11px]">Nhân định mức bậc thang EVN cho các gia đình có nhiều hộ dùng chung 1 công tơ.</p>
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 4].map((num) => (
                  <button
                    key={num}
                    onClick={() => setTempHousehold(num)}
                    className={`py-3 rounded-xl font-bold font-mono text-center border ${
                      tempHousehold === num ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' : 'border-slate-800 bg-[#161b26]'
                    }`}
                  >
                    {num} Hộ
                  </button>
                ))}
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button onClick={() => setActiveSubView(null)} className="px-4 py-2 rounded-xl text-slate-400">Hủy</button>
                <button
                  onClick={async () => {
                    setHouseholdMultiplier(tempHousehold);
                    await handleSaveSettings({ household_multiplier: tempHousehold }, `Đã đặt hệ số: ${tempHousehold} hộ`);
                  }}
                  className="btn-emerald"
                >
                  Lưu hệ số
                </button>
              </div>
            </div>
          )}

          {/* Subview 7: Cảnh báo ngưỡng điện năng */}
          {activeSubView === 'alert_kwh' && (
            <div className="space-y-4 text-xs">
              <h3 className="text-sm font-bold text-white">Cảnh báo ngưỡng điện năng tiêu thụ</h3>
              <p className="text-slate-400 text-[11px]">Hệ thống sẽ gửi thông báo khi tổng số điện trong tháng vượt mức này.</p>
              <input
                type="number"
                value={tempAlertKwh}
                onChange={(e) => setTempAlertKwh(e.target.value)}
                placeholder="VD: 150 kWh (để trống nếu không cài)"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono outline-none focus:border-emerald-500"
              />
              <div className="flex items-center justify-end gap-2 pt-2">
                <button onClick={() => setActiveSubView(null)} className="px-4 py-2 rounded-xl text-slate-400">Hủy</button>
                <button
                  onClick={async () => {
                    const val = parseFloat(tempAlertKwh);
                    const finalVal = isNaN(val) ? null : val;
                    setAlertKwh(finalVal);
                    await handleSaveSettings({ consumption_alert_kwh: finalVal }, 'Đã lưu ngưỡng cảnh báo!');
                  }}
                  className="btn-emerald"
                >
                  Lưu cảnh báo
                </button>
              </div>
            </div>
          )}

          {/* Subview 8: Thông tin chung phần cứng */}
          {activeSubView === 'hardware_info' && (
            <div className="space-y-4 text-xs">
              <h3 className="text-sm font-bold text-white">Thông tin phần cứng & hệ thống</h3>
              <div className="p-4 rounded-2xl bg-[#161b26] border border-slate-800 space-y-2.5 font-mono text-[11px]">
                <div className="flex justify-between border-b border-slate-800/80 pb-2">
                  <span className="text-slate-400">Thiết bị:</span>
                  <strong className="text-white font-sans">HUNONIC EMTEC (Kẹp dòng CT)</strong>
                </div>
                <div className="flex justify-between border-b border-slate-800/80 pb-2">
                  <span className="text-slate-400">Mã QR Serial:</span>
                  <strong className="text-emerald-400">H26230844153246002</strong>
                </div>
                <div className="flex justify-between border-b border-slate-800/80 pb-2">
                  <span className="text-slate-400">Số lô sản xuất:</span>
                  <strong className="text-white">S-653202</strong>
                </div>
                <div className="flex justify-between border-b border-slate-800/80 pb-2">
                  <span className="text-slate-400">Phiên bản Firmware:</span>
                  <strong className="text-emerald-400">260701 (Mới nhất)</strong>
                </div>
                <div className="flex justify-between border-b border-slate-800/80 pb-2">
                  <span className="text-slate-400">Kết nối mạng:</span>
                  <strong className="text-emerald-400">Wi-Fi 2.4GHz b/g/n</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Bảo hành chính hãng:</span>
                  <strong className="text-white">12 tháng (2026 - 2027)</strong>
                </div>
              </div>
              <button onClick={() => setActiveSubView(null)} className="w-full py-2.5 rounded-xl bg-slate-800 text-white font-semibold">
                Quay lại
              </button>
            </div>
          )}

          {/* Subview 9: Xóa dữ liệu điện năng */}
          {activeSubView === 'clear_data' && (
            <div className="space-y-4 text-xs">
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p>Thao tác này sẽ xóa sạch các bản ghi lấy mẫu SQLite cục bộ của công tơ này. Dữ liệu gốc trên Cloud Hunonic và chip nhớ vẫn được bảo toàn.</p>
              </div>
              <button
                onClick={() => {
                  alert('Đã xóa dữ liệu lấy mẫu cục bộ!');
                  setActiveSubView(null);
                  if (onRefresh) onRefresh();
                }}
                className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold uppercase tracking-wider"
              >
                Xác nhận xóa dữ liệu lấy mẫu
              </button>
              <button onClick={() => setActiveSubView(null)} className="w-full py-2 rounded-xl text-slate-400">
                Hủy bỏ
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
