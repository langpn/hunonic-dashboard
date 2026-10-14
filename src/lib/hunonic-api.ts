/**
 * Hunonic API Client - Ultra Lean Edition
 * Pure Native Fetch & Native Crypto (Zero External Dependencies)
 */
import crypto from 'node:crypto';

export interface HunonicConfig {
  phone?: string;
  password?: string;
  token?: string;
  baseUrl?: string;
}

export interface LoginResponse {
  code: string;
  status: boolean;
  message: string;
  data: {
    token: string;
    expiresAt: number;
  };
}

export interface Home {
  id: string;
  name: string;
  phone: string;
  address: string;
  timezone: string;
  user_id: string;
  user_name: string;
  home_role: number;
  home_extra: string;
}

export interface Device {
  id: string;
  name: string;
  root_id: string;
  root_type: string;
  room_id: string;
  room_name: string;
  active: string;
  state: string;
  status: number;
  last_online: string;
  data_extra: string | Record<string, any>;
  root_extra: string | Record<string, any>;
  meta: string;
  key: string;
  iv: string;
  power_of_month?: string;
  money_of_month?: number;
  power_of_prev_month?: string;
  money_of_prev_month?: number;
}

export interface ElectricityRateItem {
  id: string;
  electricity_group_id: string;
  group_name: string;
  name: string;
  price: string;
  min_rate: string;
  max_rate: string;
  start: string | null;
  expire: string | null;
}

export interface ElectricityRate {
  id: string;
  name: string;
  electricity_rate: ElectricityRateItem | ElectricityRateItem[];
}

export interface GraphDataParams {
  type: '1' | '2' | '3'; // 1=hourly/year, 2=month, 3=year
  root_id: string;
  time_start: string; // YYYY-MM-DD
  time_end: string;   // YYYY-MM-DD
  year: string;
  month?: string;
}

export interface GraphDataPoint {
  label: string;      // YYYY-MM-DD
  value: number;      // kWh
  value_2?: number;
  solar?: number;
}

export interface GraphDataResponse {
  code: string;
  status: boolean;
  message: string;
  data: {
    first_power: number;
    last_power: number;
    total_power: number;
    total_power_2: number;
    total_price: number;
    total_price_2: number;
    graph_type: number;
    graph_data: GraphDataPoint[];
  };
}

export class HunonicApiClient {
  private token: string | null = null;
  private tokenExpiry: number = 0;
  private config: HunonicConfig;
  private baseUrl: string;

  constructor(config: HunonicConfig) {
    this.config = config;
    this.baseUrl = config.baseUrl || 'https://web.hunonic.com/api/api';
    if (config.token) {
      this.token = config.token;
      this.tokenExpiry = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 days
    }
  }

  /**
   * Static direct login helper
   */
  public static async loginDirect(phone: string, password: string, baseUrl: string = 'https://web.hunonic.com/api/api'): Promise<{ token: string; expiresAt: number }> {
    const trimmed = phone.trim().replace(/\s+/g, '');
    let formattedPhone = trimmed;
    if (trimmed.startsWith('+84')) formattedPhone = '0' + trimmed.slice(3);
    else if (trimmed.startsWith('84') && trimmed.length === 11) formattedPhone = '0' + trimmed.slice(2);

    const passwordHash = crypto.createHash('md5').update(password).digest('hex');

    const res = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        phone: formattedPhone,
        password: passwordHash,
      }),
    });

    const body = await res.json() as LoginResponse;
    if (!body.status || !body.data?.token) {
      throw new Error(body.message || 'Số điện thoại hoặc mật khẩu không chính xác!');
    }

    return {
      token: body.data.token,
      expiresAt: body.data.expiresAt * 1000,
    };
  }

  /**
   * Native C++ MD5 Hash for maximum speed
   */
  private md5(text: string): string {
    return crypto.createHash('md5').update(text).digest('hex');
  }

  /**
   * Phone normalization: +84 -> 0
   */
  private formatPhone(phone: string): string {
    const trimmed = phone.trim().replace(/\s+/g, '');
    if (trimmed.startsWith('+84')) return '0' + trimmed.slice(3);
    if (trimmed.startsWith('84') && trimmed.length === 11) return '0' + trimmed.slice(2);
    return trimmed;
  }

  /**
   * Native Fetch wrapper with timeout & automatic JSON handling
   */
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const isLogin = endpoint.includes('/auth/login');
    const headers = new Headers(options.headers || {});
    headers.set('Content-Type', 'application/json');
    headers.set('Accept', 'application/json');

    if (!isLogin) {
      const token = await this.getValidToken();
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);

    try {
      const url = `${this.baseUrl}${endpoint}`;
      const res = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      if (!res.ok && res.status >= 500) {
        throw new Error(`Hunonic Cloud Server error (HTTP ${res.status})`);
      }

      const text = await res.text();
      try {
        return JSON.parse(text) as T;
      } catch {
        throw new Error(`Invalid response format from Hunonic API: ${text.slice(0, 100)}`);
      }
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Login and cache token
   */
  async login(): Promise<string> {
    if (!this.config.phone || !this.config.password) {
      throw new Error('Cần số điện thoại và mật khẩu để đăng nhập!');
    }
    const phone = this.formatPhone(this.config.phone);
    const passwordHash = this.md5(this.config.password);

    const body = await this.request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        phone,
        password: passwordHash,
      }),
    });

    if (!body.status || !body.data?.token) {
      throw new Error(`Login failed: ${body.message || 'Unknown credential error'}`);
    }

    this.token = body.data.token;
    this.tokenExpiry = body.data.expiresAt * 1000;
    return this.token;
  }

  /**
   * Get valid token with auto-refresh
   */
  async getValidToken(): Promise<string> {
    if (!this.token || Date.now() >= this.tokenExpiry - 60000) {
      if (this.config.phone && this.config.password) {
        await this.login();
      } else {
        throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!');
      }
    }
    return this.token!;
  }

  /**
   * Get all homes
   */
  async getHomes(): Promise<Home[]> {
    const res = await this.request<{ status: boolean; message: string; data: Home[] }>('/hun-api/home/list-home', {
      method: 'GET',
    });
    if (!res.status) throw new Error(res.message || 'Failed to fetch homes');
    return res.data || [];
  }

  /**
   * Get devices in a home
   */
  async getDevicesByHome(homeId: string = '966357'): Promise<Device[]> {
    const res = await this.request<{ status: boolean; message: string; data: any }>(
      `/hun-api/device/listDeviceByHome?home_id=${encodeURIComponent(homeId)}`,
      { method: 'GET' }
    );
    if (!res.status) throw new Error(res.message || 'Failed to fetch devices');
    
    const rawData = res.data;
    const homesList = Array.isArray(rawData) ? rawData : (rawData ? [rawData] : []);
    const devices: Device[] = [];
    for (const h of homesList) {
      if (h && Array.isArray(h.rooms)) {
        for (const room of h.rooms) {
          if (Array.isArray(room.devices)) {
            devices.push(...room.devices);
          }
        }
      }
    }
    return devices;
  }

  /**
   * Get electricity rate
   */
  async getElectricityRate(rootId: string): Promise<ElectricityRate[]> {
    const res = await this.request<{ status: boolean; message: string; data: ElectricityRate[] }>(
      `/hun-api/atmwifi/get-electricity-rate?root_id=${encodeURIComponent(rootId)}`,
      { method: 'GET' }
    );
    if (!res.status) throw new Error(res.message || 'Failed to fetch rate');
    return res.data || [];
  }

  /**
   * Get graph data (daily/monthly)
   */
  async getGraphData(params: GraphDataParams): Promise<GraphDataResponse['data']> {
    const res = await this.request<GraphDataResponse>('/hun-api/atmwifi/getDataGraph', {
      method: 'POST',
      body: JSON.stringify(params),
    });
    if (!res.status) throw new Error(res.message || 'Failed to fetch graph data');
    return res.data;
  }

  /**
   * Get current month daily consumption
   */
  async getMonthConsumption(rootId: string, targetYear?: number, targetMonth?: number): Promise<GraphDataResponse['data']> {
    const now = new Date();
    const year = targetYear || now.getFullYear();
    const month = targetMonth || (now.getMonth() + 1);
    const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${month.toString().padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}`;

    return this.getGraphData({
      type: '2',
      root_id: rootId,
      time_start: startDate,
      time_end: endDate,
      year: year.toString(),
      month: month.toString(),
    });
  }

  /**
   * Update device settings / thresholds
   */
  async updateThresholds(data: Record<string, any>): Promise<boolean> {
    const res = await this.request<{ status: boolean; message: string }>('/hun-api/atmwifi/update-atm-info', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return !!res.status;
  }
}

export function createHunonicClient(token?: string): HunonicApiClient {
  if (token) {
    return new HunonicApiClient({ token });
  }
  const phone = process.env.HUNONIC_PHONE || '';
  const password = process.env.HUNONIC_PASSWORD || '';
  return new HunonicApiClient({ phone, password });
}
