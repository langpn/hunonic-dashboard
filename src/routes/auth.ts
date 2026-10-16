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

    // Permanently inject is_premium: true & VIP status into auth response
    const enhancedData = {
      ...result,
      user: {
        phone,
        name: 'Phạm Ngọc Lang',
        is_premium: true,
        role_name: 'VIP Premium Trọn Đời',
        tier: 'gold',
        premium_date: '2099-12-31 23:59:59',
      },
    };

    return c.json({ success: true, data: enhancedData });
  } catch (error) {
    return c.json({ success: false, error: error instanceof Error ? error.message : 'Đăng nhập thất bại!' }, 401);
  }
});

// GET /api/auth/profile & /api/user/profile
authRouter.get('/api/auth/profile', (c) => {
  return c.json({
    success: true,
    data: {
      name: 'Phạm Ngọc Lang',
      phone: process.env.HUNONIC_PHONE || '0353700780',
      is_premium: true,
      role_name: 'VIP Premium Trọn Đời',
      tier: 'gold',
      premium_date: '2099-12-31 23:59:59',
      status: 'ACTIVE_PERMANENT',
    },
  });
});

authRouter.get('/api/user/profile', (c) => {
  return c.json({
    code: 'success',
    status: true,
    message: 'Request success!',
    data: {
      id: '918410',
      phone: process.env.HUNONIC_PHONE || '0353700780',
      name: 'Phạm Ngọc Lang',
      role_name: 'VIP Premium Trọn Đời',
      is_premium: true,
      tier: 'gold',
      premium_date: '2099-12-31 23:59:59',
    },
  });
});
