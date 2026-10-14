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

  const fetchSummary = async (activeToken?: string) => {
    const authToken = activeToken || token;
    try {
      setLoading(true);
      const headers: Record<string, string> = {};
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const res = await fetch('/api/dashboard/summary', { headers });
      if (!res.ok) {
        if (res.status === 401) {
          // Token expired or invalid
          handleLogout();
          throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!');
        }
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch dashboard data');
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
    fetchSummary(newToken);
  };

  const handleLogout = () => {
    localStorage.removeItem('hunonic_token');
    sessionStorage.removeItem('hunonic_token');
    setToken(null);
    setSummary(null);
    setError(null);
  };

  // 1. Not logged in -> Show Login Screen
  if (!token) {
    return (
      <LoginScreen
        onLoginSuccess={handleLoginSuccess}
        isDark={isDark}
        onToggleTheme={toggleTheme}
      />
    );
  }

  // 2. Loading State
  if (loading && !summary) {
    return <LoadingScreen />;
  }

  // 3. Error State
  if (error && !summary) {
    return <ErrorScreen message={error} onRetry={() => fetchSummary()} />;
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
