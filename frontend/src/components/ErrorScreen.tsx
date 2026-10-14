import { AlertTriangle, RefreshCw, LogIn } from 'lucide-react';

interface ErrorScreenProps {
  message: string;
  onRetry: () => void;
  onResetSession?: () => void;
}

export function ErrorScreen({ message, onRetry, onResetSession }: ErrorScreenProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F4F6F8] dark:bg-[#0D1117] px-4 transition-colors">
      <div className="max-w-md w-full studio-card p-6 sm:p-8 text-center space-y-6 shadow-xl">
        <div className="w-14 h-14 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center mx-auto text-[#EF4444]">
          <AlertTriangle className="w-7 h-7" />
        </div>

        <div className="space-y-1.5">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            Thông Báo Lỗi
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium break-words leading-relaxed">
            {message}
          </p>
        </div>

        <div className="space-y-2 pt-2">
          <button
            onClick={onRetry}
            className="w-full py-2.5 rounded-xl bg-[#00B33D] hover:bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Thử Tải Lại</span>
          </button>

          {onResetSession && (
            <button
              onClick={onResetSession}
              className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 transition-all border border-slate-200 dark:border-slate-700"
            >
              <LogIn className="w-4 h-4 text-emerald-500" />
              <span>Đăng Nhập Lại / Xóa Session</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
