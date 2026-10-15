import { useState } from 'react';
import { Wifi, QrCode, CheckCircle2, AlertCircle, Loader2, ArrowRight, X, ExternalLink } from 'lucide-react';

interface AddDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  token?: string | null;
  onDeviceAdded?: () => void;
}

export function AddDeviceModal({ isOpen, onClose, token, onDeviceAdded }: AddDeviceModalProps) {
  const [activeTab, setActiveTab] = useState<'wifi' | 'qr'>('wifi');
  const [qrInput, setQrInput] = useState('');
  const [deviceName, setDeviceName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<any | null>(null);

  if (!isOpen) return null;

  const handleClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qrInput.trim()) {
      setError('Vui lòng nhập mã QR hoặc số Serial trên công tơ!');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessResult(null);

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
        throw new Error(json.error || 'Không thể liên kết thiết bị!');
      }

      setSuccessResult(json.data);
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
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Thêm Công Tơ Điện Mới
              </h2>
              <p className="text-xs text-slate-400">
                Tự cấu hình và sử dụng 100% trên Web, không cần app Hunonic
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
            onClick={() => setActiveTab('wifi')}
            className={`py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'wifi'
                ? 'bg-white dark:bg-[#242c3d] text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Wifi className="w-3.5 h-3.5" />
            <span>1. Kết nối Wi-Fi (Zero-App)</span>
          </button>

          <button
            onClick={() => setActiveTab('qr')}
            className={`py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'qr'
                ? 'bg-white dark:bg-[#242c3d] text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>2. Khai báo mã QR</span>
          </button>
        </div>

        {/* Tab 1: Wi-Fi Setup Guide without App */}
        {activeTab === 'wifi' && (
          <div className="space-y-4 text-xs">
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 leading-relaxed space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Cài đặt trực tiếp qua trình duyệt (Không cần tải App)
              </p>
              <p className="text-[11px] opacity-90">
                Công tơ thông minh Hunonic tích hợp sẵn cổng web nội bộ để cấu hình Wi-Fi nhanh chóng.
              </p>
            </div>

            <ol className="space-y-3 text-slate-600 dark:text-slate-300">
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">
                  1
                </span>
                <div>
                  <strong className="text-slate-900 dark:text-white block font-semibold">Cấp nguồn & Reset công tơ</strong>
                  <span className="text-slate-400">Bật nguồn công tơ, nhấn giữ nút tròn 5 giây đến khi đèn báo nhấp nháy nhanh.</span>
                </div>
              </li>

              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">
                  2
                </span>
                <div>
                  <strong className="text-slate-900 dark:text-white block font-semibold">Bắt sóng Wi-Fi của công tơ</strong>
                  <span className="text-slate-400">Dùng điện thoại/laptop mở Wi-Fi và kết nối vào mạng tên <code>HUNONIC_...</code> (không có mật khẩu).</span>
                </div>
              </li>

              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">
                  3
                </span>
                <div>
                  <strong className="text-slate-900 dark:text-white block font-semibold">Lưu tên Wi-Fi nhà bạn</strong>
                  <span className="text-slate-400">Mở trình duyệt gõ: </span>
                  <a
                    href="http://192.168.4.1/wificonfig"
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono text-emerald-500 font-bold hover:underline inline-flex items-center gap-1"
                  >
                    http://192.168.4.1/wificonfig <ExternalLink className="w-3 h-3" />
                  </a>
                  <span className="text-slate-400"> rồi chọn Wi-Fi nhà và bấm Lưu.</span>
                </div>
              </li>
            </ol>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setActiveTab('qr')}
                className="w-full btn-emerald"
              >
                <span>Đã kết nối Wi-Fi ➔ Sang bước 2 (Khai báo mã)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Claim by QR Code / Serial */}
        {activeTab === 'qr' && (
          <form onSubmit={handleClaim} className="space-y-4 text-xs">
            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {successResult && (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  Khai báo công tơ thành công!
                </p>
                <p className="text-[11px] opacity-90">
                  Mã thiết bị: <code className="font-mono">{successResult.code}</code> ({successResult.device_type})
                </p>
                <p className="text-[11px] pt-1">
                  Bấm <strong>Làm Mới</strong> trên trang chủ để hệ thống đồng bộ dữ liệu ngay lập tức.
                </p>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Mã QR / Chuỗi ký tự trên tem công tơ
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
                (Quét bằng camera điện thoại hoặc đọc dãy ký tự in cạnh mã QR trên thân công tơ)
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Đặt tên thiết bị (Tùy chọn)
              </label>
              <input
                type="text"
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
                placeholder="VD: Điều hòa phòng khách / Tổng nhà tầng 1"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-[#1a202c] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-xs outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full btn-emerald"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Đang kết nối thiết bị...
                  </>
                ) : (
                  <>
                    <span>Khai Báo & Sử Dụng Công Tơ Này</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
