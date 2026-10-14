import { useState, useEffect } from 'react';
import { Dashboard } from './components/Dashboard';
import { LoginScreen } from './components/LoginScreen';
import { LoadingScreen } from './components/LoadingScreen';
import { ErrorScreen } from './components/ErrorScreen';
import type { HourlyPoint } from './components/HourlyChart';

export interface SummaryData {
  home: {
    id: string;
    name: string;
    timezone: string;
  };
  electricMeters: Array<{
    id: string;
    name: string;
    root_id: string;
    root_type: string;
    room_name: string;
    last_online: string;
    power_current: number;
    power_of_month: number;
    money_of_month: number;
    power_of_prev_month: number;
    money_of_prev_month: number;
    data_extra: Record<string, any>;
    root_extra: Record<string, any>;
  }>;
  today: {
    date: string;
    kwh: number;
    power_current_w: number;
    cost_estimated: number;
    hourly?: HourlyPoint[];
  };
  currentMonth: {
    total_power: number;
    total_price: number;
    first_power: number;
    last_power: number;
    daily_data: Array<{
      date: string;
      kwh: number;
      solar?: number;
    }>;
  } | null;
  electricityRate: {
    price: string;
    group_name: string;
  } | null;
  storage_diagnostics?: {
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
  };
}

function App() {
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('hunonic_token') || sessionStorage.getItem('hunonic_token');
  });
  const [phone, setPhone] = useState<string>(() => {
    return localStorage.getItem('hunonic_phone') || '0353700780';
  });

  const [sessionNotice, setSessionNotice] = useState<string | null>(null);

  const [isDark, setIsDark] = useState<boolean>(() => {
    const saved = localStorage.getItem('hunonic_theme');
    if (saved) return saved === 'dark';
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync theme with HTML root element
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('hunonic_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('hunonic_theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark(prev => !prev);
  };

  // Fetch summary when token is available
  useEffect(() => {
    if (token) {
      fetchSummary(token);
    }
  }, [token]);

  const handleSessionRevoked = (reason?: string) => {
    localStorage.removeItem('hunonic_token');
    sessionStorage.removeItem('hunonic_token');
    setToken(null);
    setSummary(null);
    setError(null);
    setSessionNotice(
      reason || 'Tài khoản vừa được đăng nhập trên điện thoại (iPhone). Vui lòng nhấn Đăng nhập để tiếp tục sử dụng trên trình duyệt!'
    );
  };

  const fetchSummary = async (activeToken?: string) => {
    const authToken = activeToken || token;
    try {
      setLoading(true);
      const headers: Record<string, string> = {};
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const res = await fetch('/api/dashboard/summary', { headers });
      const data = await res.json().catch(() => null);

      if (!res.ok || (data && !data.success)) {
        // Detect session invalidation / concurrent device login
        if (res.status === 401 || (data && data.code === 'SESSION_REVOKED')) {
          handleSessionRevoked(data?.error);
          return;
        }
        throw new Error(data?.error || `HTTP error! status: ${res.status}`);
      }

      setSummary(data.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSuccess = (newToken: string, userPhone: string) => {
    setToken(newToken);
    setPhone(userPhone);
    setSessionNotice(null);
    fetchSummary(newToken);
  };

  const handleLogout = () => {
    localStorage.removeItem('hunonic_token');
    sessionStorage.removeItem('hunonic_token');
    setToken(null);
    setSummary(null);
    setError(null);
    setSessionNotice(null);
  };

  // 1. Not logged in -> Show Login Screen with notice if session was revoked
  if (!token) {
    return (
      <LoginScreen
        onLoginSuccess={handleLoginSuccess}
        isDark={isDark}
        onToggleTheme={toggleTheme}
        sessionNotice={sessionNotice}
      />
    );
  }

  // 2. Loading State
  if (loading && !summary) {
    return <LoadingScreen />;
  }

  // 3. Error State with reset session escape hatch
  if (error && !summary) {
    return (
      <ErrorScreen
        message={error}
        onRetry={() => fetchSummary()}
        onResetSession={handleLogout}
      />
    );
  }

  // 4. Authenticated Dashboard View
  return (
    <Dashboard
      summary={summary!}
      onRefresh={() => fetchSummary()}
      onLogout={handleLogout}
      isDark={isDark}
      onToggleTheme={toggleTheme}
      userPhone={phone}
      token={token}
    />
  );
}

export default App;
