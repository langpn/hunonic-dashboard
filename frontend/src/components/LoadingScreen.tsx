import { Zap, Loader2 } from 'lucide-react';

export function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Zap className="w-8 h-8 text-primary-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Hunonic Dashboard</h2>
        <p className="text-gray-500 mb-8">Đang tải dữ liệu...</p>
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin mx-auto" />
      </div>
    </div>
  );
}