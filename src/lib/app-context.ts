import { Context } from 'hono';
import { createHunonicClient, HunonicAuthError } from './hunonic-api.js';

let hunonicClient: ReturnType<typeof createHunonicClient> | null = null;

export function getClient(c?: Context) {
  // If user passed a token in header, try using it
  if (c) {
    const authHeader = c.req.header('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice(7).trim();
      if (token) {
        return createHunonicClient(token);
      }
    }
  }

  // Fallback to server daemon client with automatic background re-login
  if (!hunonicClient) {
    hunonicClient = createHunonicClient();
  }
  return hunonicClient;
}

export function getDaemonClient() {
  if (!hunonicClient) {
    hunonicClient = createHunonicClient();
  }
  return hunonicClient;
}

export function parseJsonSafe(value: any): Record<string, any> {
  if (!value) return {};
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}

export function handleAuthError(error: unknown, c?: Context) {
  const msg = error instanceof Error ? error.message.toLowerCase() : '';
  const isAuthRelated =
    error instanceof HunonicAuthError ||
    msg.includes('xác thực') ||
    msg.includes('token') ||
    msg.includes('hết hạn') ||
    msg.includes('đăng nhập') ||
    (msg.includes('500') && !!c?.req.header('Authorization'));

  if (isAuthRelated) {
    return {
      status: 401 as const,
      response: {
        success: false,
        code: 'SESSION_REVOKED',
        error:
          'Phiên đăng nhập đã hết hạn do tài khoản vừa đăng nhập trên điện thoại (iPhone). Vui lòng nhấn Đăng Nhập lại trên trình duyệt!',
      },
    };
  }

  return {
    status: 500 as const,
    response: {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    },
  };
}

export interface SummaryCache {
  data: any;
  timestamp: number;
  key: string;
}

export let summaryCache: SummaryCache | null = null;
export const CACHE_TTL_MS = 15 * 1000;

export function setSummaryCache(cache: SummaryCache | null) {
  summaryCache = cache;
}
