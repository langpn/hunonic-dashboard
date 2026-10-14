import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorScreenProps {
  message: string;
  onRetry: () => void;
}

export function ErrorScreen({ message, onRetry }: ErrorScreenProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#04070d] px-4">
      <div className="max-w-md w-full mystic-card p-8 text-center space-y-6 glow-border-rose">
        <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center justify-center mx-auto text-rose-400 shadow-[0_0_30px_rgba(244,63,94,0.3)]">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Lỗi Kết Nối Máy Chủ</h2>
          <p className="text-xs text-slate-400 mt-2 font-mono break-words leading-relaxed">
            {message}
          </p>
        </div>

        <button
          onClick={onRetry}
          className="btn-mystic w-full py-3 text-xs uppercase tracking-wider"
        >
          <RefreshCw className="w-4 h-4" />
          Thử Kết Nối Lại
        </button>
      </div>
    </div>
  );
}
