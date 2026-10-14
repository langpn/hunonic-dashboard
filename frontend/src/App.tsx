import { useState, useEffect } from 'react';
import { Dashboard } from './components/Dashboard';
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
  allDevices?: Array<{
    id: string;
    name: string;
    root_id: string;
    root_type: string;
    room_name: string;
    state: string;
    status: number;
    last_online: string;
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
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/dashboard/summary');
      if (!res.ok) {
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

  if (loading) {
    return <LoadingScreen />;
  }

  if (error) {
    return <ErrorScreen message={error} onRetry={fetchSummary} />;
  }

  return <Dashboard summary={summary!} onRefresh={fetchSummary} />;
}

export default App;
