import { useState } from 'react';
import { 
  Zap, Power, Lock, Unlock, Wind, Thermometer, 
  DoorClosed, Wifi, Flame, Eye, ToggleLeft, ToggleRight
} from 'lucide-react';

interface DeviceItem {
  id: string;
  name: string;
  root_type: string;
  room_name?: string;
  state?: string;
  status?: number;
}

interface DeviceMatrixProps {
  devices?: DeviceItem[];
  primaryMeterRootId?: string;
}

export function DeviceMatrix({ devices: _devices = [], primaryMeterRootId }: DeviceMatrixProps) {
  // Device states mock/interactive
  const [deviceStates, setDeviceStates] = useState<Record<string, any>>({
    switch1: { ch1: true, ch2: false, ch3: true },
    switch2: { ch1: true },
    door: { status: 'stopped', percent: 100 },
    ac: { power: true, temp: 24, mode: 'cool', fan: 'auto', swing: true },
    lock: { locked: true, battery: 92 },
    motionSensor: { active: true, detected: false },
    smokeSensor: { safe: true },
    meterRelay: { enabled: true, safeLock: false },
  });

  const [_controlling, setControlling] = useState<string | null>(null);

  const sendControl = async (deviceId: string, action: string, value: any) => {
    setControlling(deviceId);
    try {
      await fetch('/api/device/control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ device_id: deviceId, action, value }),
      });
    } catch {
      // Keep optimistic UI
    } finally {
      setTimeout(() => setControlling(null), 300);
    }
  };

  const toggleSwitch = (key: string, ch: string) => {
    const current = deviceStates[key]?.[ch] ?? false;
    const next = !current;
    setDeviceStates(prev => ({
      ...prev,
      [key]: { ...prev[key], [ch]: next }
    }));
    sendControl(key, 'toggle_channel', { channel: ch, state: next ? 1 : 2 });
  };

  return (
    <div className="space-y-8">
      {/* Category 1: Power & Breaker Control */}
      <div>
        <h3 className="text-sm uppercase tracking-wider font-semibold text-emerald-400 flex items-center gap-2 mb-4">
          <Zap className="w-4 h-4" />
          Rơ le Công tơ & Aptomat Chống Giật
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="mystic-card p-6 relative overflow-hidden">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs uppercase tracking-wider font-semibold text-emerald-400">Thiết bị đo chính</span>
                <h4 className="text-lg font-bold text-white mt-1">Bộ kiểm soát điện năng (EKMeter)</h4>
                <p className="text-xs text-slate-400 mt-0.5">Mã thiết bị: {primaryMeterRootId || 'Zml4ZWRfbm9uY2Ux:oMAE...'}</p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Trực tuyến
              </span>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-800/80 grid grid-cols-2 gap-4">
              <button
                onClick={() => {
                  const next = !deviceStates.meterRelay.enabled;
                  setDeviceStates(p => ({ ...p, meterRelay: { ...p.meterRelay, enabled: next } }));
                  sendControl('meter', 'relay_switch', next ? 1 : 2);
                }}
                className={`py-3 px-4 rounded-xl border font-semibold flex items-center justify-center gap-2 transition-all ${
                  deviceStates.meterRelay.enabled
                    ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 shadow-[0_0_15px_rgba(0,245,155,0.2)]'
                    : 'bg-slate-800/40 border-slate-700/60 text-slate-400'
                }`}
              >
                <Power className="w-4 h-4" />
                {deviceStates.meterRelay.enabled ? 'Đóng Rơ-le (BẬT)' : 'Ngắt Rơ-le (TẮT)'}
              </button>

              <button
                onClick={() => {
                  const next = !deviceStates.meterRelay.safeLock;
                  setDeviceStates(p => ({ ...p, meterRelay: { ...p.meterRelay, safeLock: next } }));
                  sendControl('meter', 'safe_lock', next ? 1 : 0);
                }}
                className={`py-3 px-4 rounded-xl border font-semibold flex items-center justify-center gap-2 transition-all ${
                  deviceStates.meterRelay.safeLock
                    ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                    : 'bg-slate-800/40 border-slate-700/60 text-slate-400'
                }`}
              >
                <Lock className="w-4 h-4" />
                {deviceStates.meterRelay.safeLock ? 'Khóa an toàn: BẬT' : 'Khóa an toàn: TẮT'}
              </button>
            </div>
          </div>

          <div className="mystic-card p-6 flex flex-col justify-between">
            <div>
              <span className="text-xs uppercase tracking-wider font-semibold text-cyan-400">Trạng thái an toàn lưới điện</span>
              <h4 className="text-lg font-bold text-white mt-1">Hệ thống bảo vệ tải tự động</h4>
              <p className="text-xs text-slate-400 mt-1">
                Tự động ngắt khi phát hiện chập cháy, quá công suất hoặc rò điện gây giật.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-slate-800/60 text-center">
              <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase">Dòng rò</span>
                <p className="text-sm font-bold text-emerald-400 mt-0.5">0.0 mA</p>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase">Điện áp</span>
                <p className="text-sm font-bold text-cyan-400 mt-0.5">226 V</p>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase">Dòng tải</span>
                <p className="text-sm font-bold text-violet-400 mt-0.5">0.22 A</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Category 2: Smart Switches */}
      <div>
        <h3 className="text-sm uppercase tracking-wider font-semibold text-cyan-400 flex items-center gap-2 mb-4">
          <Power className="w-4 h-4" />
          Hệ thống Công tắc Thông minh
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* 3-Gang Switch */}
          <div className="mystic-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-white text-base">Công tắc Phòng Khách</h4>
                <p className="text-xs text-slate-400">Loại: Hunonic Datic 3 Nút</p>
              </div>
              <Wifi className="w-4 h-4 text-emerald-400" />
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-800/60">
              {['ch1', 'ch2', 'ch3'].map((ch, idx) => {
                const isOn = deviceStates.switch1[ch];
                const names = ['Đèn chùm trung tâm', 'Đèn hắt trần thạch cao', 'Đèn ban công'];
                return (
                  <div
                    key={ch}
                    onClick={() => toggleSwitch('switch1', ch)}
                    className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all duration-200 ${
                      isOn 
                        ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 shadow-[0_0_12px_rgba(0,245,155,0.15)]'
                        : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span className="text-xs font-medium">{names[idx]}</span>
                    <button className="focus:outline-none">
                      {isOn ? <ToggleRight className="w-6 h-6 text-emerald-400" /> : <ToggleLeft className="w-6 h-6 text-slate-600" />}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 1-Gang Power Switch */}
          <div className="mystic-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-white text-base">Bình nóng lạnh</h4>
                <p className="text-xs text-slate-400">Loại: Công tắc công suất cao 30A</p>
              </div>
              <Wifi className="w-4 h-4 text-emerald-400" />
            </div>

            <div className="pt-2 border-t border-slate-800/60">
              <div
                onClick={() => toggleSwitch('switch2', 'ch1')}
                className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all duration-200 ${
                  deviceStates.switch2.ch1 
                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                    : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div>
                  <p className="text-sm font-semibold">Công tắc nguồn bình nước nóng</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{deviceStates.switch2.ch1 ? 'Đang cấp điện (2500W)' : 'Đã ngắt nguồn an toàn'}</p>
                </div>
                {deviceStates.switch2.ch1 ? <ToggleRight className="w-7 h-7 text-amber-400" /> : <ToggleLeft className="w-7 h-7 text-slate-600" />}
              </div>
            </div>
          </div>

          {/* Rolling Door Controller */}
          <div className="mystic-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-white text-base">Cửa Cuốn Mặt Tiền</h4>
                <p className="text-xs text-slate-400">Hunonic Door Box Pro</p>
              </div>
              <DoorClosed className="w-4 h-4 text-cyan-400" />
            </div>

            <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-800/60">
              <button
                onClick={() => sendControl('door', 'open', {})}
                className="p-2.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-semibold"
              >
                MỞ
              </button>
              <button
                onClick={() => sendControl('door', 'stop', {})}
                className="p-2.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs font-semibold"
              >
                DỪNG
              </button>
              <button
                onClick={() => sendControl('door', 'close', {})}
                className="p-2.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 text-xs font-semibold"
              >
                ĐÓNG
              </button>
              <button
                onClick={() => sendControl('door', 'ventilation', { percent: 20 })}
                className="p-2.5 rounded-lg bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/30 text-violet-400 text-xs font-semibold"
              >
                HÉ 20%
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Category 3: Air Conditioning & Climate */}
      <div>
        <h3 className="text-sm uppercase tracking-wider font-semibold text-violet-400 flex items-center gap-2 mb-4">
          <Wind className="w-4 h-4" />
          Điều Hòa & Trung Tâm Hồng Ngoại (IR Remote)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="mystic-card p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-white text-base">Điều hòa Phòng Ngủ Master</h4>
                <p className="text-xs text-slate-400">Daikin Inverter (IR Hub)</p>
              </div>
              <button
                onClick={() => setDeviceStates(p => ({ ...p, ac: { ...p.ac, power: !p.ac.power } }))}
                className={`p-2.5 rounded-xl border transition-all ${
                  deviceStates.ac.power 
                    ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300' 
                    : 'bg-slate-800/40 border-slate-700 text-slate-500'
                }`}
              >
                <Power className="w-5 h-5" />
              </button>
            </div>

            {/* Temperature Stepper */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
              <span className="text-sm text-slate-400 flex items-center gap-2">
                <Thermometer className="w-4 h-4 text-cyan-400" />
                Nhiệt độ cài đặt
              </span>

              <div className="flex items-center gap-4">
                <button
                  onClick={() => setDeviceStates(p => ({ ...p, ac: { ...p.ac, temp: Math.max(16, p.ac.temp - 1) } }))}
                  className="w-8 h-8 rounded-lg bg-slate-800 text-white font-bold hover:bg-slate-700 flex items-center justify-center"
                >
                  -
                </button>
                <span className="text-2xl font-extrabold text-cyan-300">{deviceStates.ac.temp}°C</span>
                <button
                  onClick={() => setDeviceStates(p => ({ ...p, ac: { ...p.ac, temp: Math.min(30, p.ac.temp + 1) } }))}
                  className="w-8 h-8 rounded-lg bg-slate-800 text-white font-bold hover:bg-slate-700 flex items-center justify-center"
                >
                  +
                </button>
              </div>
            </div>

            {/* Mode Selector */}
            <div className="grid grid-cols-4 gap-2 text-xs font-semibold">
              {['cool', 'dry', 'fan', 'auto'].map((m) => (
                <button
                  key={m}
                  onClick={() => setDeviceStates(p => ({ ...p, ac: { ...p.ac, mode: m } }))}
                  className={`py-2 rounded-lg border capitalize transition-all ${
                    deviceStates.ac.mode === m 
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_10px_rgba(0,229,255,0.3)]'
                      : 'bg-slate-900/30 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {m === 'cool' ? 'Lạnh' : m === 'dry' ? 'Khô' : m === 'fan' ? 'Quạt' : 'Tự động'}
                </button>
              ))}
            </div>
          </div>

          {/* Smart Lock & Security Sensors */}
          <div className="mystic-card p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-white text-base">Khóa Cửa Thông Minh (TadoLock)</h4>
                <p className="text-xs text-slate-400">Cửa chính tầng 1 • Pin: {deviceStates.lock.battery}%</p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                Đang khóa
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-white">Mở khóa từ xa</p>
                <p className="text-xs text-slate-400 mt-0.5">Xác thực mã PIN hoặc sinh trắc học</p>
              </div>

              <button
                onClick={() => {
                  setDeviceStates(p => ({ ...p, lock: { ...p.lock, locked: !p.lock.locked } }));
                  sendControl('lock', 'remote_unlock', {});
                }}
                className="btn-mystic text-xs"
              >
                <Unlock className="w-4 h-4" />
                Mở khóa ngay
              </button>
            </div>

            {/* Sensors Status */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800/80 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                  <Flame className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[11px] text-slate-400">Cảm biến Khói</p>
                  <p className="text-xs font-bold text-emerald-400">An toàn</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800/80 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
                  <Eye className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[11px] text-slate-400">Radar Hiện diện</p>
                  <p className="text-xs font-bold text-cyan-400">Đang hoạt động</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
