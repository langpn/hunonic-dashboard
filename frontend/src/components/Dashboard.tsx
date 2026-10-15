import { useState, useEffect } from 'react';
import { 
  ChevronLeft, ChevronRight, Settings, Calendar as CalendarIcon, 
  BarChart2, Zap, LogOut, RefreshCw, Sun, Moon, Wind, Loader2,
  Activity, Cpu, Plus, ChevronDown, Layers, Sliders, X
} from 'lucide-react';
import { ModernCalendar } from './ModernCalendar';
import { DailyChart } from './DailyChart';
import { HourlyChart } from './HourlyChart';
import { YearlyChart } from './YearlyChart';
import { CustomRangeView } from './CustomRangeView';
import { AddDeviceModal } from './AddDeviceModal';
import { LoadSettingModal } from './LoadSettingModal';
import { DayDetailModal } from './DayDetailModal';
import { DeviceSettingsModal } from './DeviceSettingsModal';
import type { SummaryData } from '../App';

interface DashboardProps {
  summary: SummaryData;
  onRefresh: () => void;
  onLogout: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
  userPhone?: string;
  token?: string | null;
}

type PeriodTab = 'day' | 'month' | 'year' | 'custom';
type BottomViewMode = 'calendar' | 'chart';

export function Dashboard({
  summary,
  onRefresh,
  onLogout,
  isDark,
  onToggleTheme,
  userPhone,
  token,
}: DashboardProps) {
  const [periodTab, setPeriodTab] = useState<PeriodTab>('month');
  const [viewMode, setViewMode] = useState<BottomViewMode>('calendar');
  const [showSettings, setShowSettings] = useState(false);
  const [showDeviceDropdown, setShowDeviceDropdown] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [showDeviceSettingsModal, setShowDeviceSettingsModal] = useState(false);
  const [selectedDayDetail, setSelectedDayDetail] = useState<{ dateStr: string; kwh: number } | null>(null);
  const [dismissDriftNotice, setDismissDriftNotice] = useState(false);

  // Dynamic Device Management
  const electricMeters = summary?.electricMeters || [];
  const [activeDeviceId, setActiveDeviceId] = useState<string>(() => {
    return (summary as any)?.active_device_id || (electricMeters[0]?.id ? String(electricMeters[0].id) : '');
  });

  // Dynamic Max Load Amperage (default 5.7A for Mitsubishi Heavy 13YZP)
  const [deviceMaxA, setDeviceMaxA] = useState<number>(() => {
    const saved = localStorage.getItem(`device_load_max_${activeDeviceId}`);
    return saved ? parseFloat(saved) : 5.7;
  });

  useEffect(() => {
    if (activeDeviceId) {
      const saved = localStorage.getItem(`device_load_max_${activeDeviceId}`);
      setDeviceMaxA(saved ? parseFloat(saved) : 5.7);
    }
  }, [activeDeviceId]);

  const activeMeter = electricMeters.find((m: any) => String(m.id) === String(activeDeviceId)) || electricMeters[0];
  const meter = activeMeter;

  // Month navigation state
  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear());
  const [currentMonthNum, setCurrentMonthNum] = useState(() => new Date().getMonth() + 1);

  // Dynamic month data state
  const [activeMonthData, setActiveMonthData] = useState<any>(summary?.currentMonth || null);
  const [loadingMonth, setLoadingMonth] = useState(false);

  // Selected date state for day-detail view
  const todayStr = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  const home = summary?.home || { id: '966357', name: 'Nhà của Lang', timezone: 'GMT+07:00' };
  const today = summary?.today || { date: todayStr, kwh: 0, power_current_w: 0, cost_estimated: 0, hourly: [] };
  const electricityRate = summary?.electricityRate;
  const ratePrice = electricityRate?.price ? parseInt(electricityRate.price) : 3800;

  // Sync initial month data & real-time telemetry when summary loads
  useEffect(() => {
    if (summary?.currentMonth) {
      setActiveMonthData(summary.currentMonth);
    }
    if ((summary as any)?.active_device_id) {
      setActiveDeviceId(String((summary as any).active_device_id));
    }
    if (summary?.today?.power_current_w !== undefined) {
      const pw = summary.today.power_current_w;
      const amp = pw <= 48 ? 0.1 : parseFloat((pw / (230.0 * 0.95)).toFixed(2));
      setLiveTelemetry((prev) => ({
        ...prev,
        powerW: pw,
        currentA: amp,
      }));
    }
  }, [summary]);

  // Live Real-Time Telemetry State (Fluctuates dynamically matching physical Hunonic EMTEC LCD)
  const [liveTelemetry, setLiveTelemetry] = useState({
    powerW: today.power_current_w || meter?.power_current || 22,
    voltageV: 230.0,
    currentA: (today.power_current_w || meter?.power_current || 22) > 0 ? 0.1 : 0.0,
    leakageMa: 0,
    isOnline: true,
    lastUpdateMs: Date.now(),
  });

  // Auto-poll live power every 3.5 seconds for the active device
  useEffect(() => {
    let mounted = true;
    const fetchLive = async () => {
      try {
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const url = activeDeviceId ? `/api/device/realtime?device_id=${encodeURIComponent(activeDeviceId)}` : '/api/device/realtime';
        const res = await fetch(url, { headers });
        const json = await res.json();
        if (mounted && json.success && json.data) {
          setLiveTelemetry({
            powerW: json.data.power_w,
            voltageV: json.data.voltage_v || 230.0,
            currentA: json.data.current_a !== undefined ? json.data.current_a : 0.1,
            leakageMa: json.data.leakage_ma || 0,
            isOnline: json.data.is_online,
            lastUpdateMs: Date.now(),
          });
        }
      } catch {
        // Non-blocking silent retry
      }
    };

    const interval = setInterval(fetchLive, 3500);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [token, activeDeviceId]);

  // Dynamic Month Fetching
  const fetchMonthData = async (y: number, m: number, devId?: string) => {
    setLoadingMonth(true);
    try {
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const targetId = devId || activeDeviceId;
      const url = targetId
        ? `/api/dashboard/summary?year=${y}&month=${m}&device_id=${encodeURIComponent(targetId)}&refresh=true`
        : `/api/dashboard/summary?year=${y}&month=${m}&refresh=true`;

      const res = await fetch(url, { headers });
      const json = await res.json();
      if (json.success && json.data) {
        if (json.data.currentMonth) {
          setActiveMonthData(json.data.currentMonth);
        }
      }
    } catch (e) {
      console.warn(`Failed to fetch data for ${m}/${y}:`, e);
    } finally {
      setLoadingMonth(false);
    }
  };

  const handleSwitchDevice = (newId: string) => {
    setActiveDeviceId(newId);
    setShowDeviceDropdown(false);
    fetchMonthData(currentYear, currentMonthNum, newId);
  };

  const handlePrevMonth = () => {
    let nextYear = currentYear;
    let nextMonth = currentMonthNum - 1;
    if (nextMonth === 0) {
      nextMonth = 12;
      nextYear -= 1;
    }
    setCurrentMonthNum(nextMonth);
    setCurrentYear(nextYear);
    fetchMonthData(nextYear, nextMonth);
  };

  const handleNextMonth = () => {
    let nextYear = currentYear;
    let nextMonth = currentMonthNum + 1;
    if (nextMonth > 12) {
      nextMonth = 1;
      nextYear += 1;
    }
    setCurrentMonthNum(nextMonth);
    setCurrentYear(nextYear);
    fetchMonthData(nextYear, nextMonth);
  };

  // Metrics from API
  const totalKwh = activeMonthData?.total_power ?? meter?.power_of_month ?? 36.27;
  const totalPrice = activeMonthData?.total_price ?? meter?.money_of_month ?? Math.round(totalKwh * ratePrice);
  const firstPower = activeMonthData?.first_power ?? 324.6;
  const lastPower = activeMonthData?.last_power ?? (firstPower + totalKwh);

  const powerW = liveTelemetry.powerW;
  const voltageV = liveTelemetry.voltageV;
  const currentA = liveTelemetry.currentA;
  const leakageMa = liveTelemetry.leakageMa;

  // AC Compressor Operating Intelligence - Calibrated for Mitsubishi Heavy 13YZP (0.1A -> 6.5A)
  let acState = {
    title: 'Chế độ chờ (Standby)',
    sub: 'Dòng tải ~0.1A • Nuôi bo mạch vi điều khiển',
    badgeClass: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
    dotClass: 'bg-slate-400',
  };

  if (currentA >= 4.0 || powerW >= 900) {
    acState = {
      title: 'Làm lạnh cực đại (Hi Power / Turbo)',
      sub: `Dòng tải ${currentA.toFixed(1)}A • Máy nén Inverter chạy hết công suất đỉnh`,
      badgeClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30',
      dotClass: 'bg-rose-500 animate-ping',
    };
  } else if (currentA >= 2.5 || powerW >= 550) {
    acState = {
      title: 'Làm lạnh công suất cao',
      sub: `Dòng tải ${currentA.toFixed(1)}A • Kéo nhiệt độ phòng nhanh`,
      badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
      dotClass: 'bg-amber-500 animate-pulse',
    };
  } else if (currentA >= 0.7 || powerW >= 150) {
    acState = {
      title: 'Duy trì nhiệt độ (ECO)',
      sub: `Dòng tải ${currentA.toFixed(1)}A • Biến tần hạ tải tiết kiệm điện`,
      badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
      dotClass: 'bg-emerald-500 animate-pulse',
    };
  } else if (currentA >= 0.2 || powerW >= 30) {
    acState = {
      title: 'Quạt gió tuần hoàn',
      sub: 'Phòng đã đủ nhiệt độ • Máy nén ngắt tạm thời',
      badgeClass: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30',
      dotClass: 'bg-sky-500',
    };
  }

  return (
    <div className="min-h-screen flex flex-col transition-colors duration-200">
      {/* Top Precision Header Bar */}
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-[#12161f]/80 backdrop-blur-xl border-b border-black/5 dark:border-white/5 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20 gap-3">
            {/* Brand & Device Title with Dynamic Selector */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 flex-shrink-0">
                <Wind className="w-5 h-5" />
              </div>

              {/* Dynamic Device Switcher Dropdown */}
              <div className="relative min-w-0">
                <button
                  onClick={() => setShowDeviceDropdown((v) => !v)}
                  className="flex items-center gap-2 text-left group hover:opacity-90 transition-opacity"
                  title="Bấm để đổi công tơ điện"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h1 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight truncate">
                        {meter?.name || 'Mitsubishi Heavy 13YZP'}
                      </h1>
                      <span className="hidden sm:inline-block px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                        {meter?.root_type === 'ekmeter' ? 'EKMeter CT' : meter?.root_type?.toUpperCase() || 'METER'}
                      </span>
                      {electricMeters.length > 1 && (
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-white transition-colors" />
                      )}
                    </div>
                    <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 truncate">
                      {home.name} • {meter?.room_name || 'Phòng ngủ Master'}
                    </p>
                  </div>
                </button>

                {/* Device Switcher Popup */}
                {showDeviceDropdown && electricMeters.length > 1 && (
                  <div className="absolute left-0 mt-2 w-72 rounded-2xl bg-white dark:bg-[#1a202c] border border-slate-200 dark:border-white/10 shadow-2xl p-2 z-50 space-y-1 text-xs">
                    <div className="px-3 py-1.5 text-slate-400 font-semibold text-[10px] uppercase border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
                      <span>Chọn công tơ ({electricMeters.length})</span>
                      <Layers className="w-3.5 h-3.5" />
                    </div>
                    <div className="max-h-60 overflow-y-auto space-y-1 pt-1">
                      {electricMeters.map((m: any) => {
                        const isCurrent = String(m.id) === String(activeDeviceId);
                        return (
                          <button
                            key={m.id}
                            onClick={() => handleSwitchDevice(String(m.id))}
                            className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-colors ${
                              isCurrent
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold'
                                : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            <div className="min-w-0 pr-2">
                              <p className="truncate text-xs">{m.name}</p>
                              <p className="text-[10px] text-slate-400 font-normal">{m.room_name || 'Chưa xếp phòng'}</p>
                            </div>
                            <span className="font-mono text-[11px] flex-shrink-0">
                              {m.power_of_month ? `${parseFloat(m.power_of_month).toFixed(1)} kWh` : ''}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions Header */}
            <div className="flex items-center gap-1.5 sm:gap-2.5 flex-shrink-0">
              {/* Add Device Button */}
              <button
                onClick={() => setShowAddModal(true)}
                className="btn-precision text-emerald-600 dark:text-emerald-400 font-semibold"
                title="Thêm công tơ mới không cần app"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Thêm công tơ</span>
              </button>

              {/* Live Ticker Indicator */}
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-[#1a202c] text-xs font-medium border border-black/5 dark:border-white/5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-slate-700 dark:text-slate-300 font-mono text-[11px]">Đo thời gian thực</span>
              </div>

              <button
                onClick={onToggleTheme}
                className="btn-precision"
                title={isDark ? 'Giao diện Sáng' : 'Giao diện Tối'}
              >
                {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
                <span className="hidden lg:inline">{isDark ? 'Sáng' : 'Tối'}</span>
              </button>

              <button
                onClick={onRefresh}
                className="btn-precision"
                title="Làm mới dữ liệu từ công tơ"
              >
                <RefreshCw className="w-4 h-4 text-emerald-500" />
                <span className="hidden lg:inline">Làm mới</span>
              </button>

              {/* Settings Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowSettings((v) => !v)}
                  className="btn-precision p-2 sm:px-3"
                  title="Cài đặt tài khoản"
                >
                  <Settings className="w-4 h-4" />
                </button>

                {showSettings && (
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-[#1a202c] border border-slate-200 dark:border-white/10 shadow-2xl p-3 z-50 space-y-2 text-xs">
                    <div className="px-2 py-1 text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-2">
                      <p className="font-semibold text-slate-800 dark:text-white">{home.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{userPhone || 'Tài khoản Hunonic'}</p>
                    </div>

                    <button
                      onClick={() => {
                        setShowSettings(false);
                        setShowDeviceSettingsModal(true);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold transition-colors"
                    >
                      <Sliders className="w-4 h-4 text-emerald-500" />
                      <span>Cài đặt & Chi tiết công tơ</span>
                    </button>

                    <button
                      onClick={() => {
                        setShowSettings(false);
                        onLogout();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 dark:text-rose-400 font-semibold transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Đăng xuất</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Studio Viewport */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex-1 w-full space-y-6">
        {/* Auto-Reconciliation & Drift Notice Banner */}
        {(summary as any)?.drift_status?.detected && !dismissDriftNotice && (
          <div className="p-3.5 sm:p-4 rounded-2xl bg-emerald-500/10 dark:bg-emerald-950/30 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 flex items-center justify-between gap-3 text-xs shadow-sm animate-in fade-in duration-200">
            <div className="flex items-center gap-2.5 min-w-0">
              <Zap className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
              <p className="leading-relaxed">
                <strong>Tự động hiệu chuẩn:</strong> Phát hiện sai lệch <strong className="font-mono text-emerald-700 dark:text-emerald-300">{(summary as any).drift_status.diff_kwh} kWh</strong> giữa bộ nhớ cục bộ và Cloud Hunonic. Hệ thống đã tự động đối soát và cập nhật lại chuẩn xác 100%!
              </p>
            </div>
            <button
              onClick={() => setDismissDriftNotice(true)}
              className="p-1 rounded-lg text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20 transition-colors flex-shrink-0"
              title="Đóng thông báo"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ================================================================== */}
        {/* HERO REALTIME TELEMETRY STAGE (AC Command Deck) */}
        {/* ================================================================== */}
        <div className="panel-card p-6 sm:p-8 relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Live Power & State Display (col 7) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold border flex items-center gap-2 ${acState.badgeClass}`}>
                  <span className={`w-2 h-2 rounded-full ${acState.dotClass}`} />
                  {acState.title}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:inline">
                  {acState.sub}
                </span>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wider font-semibold text-slate-400 dark:text-slate-500">
                  Công suất máy lạnh thời gian thực
                </p>
                <div className="flex items-baseline gap-3 mt-1">
                  <span className="text-5xl sm:text-6xl font-black font-mono tracking-tight text-slate-900 dark:text-white">
                    {powerW}
                  </span>
                  <span className="text-2xl sm:text-3xl font-medium text-slate-400 dark:text-slate-500">
                    Watt
                  </span>
                </div>
              </div>

              {/* Instant Electrical Parameters */}
              <div className="grid grid-cols-3 gap-3 pt-2 text-xs">
                <div 
                  onClick={async () => {
                    const input = window.prompt('Hiệu chuẩn điện áp lưới cơ sở (Volt) theo đồng hồ thực tế:', String(Math.round(voltageV)));
                    if (input) {
                      const val = parseFloat(input);
                      if (!isNaN(val) && val >= 100 && val <= 300) {
                        try {
                          await fetch('/api/device/voltage-config', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ device_id: activeDeviceId, base_voltage_v: val }),
                          });
                          setLiveTelemetry((prev) => ({ ...prev, voltageV: val }));
                        } catch {}
                      }
                    }
                  }}
                  className="panel-subtle p-3 text-center cursor-pointer hover:border-emerald-500/40 transition-all group"
                  title="Bấm để hiệu chuẩn nhanh điện áp lưới theo đồng hồ (VD: 230V)"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-[10px] uppercase font-semibold block">Điện áp</span>
                    <span className="text-[9px] font-mono font-bold text-slate-400 group-hover:text-emerald-500 transition-colors">
                      Hiệu chuẩn
                    </span>
                  </div>
                  <strong className="text-sm sm:text-base font-bold font-mono text-slate-800 dark:text-slate-100 mt-0.5 block">
                    {voltageV} <span className="text-xs font-normal text-slate-400">V</span>
                  </strong>
                </div>

                <div 
                  onClick={() => setShowLoadModal(true)}
                  className="panel-subtle p-3 text-center relative overflow-hidden group cursor-pointer hover:border-emerald-500/40 transition-all"
                  title="Bấm để cài đặt định mức Ampe của thiết bị"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-[10px] uppercase font-semibold block">Dòng điện</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] font-mono font-bold text-slate-400">
                        {Math.min(100, Math.round((currentA / deviceMaxA) * 100))}% tải
                      </span>
                      <button
                        type="button"
                        className="p-1 rounded text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors"
                      >
                        <Sliders className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <strong className="text-sm sm:text-base font-bold font-mono text-slate-800 dark:text-slate-100 mt-0.5 block">
                    {currentA} <span className="text-xs font-normal text-slate-400">A</span>
                    <span className="text-[10px] font-normal font-mono text-slate-400 ml-1.5 opacity-80">
                      / {deviceMaxA}A max
                    </span>
                  </strong>
                  {/* Dynamic load bar calibrated by deviceMaxA (Default: 5.7A for Mitsu 13YZP) */}
                  <div className="w-full bg-slate-200 dark:bg-slate-700/50 h-1 rounded-full mt-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        currentA / deviceMaxA >= 0.70
                          ? 'bg-rose-500 shadow-sm shadow-rose-500/20'
                          : currentA / deviceMaxA >= 0.40
                          ? 'bg-amber-500'
                          : currentA / deviceMaxA >= 0.15
                          ? 'bg-emerald-500'
                          : 'bg-slate-400'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(3, Math.round((currentA / deviceMaxA) * 100)))}%` }}
                    />
                  </div>
                </div>

                <div className="panel-subtle p-3 text-center">
                  <span className="text-slate-400 text-[10px] uppercase font-semibold block">Dòng rò</span>
                  <strong className="text-sm sm:text-base font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                    {leakageMa} <span className="text-xs font-normal text-slate-400">mA</span>
                  </strong>
                </div>
              </div>
            </div>

            {/* Quick Today & Month Total Card (col 5) */}
            <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
              {/* Today Card */}
              <div className="panel-subtle p-5 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold">Hôm nay</span>
                  <div className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-700 dark:text-emerald-400 mt-1">
                    {today.kwh.toFixed(2)} <span className="text-base font-medium">kWh</span>
                  </div>
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 mt-0.5 block">
                    Ước tính: {today.cost_estimated.toLocaleString('vi-VN')} ₫
                  </span>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <Zap className="w-6 h-6" />
                </div>
              </div>

              {/* Month Card */}
              <div className="panel-subtle p-5 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold">
                    Tháng {currentMonthNum}/{currentYear}
                  </span>
                  <div className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 dark:text-white mt-1">
                    {totalKwh.toFixed(2)} <span className="text-base font-medium text-slate-400">kWh</span>
                  </div>
                  <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 mt-0.5 block">
                    {totalPrice.toLocaleString('vi-VN')} ₫ (@{ratePrice.toLocaleString('vi-VN')}đ)
                  </span>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300">
                  <Activity className="w-6 h-6" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ================================================================== */}
        {/* PRECISION PERIOD TABS (Segmented Control) */}
        {/* ================================================================== */}
        <div className="panel-card p-2 sm:p-2.5">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* 4 Tabs */}
            <div className="grid grid-cols-4 sm:flex gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-[#1a202c]">
              {[
                { id: 'day', label: 'Theo ngày' },
                { id: 'month', label: 'Theo tháng' },
                { id: 'year', label: 'Theo năm' },
                { id: 'custom', label: 'Tuỳ chỉnh' },
              ].map((tab) => {
                const isActive = periodTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setPeriodTab(tab.id as PeriodTab)}
                    className={isActive ? 'tab-pill-active' : 'tab-pill'}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Dynamic Month Navigator when on 'month' tab */}
            {periodTab === 'month' && (
              <div className="flex items-center justify-center sm:justify-end gap-3 px-2">
                <button
                  onClick={handlePrevMonth}
                  disabled={loadingMonth}
                  className="btn-precision p-2"
                  title="Tháng trước"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-white font-mono">
                  Tháng {currentMonthNum.toString().padStart(2, '0')}/{currentYear}
                </span>
                <button
                  onClick={handleNextMonth}
                  disabled={loadingMonth}
                  className="btn-precision p-2"
                  title="Tháng sau"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ================================================================== */}
        {/* ACTIVE TAB VIEWPORT */}
        {/* ================================================================== */}
        
        {/* TAB 1: THEO THÁNG */}
        {periodTab === 'month' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column (col 4): Dual Meter Index & Energy Specs */}
            <div className="lg:col-span-4 space-y-6">
              <div className="panel-card p-6 space-y-5">
                <h3 className="text-xs uppercase tracking-wider font-bold text-slate-400">
                  Chỉ số công tơ điện tử
                </h3>

                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="panel-subtle p-3.5">
                    <span className="text-[10px] text-slate-400 font-semibold block uppercase">Chỉ số cũ</span>
                    <strong className="text-lg sm:text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1 block">
                      {firstPower.toFixed(1)}
                    </strong>
                    <span className="text-[10px] text-slate-400">kWh</span>
                  </div>

                  <div className="panel-subtle p-3.5">
                    <span className="text-[10px] text-slate-400 font-semibold block uppercase">Chỉ số mới</span>
                    <strong className="text-lg sm:text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1 block">
                      {lastPower.toFixed(2)}
                    </strong>
                    <span className="text-[10px] text-slate-400">kWh</span>
                  </div>
                </div>

                <div className="border-t border-slate-200/80 dark:border-white/5 pt-4 text-xs space-y-2 text-slate-600 dark:text-slate-400">
                  <div className="flex justify-between items-center">
                    <span>Điện năng tiêu thụ:</span>
                    <strong className="text-slate-900 dark:text-slate-100 font-mono font-bold text-sm">{totalKwh.toFixed(2)} kWh</strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Thành tiền tạm tính:</span>
                    <strong className="text-rose-600 dark:text-rose-400 font-mono font-bold text-sm">{totalPrice.toLocaleString('vi-VN')} ₫</strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Đơn giá áp dụng:</span>
                    <strong className="text-slate-800 dark:text-slate-200 font-mono font-bold">{ratePrice.toLocaleString('vi-VN')} ₫/kWh</strong>
                  </div>
                </div>
              </div>

              {/* Hardware Note Box */}
              <div className="panel-subtle p-4 text-xs space-y-1.5 text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-200">
                  <Cpu className="w-4 h-4 text-emerald-500" />
                  <span>Phần cứng Hunonic EKMeter</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Thiết bị đo kẹp dòng CT biến thiên liên tục • Dữ liệu giờ lưu trữ độc lập 60 ngày trên SQLite • Tự động dọn dẹp bảo vệ máy chủ.
                </p>
              </div>
            </div>

            {/* Right Column (col 8): Modern Calendar Grid or 30-Day Curve */}
            <div className="lg:col-span-8 panel-card p-6 space-y-5 relative overflow-hidden">
              {loadingMonth && (
                <div className="absolute inset-0 bg-white/70 dark:bg-[#12161f]/80 backdrop-blur-sm flex items-center justify-center z-20">
                  <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
                </div>
              )}

              {/* Sub-header with View Switcher */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/5">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {viewMode === 'calendar' ? 'Ma trận Lịch Tiêu Thụ' : 'Biểu đồ Tiêu Thụ 30 Ngày'}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Tháng {currentMonthNum}/{currentYear} • Bấm vào ngày để xem chi tiết 24 giờ
                  </p>
                </div>

                {/* Switcher Toggle (Calendar vs Chart) */}
                <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-[#1a202c]">
                  <button
                    onClick={() => setViewMode('calendar')}
                    className={`p-1.5 sm:px-3 sm:py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                      viewMode === 'calendar'
                        ? 'bg-white dark:bg-[#242c3d] text-slate-900 dark:text-white shadow-sm'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <CalendarIcon className="w-4 h-4" />
                    <span className="hidden sm:inline">Lịch tháng</span>
                  </button>

                  <button
                    onClick={() => setViewMode('chart')}
                    className={`p-1.5 sm:px-3 sm:py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                      viewMode === 'chart'
                        ? 'bg-white dark:bg-[#242c3d] text-slate-900 dark:text-white shadow-sm'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <BarChart2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Biểu đồ</span>
                  </button>
                </div>
              </div>

              {/* View Content */}
              {viewMode === 'calendar' ? (
                <ModernCalendar
                  year={currentYear}
                  month={currentMonthNum}
                  dailyData={activeMonthData?.daily_data || []}
                  ratePrice={ratePrice}
                  selectedDate={selectedDate}
                  onSelectDate={(dateStr, kwh) => {
                    setSelectedDate(dateStr);
                    setSelectedDayDetail({ dateStr, kwh });
                  }}
                />
              ) : (
                <DailyChart data={activeMonthData?.daily_data || []} ratePrice={ratePrice} />
              )}
            </div>
          </div>
        )}

        {/* TAB 2: THEO NGÀY (24 Giờ Chi Tiết) */}
        {periodTab === 'day' && (
          <div className="panel-card p-6">
            <HourlyChart
              initialDate={selectedDate}
              ratePrice={ratePrice}
              token={token}
            />
          </div>
        )}

        {/* TAB 3: THEO NĂM (12 Tháng Chi Tiết) */}
        {periodTab === 'year' && (
          <div className="panel-card p-6">
            <YearlyChart
              initialYear={currentYear}
              ratePrice={ratePrice}
              token={token}
            />
          </div>
        )}

        {/* TAB 4: TUỲ CHỈNH KHOẢNG NGÀY */}
        {periodTab === 'custom' && (
          <div className="panel-card p-6">
            <CustomRangeView
              ratePrice={ratePrice}
              token={token}
            />
          </div>
        )}
      </main>

      {/* Clean Studio Minimalist Footer */}
      <footer className="border-t border-black/5 dark:border-white/5 py-6 text-center text-xs text-slate-400 dark:text-slate-500">
        Mitsubishi Heavy 13YZP Telemetry Studio • Native C++ SQLite Storage • Tối ưu 60fps
      </footer>

      {/* Add Device / SoftAP Modal */}
      <AddDeviceModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        token={token}
        onDeviceAdded={onRefresh}
      />

      {/* Dynamic Load Setting Modal */}
      <LoadSettingModal
        isOpen={showLoadModal}
        onClose={() => setShowLoadModal(false)}
        deviceId={activeDeviceId}
        deviceName={meter?.name}
        currentMaxA={deviceMaxA}
        onSave={(newVal) => {
          setDeviceMaxA(newVal);
          localStorage.setItem(`device_load_max_${activeDeviceId}`, String(newVal));
        }}
      />

      {/* Slide-Up Day Detail Modal (No Tab Redirect) */}
      <DayDetailModal
        isOpen={!!selectedDayDetail}
        onClose={() => setSelectedDayDetail(null)}
        dateStr={selectedDayDetail?.dateStr || ''}
        dayKwh={selectedDayDetail?.kwh || 0}
        ratePrice={ratePrice}
        token={token}
      />

      {/* Full Device Settings Hub (Matching Mobile App 1:1) */}
      <DeviceSettingsModal
        isOpen={showDeviceSettingsModal}
        onClose={() => setShowDeviceSettingsModal(false)}
        deviceId={activeDeviceId}
        initialName={meter?.name}
        initialRoom={meter?.room_name}
        monthKwh={totalKwh}
        token={token}
        onRefresh={onRefresh}
      />
    </div>
  );
}
