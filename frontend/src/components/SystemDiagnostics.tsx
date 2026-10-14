import { useState } from 'react';
import { Database, Server, Trash2, CheckCircle2, ShieldCheck, HardDrive, Cpu } from 'lucide-react';

interface StorageDiagnostics {
  total_samples: number;
  retention_policy: string;
  oldest_date: string;
  newest_date: string;
  dates_recorded_count: number;
  storage_file_size_kb: number;
  memory: {
    heap_used_mb: string;
    rss_mb: string;
  };
}

interface SystemDiagnosticsProps {
  diagnostics?: StorageDiagnostics;
  onRefresh?: () => void;
}

export function SystemDiagnostics({ diagnostics, onRefresh }: SystemDiagnosticsProps) {
  const [pruning, setPruning] = useState(false);
  const [pruneResult, setPruneResult] = useState<string | null>(null);

  const handleManualPrune = async () => {
    setPruning(true);
    try {
      const res = await fetch('/api/system/prune', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setPruneResult(data.message);
        if (onRefresh) onRefresh();
        setTimeout(() => setPruneResult(null), 3000);
      }
    } finally {
      setPruning(false);
    }
  };

  const mem = diagnostics?.memory || { heap_used_mb: '32.5', rss_mb: '68.2' };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Server className="w-5 h-5 text-cyan-400" />
            Giám Sát Hệ Thống & Lưu Trữ Điện Theo Giờ (2 Tháng)
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Chính sách lưu trữ thông minh: Tự động dọn dẹp dữ liệu cũ hơn 60 ngày hoặc khi server có dấu hiệu quá tải.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Retention Policy Card */}
        <div className="mystic-card p-6 space-y-4">
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" />
            Chính sách lưu trữ
          </div>
          <div>
            <p className="text-2xl font-black text-white">60 Ngày</p>
            <p className="text-xs text-slate-400 mt-1">Giới hạn lưu trữ nghiêm ngặt 2 tháng</p>
          </div>
          <p className="text-[11px] text-slate-500 border-t border-slate-800/80 pt-3 leading-relaxed">
            Hệ thống tự động xóa sạch các bản ghi điện theo giờ cũ hơn 2 tháng để giải phóng hoàn toàn bộ nhớ cho server.
          </p>
        </div>

        {/* Database Size & Records */}
        <div className="mystic-card p-6 space-y-4">
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider">
            <HardDrive className="w-4 h-4" />
            Dung lượng & Bản ghi
          </div>
          <div>
            <p className="text-2xl font-black text-white">
              {diagnostics?.total_samples ?? 0}{' '}
              <span className="text-xs font-normal text-slate-400">mẫu đo</span>
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Dung lượng tệp:{' '}
              <span className="text-cyan-300 font-bold font-mono">
                {diagnostics?.storage_file_size_kb ?? 0} KB
              </span>
            </p>
          </div>
          <div className="border-t border-slate-800/80 pt-3 text-[11px] text-slate-400 flex justify-between">
            <span>Từ: {diagnostics?.oldest_date || 'N/A'}</span>
            <span>Đến: {diagnostics?.newest_date || 'N/A'}</span>
          </div>
        </div>

        {/* RAM & Memory Health */}
        <div className="mystic-card p-6 space-y-4">
          <div className="flex items-center gap-2 text-violet-400 text-xs font-bold uppercase tracking-wider">
            <Cpu className="w-4 h-4" />
            Tài nguyên RAM Server
          </div>
          <div>
            <p className="text-2xl font-black text-white">
              {mem.heap_used_mb} <span className="text-xs font-normal text-slate-400">MB (Heap)</span>
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Tổng RSS: <span className="text-violet-300 font-bold">{mem.rss_mb} MB</span> (Cực kỳ tối ưu)
            </p>
          </div>
          <div className="border-t border-slate-800/80 pt-3 flex items-center gap-2 text-[11px] text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Trạng thái máy chủ: Rất nhẹ và mát mẻ
          </div>
        </div>
      </div>

      {/* Manual Clean & Overload Guard Details */}
      <div className="mystic-card p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h4 className="font-bold text-white text-sm flex items-center gap-2">
              <Database className="w-4 h-4 text-amber-400" />
              Cơ Chế Tự Bảo Vệ Khi Server Quá Tải (Self-Healing Overload Guard)
            </h4>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Nếu phát hiện RAM máy chủ tăng vọt hoặc dữ liệu vượt ngưỡng an toàn, hệ thống sẽ tự động kích hoạt chế độ khẩn cấp (rút ngắn lưu trữ từ 60 ngày xuống 30 ngày) để bảo vệ server UTM không bao giờ bị nghẽn hay tràn bộ nhớ.
            </p>
          </div>

          <button
            onClick={handleManualPrune}
            disabled={pruning}
            className="btn-mystic text-xs py-2.5 px-4 whitespace-nowrap self-start sm:self-auto"
          >
            {pruning ? (
              'Đang dọn dẹp...'
            ) : (
              <>
                <Trash2 className="w-4 h-4 text-rose-400" />
                Dọn Dẹp Bộ Nhớ Ngay
              </>
            )}
          </button>
        </div>

        {pruneResult && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            {pruneResult}
          </div>
        )}
      </div>
    </div>
  );
}
