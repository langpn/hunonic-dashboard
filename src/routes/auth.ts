import { Hono } from 'hono';
import { HunonicApiClient } from '../lib/hunonic-api.js';
import { setSummaryCache } from '../lib/app-context.js';

export const authRouter = new Hono();

// POST /api/auth/login
authRouter.post('/api/auth/login', async (c) => {
  try {
    const body = await c.req.json();
    const { phone, password } = body;
    if (!phone || !password) {
      return c.json({ success: false, error: 'Vui lòng nhập số điện thoại và mật khẩu!' }, 400);
    }
    const result = await HunonicApiClient.loginDirect(phone, password);
    // Invalidate summary cache on new login
    setSummaryCache(null);
    return c.json({ success: true, data: result });
  } catch (error) {
    return c.json({ success: false, error: error instanceof Error ? error.message : 'Đăng nhập thất bại!' }, 401);
  }
});
