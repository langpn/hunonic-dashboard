/**
 * Hunonic API Client
 * Reverse engineered from Hunonic iOS app & web app
 */
import axios, { AxiosInstance } from 'axios';
import CryptoJS from 'crypto-js';

export interface HunonicConfig {
  phone: string;
  password: string;
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
  type: '1' | '2' | '3'; // 1=year, 2=month, 3=custom
  root_id: string;
  time_start: string; // YYYY-MM-DD
  time_end: string;   // YYYY-MM-DD
  year: string;
  month?: string;
}

export interface GraphDataPoint {
  label: string;      // YYYY-MM-DD
  value: number;      // kWh
  value_2: number;
  solar: number;
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
  private client: AxiosInstance;
  private token: string | null = null;
  private tokenExpiry: number = 0;
  private config: HunonicConfig;

  constructor(config: HunonicConfig) {
    this.config = {
      ...config,
      baseUrl: config.baseUrl || 'https://web.hunonic.com/api/api',
    };

    this.client = axios.create({
      baseURL: this.config.baseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true,
    });

    // CRITICAL: Request interceptor must NOT intercept /auth/login to avoid infinite recursion & OOM!
    this.client.interceptors.request.use(async (request) => {
      if (request.url && request.url.includes('/auth/login')) {
        return request;
      }
      const token = await this.getValidToken();
      if (token) {
        request.headers.Authorization = `Bearer ${token}`;
      }
      return request;
    });
  }

  /**
   * MD5 hash password (required by Hunonic API)
   */
  private md5(text: string): string {
    return CryptoJS.MD5(text).toString();
  }

  /**
   * Helper to normalize Vietnamese phone number: +84 -> 0
   */
  private formatPhone(phone: string): string {
    const trimmed = phone.trim().replace(/\s+/g, '');
    if (trimmed.startsWith('+84')) {
      return '0' + trimmed.slice(3);
    }
    if (trimmed.startsWith('84') && trimmed.length === 11) {
      return '0' + trimmed.slice(2);
    }
    return trimmed;
  }

  /**
   * Login and get JWT token
   */
  async login(): Promise<string> {
    const passwordHash = this.md5(this.config.password);
    const phone = this.formatPhone(this.config.phone);

    const response = await this.client.post<LoginResponse>('/auth/login', {
      phone: phone,
      password: passwordHash,
    });

    const body = response.data;
    if (!body.status || !body.data?.token) {
      throw new Error(`Login failed: ${body.message || 'Unknown error'}`);
    }

    this.token = body.data.token;
    this.tokenExpiry = body.data.expiresAt * 1000;
    return this.token;
  }

  /**
   * Get valid token (auto-refresh if expired)
   */
  async getValidToken(): Promise<string> {
    if (!this.token || Date.now() >= this.tokenExpiry - 60000) {
      await this.login();
    }
    return this.token!;
  }

  /**
   * Get list of homes
   */
  async getHomes(): Promise<Home[]> {
    const response = await this.client.get('/hun-api/home/list-home');
    if (!response.data.status) {
      throw new Error(`Get homes failed: ${response.data.message}`);
    }
    return response.data.data;
  }

  /**
   * Get devices in a home
   */
  async getDevicesByHome(homeId: string = '966357'): Promise<Device[]> {
    const response = await this.client.get('/hun-api/device/listDeviceByHome', {
      params: { home_id: homeId },
    });
    if (!response.data.status) {
      throw new Error(`Get devices failed: ${response.data.message}`);
    }
    const rawData = response.data.data;
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
   * Get electricity rate for a device
   */
  async getElectricityRate(rootId: string): Promise<ElectricityRate[]> {
    const response = await this.client.get('/hun-api/atmwifi/get-electricity-rate', {
      params: { root_id: rootId },
    });
    if (!response.data.status) {
      throw new Error(`Get electricity rate failed: ${response.data.message}`);
    }
    return response.data.data;
  }

  /**
   * Get graph data (consumption history) for elmeter/atmwifi
   */
  async getGraphData(params: GraphDataParams): Promise<GraphDataResponse['data']> {
    const response = await this.client.post('/hun-api/atmwifi/getDataGraph', params);
    if (!response.data.status) {
      throw new Error(`Get graph data failed: ${response.data.message}`);
    }
    return response.data.data;
  }

  /**
   * Get month consumption for a device
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
   * Get yearly consumption for a device
   */
  async getYearlyConsumption(rootId: string, year?: number): Promise<GraphDataResponse['data']> {
    const targetYear = year || new Date().getFullYear();

    return this.getGraphData({
      type: '1',
      root_id: rootId,
      time_start: `${targetYear}-01-01`,
      time_end: `${targetYear}-12-31`,
      year: targetYear.toString(),
    });
  }
}

/**
 * Create client instance from environment variables
 */
export function createHunonicClient(): HunonicApiClient {
  const phone = process.env.HUNONIC_PHONE;
  const password = process.env.HUNONIC_PASSWORD;

  if (!phone || !password) {
    throw new Error('HUNONIC_PHONE and HUNONIC_PASSWORD must be set in environment');
  }

  return new HunonicApiClient({ phone, password });
}
