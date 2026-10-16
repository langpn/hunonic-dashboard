import { useState } from 'react';
import { Cloud, QrCode, CheckCircle2, AlertCircle, Loader2, RefreshCw, X, ArrowRight } from 'lucide-react';

interface AddDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  token?: string | null;
  onDeviceAdded?: () => void;
}

export function AddDeviceModal({ isOpen, onClose, token, onDeviceAdded }: AddDeviceModalProps) {
  const [activeTab, setActiveTab] = useState<'sync' | 'claim'>('sync');
  const [qrInput, setQrInput] = useState('');
  const [deviceName, setDeviceName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [syncedDevices, setSyncedDevices] = useState<any[]>([]);

  if (!isOpen) return null;

  // 1-Click Sync from official Hunonic Cloud account
  const handleCloudSync = async () => {
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/devices/sync', {
        method: 'POST',
        headers,
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Không thể đồng bộ danh sách thiết bị!');
      }

      setSyncedDevices(json.data?.meters || []);
      setSuccessMessage(`Đã đồng bộ thành công ${json.data?.meters_count || 0} công tơ từ tài khoản Hunonic!`);
      if (onDeviceAdded) onDeviceAdded();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi kết nối máy chủ');
    } finally {
      setLoading(false);
    }
  };

  // Official Device Claim via QR / Serial
  const handleClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qrInput.trim()) {
      setError('Vui lòng nhập mã QR hoặc số Serial trên công tơ!');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/devices/claim', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          qr_code: qrInput.trim(),
          name: deviceName.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Không thể gán thiết bị vào tài khoản!');
      }

      setSuccessMessage(json.message || 'Gán công tơ vào tài khoản thành công!');
      setQrInput('');
      setDeviceName('');
      if (onDeviceAdded) onDeviceAdded();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi kết nối máy chủ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg panel-card p-6 sm:p-7 bg-white dark:bg-[#12161f] border border-slate-200 dark:border-white/10 shadow-2xl rounded-2xl overflow-hidden space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <Cloud className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Quản Lý & Đồng Bộ Công Tơ
              </h2>
              <p className="text-xs text-slate-400">
                100% kết nối chính thức qua Hunonic Cloud API
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-[#1a202c]">
          <button
            onClick={() => setActiveTab('sync')}
            className={`py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'sync'
                ? 'bg-white dark:bg-[#242c3d] text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Đồng bộ từ Cloud</span>
          </button>

          <button
            onClick={() => setActiveTab('claim')}
            className={`py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'claim'
                ? 'bg-white dark:bg-[#242c3d] text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Khai báo mã QR / Serial</span>
          </button>
        </div>

        {/* Notifications */}
        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center gap-2 text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Tab 1: 1-Click Sync from Cloud */}
        {activeTab === 'sync' && (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#1a202c] border border-slate-200/80 dark:border-white/5 space-y-2">
              <span className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Cloud className="w-4 h-4 text-emerald-500" />
                Tự động nhận diện thiết bị
              </span>
              <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
                Hệ thống tự động liên kết với tài khoản Hunonic của bạn. Mọi công tơ EKMeter, ElMeter hoặc ATM Wifi đã cài trên app điện thoại sẽ được đồng bộ ngay lập tức mà không cần bất kỳ thao tác thủ công nào.
              </p>
            </div>

            {syncedDevices.length > 0 && (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                  Công tơ đã phát hiện ({syncedDevices.length}):
                </span>
                {syncedDevices.map((d: any) => (
                  <div
                    key={d.id}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-[#1a202c] border border-slate-200/60 dark:border-white/5 flex items-center justify-between"
                  >
                    <div>
                      <strong className="text-slate-800 dark:text-white block font-semibold">
                        {d.name}
                      </strong>
                      <span className="text-[10px] text-slate-400">
                        {d.room_name} • Mã: {d.root_type}
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      Sẵn sàng
                    </span>
                  </div>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={handleCloudSync}
              disabled={loading}
              className="w-full btn-emerald"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang quét thiết bị từ Cloud Hunonic...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  <span>Đồng Bộ Ngay Tất Cả Công Tơ</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Tab 2: Claim by QR Code / Serial */}
        {activeTab === 'claim' && (
          <form onSubmit={handleClaim} className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Mã QR / Dãy Serial trên tem công tơ
              </label>
              <input
                type="text"
                value={qrInput}
                onChange={(e) => setQrInput(e.target.value)}
                placeholder="VD: H26230844153246002"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-[#1a202c] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white font-mono text-xs outline-none focus:border-emerald-500 transition-colors"
                required
              />
              <span className="text-[10px] text-slate-400 block">
                Mã in trực tiếp trên vỏ công tơ Hunonic, gửi thẳng lên Cloud API
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Tên gợi nhớ (Tùy chọn)
              </label>
              <input
                type="text"
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
                placeholder="VD: Máy lạnh phòng ngủ"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-[#1a202c] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-xs outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-emerald"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang gửi yêu cầu lên Cloud Hunonic...
                </>
              ) : (
                <>
                  <span>Gán Công Tơ Vào Tài Khoản</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
