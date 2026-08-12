import express from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { queryOne, queryAll, execute } from '../db.js';
import { config } from '../config.js';

const router = express.Router();
const STORE_JWT_SECRET = config.jwtSecret || 'sv_api_store_jwt_secret_2026';

// 认证中间件
function storeAuth(req, res, next) {
  const token = req.headers['authorization']?.replace('Bearer ', '') || req.query.token;
  if (!token) {
    return res.status(401).json({ code: 401, success: false, message: '请先登录' });
  }
  try {
    const decoded = jwt.verify(token, STORE_JWT_SECRET);
    req.user = decoded;
    next();
  } catch (e) {
    return res.status(401).json({ code: 401, success: false, message: '登录状态失效，请重新登录' });
  }
}

// 套餐定义配置
const PACKAGES = [
  {
    id: 'bronze',
    name: '青铜套餐',
    price: 19.9,
    quota: 1000,
    quotaLabel: '1,000 次/月',
    expireDays: 30,
    desc: '适合初创个人小程序与低频体验',
    badge: '入门优选'
  },
  {
    id: 'silver',
    name: '白银套餐',
    price: 39.9,
    quota: 10000,
    quotaLabel: '10,000 次/月',
    expireDays: 30,
    desc: '适合主流运营小程序与高频调用',
    badge: '🔥 热门推荐',
    popular: true
  },
  {
    id: 'diamond',
    name: '钻石套餐',
    price: 99.9,
    quota: -1,
    quotaLabel: '不限次数/月',
    expireDays: 30,
    desc: '尊享无限次解析，独立高并发通道',
    badge: '👑 尊享无限'
  }
];

// 1. 获取套餐列表
router.get('/packages', (req, res) => {
  return res.json({ code: 200, success: true, data: PACKAGES });
});

// 2. 发送邮箱验证码
router.post('/send-code', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !email.trim()) {
      return res.status(400).json({ code: 400, success: false, message: '请填写邮箱地址' });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return res.status(400).json({ code: 400, success: false, message: '邮箱格式不正确' });
    }

    // 检查邮箱是否已被注册
    const existingEmail = await queryOne('SELECT id FROM store_users WHERE email = ?', [trimmedEmail]);
    if (existingEmail) {
      return res.status(400).json({ code: 400, success: false, message: '该邮箱地址已被注册，请直接登录' });
    }

    const { sendVerificationCode } = await import('../utils/mailer.js');
    const result = await sendVerificationCode(trimmedEmail);

    return res.json({ code: 200, success: true, message: result.message });
  } catch (err) {
    console.error('发送验证码失败:', err.message);
    return res.status(400).json({ code: 400, success: false, message: err.message || '发送验证码失败' });
  }
});

// 3. 售卖用户注册 (要求必填邮箱与邮箱验证码)
router.post('/register', async (req, res) => {
  try {
    const { username, password, email, code } = req.body;
    if (!email || !email.trim()) {
      return res.status(400).json({ code: 400, success: false, message: '邮箱地址为必填项' });
    }
    if (!code || !code.trim()) {
      return res.status(400).json({ code: 400, success: false, message: '请输入 6 位邮箱验证码' });
    }
    if (!username || !username.trim() || !password || !password.trim()) {
      return res.status(400).json({ code: 400, success: false, message: '用户名和密码不能为空' });
    }

    const trimmedUser = username.trim();
    const trimmedEmail = email.trim().toLowerCase();

    // 校验邮箱验证码
    const { verifyVerificationCode } = await import('../utils/mailer.js');
    const checkRes = verifyVerificationCode(trimmedEmail, code.trim());
    if (!checkRes.valid) {
      return res.status(400).json({ code: 400, success: false, message: checkRes.message });
    }

    // 检查用户名
    const existingUser = await queryOne('SELECT id FROM store_users WHERE username = ?', [trimmedUser]);
    if (existingUser) {
      return res.status(400).json({ code: 400, success: false, message: '该用户名已被注册' });
    }

    // 检查邮箱
    const existingEmail = await queryOne('SELECT id FROM store_users WHERE email = ?', [trimmedEmail]);
    if (existingEmail) {
      return res.status(400).json({ code: 400, success: false, message: '该邮箱已被注册' });
    }

    // 哈希密码并插入用户
    const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
    const result = await execute(
      'INSERT INTO store_users (username, password, email) VALUES (?, ?, ?)',
      [trimmedUser, hashedPassword, trimmedEmail]
    );

    const userId = result.insertId || result.lastID;
    const token = jwt.sign({ id: userId, username: trimmedUser }, STORE_JWT_SECRET, { expiresIn: '7d' });

    return res.json({
      code: 200,
      success: true,
      message: '注册成功！已为您自动登录',
      data: {
        token,
        user: { id: userId, username: trimmedUser, email: trimmedEmail }
      }
    });
  } catch (err) {
    console.error('注册售卖用户失败:', err);
    return res.status(500).json({ code: 500, success: false, message: '注册失败: ' + err.message });
  }
});

// 3. 售卖用户登录
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ code: 400, success: false, message: '请输入用户名和密码' });
    }

    const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
    const user = await queryOne('SELECT id, username, email, password FROM store_users WHERE username = ?', [username.trim()]);

    if (!user || user.password !== hashedPassword) {
      return res.status(400).json({ code: 400, success: false, message: '用户名或密码错误' });
    }

    const token = jwt.sign({ id: user.id, username: user.username }, STORE_JWT_SECRET, { expiresIn: '7d' });

    return res.json({
      code: 200,
      success: true,
      message: '登录成功',
      data: {
        token,
        user: { id: user.id, username: user.username, email: user.email }
      }
    });
  } catch (err) {
    console.error('登录售卖用户失败:', err);
    return res.status(500).json({ code: 500, success: false, message: '登录失败: ' + err.message });
  }
});

// 4. 获取当前用户个人信息与概要
router.get('/profile', storeAuth, async (req, res) => {
  try {
    const user = await queryOne('SELECT id, username, email, created_at FROM store_users WHERE id = ?', [req.user.id]);
    const keys = await queryAll('SELECT api_key, status, total_quota, used_quota, expire_time FROM api_keys WHERE user_name = ?', [req.user.username]);
    const orders = await queryAll('SELECT id, order_no, amount, status FROM orders WHERE user_id = ?', [req.user.id]);

    return res.json({
      code: 200,
      success: true,
      data: {
        user,
        keyCount: keys.length,
        orderCount: orders.length
      }
    });
  } catch (err) {
    return res.status(500).json({ code: 500, success: false, message: '获取用户信息失败' });
  }
});

// 5. 创建支付宝扫码支付订单（返回二维码 base64）
router.post('/create-alipay-order', storeAuth, async (req, res) => {
  try {
    const { package_id } = req.body;
    const pkg = PACKAGES.find(p => p.id === package_id);
    if (!pkg) {
      return res.status(400).json({ code: 400, success: false, message: '无效的套餐类型' });
    }

    // 获取支付宝实例（未配置则返回错误）
    const { getAlipayInstance } = await import('../utils/alipayInstance.js');
    const alipaySdk = await getAlipayInstance();
    if (!alipaySdk) {
      return res.status(500).json({ code: 500, success: false, message: '支付宝支付尚未配置，请联系管理员' });
    }

    // 生成订单号
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomHex = crypto.randomBytes(4).toString('hex').toUpperCase();
    const orderNo = `ORD${dateStr}${randomHex}`;

    // 写入 orders 表（pay_status=0 待支付，api_key 留空等回调后填充）
    await execute(
      `INSERT INTO orders (order_no, user_id, user_name, package_id, package_name, amount, quota, expire_days, api_key, status, pay_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, '', 1, 0)`,
      [orderNo, req.user.id, req.user.username, pkg.id, pkg.name, pkg.price, pkg.quota, pkg.expireDays]
    );

    // 调用支付宝 alipay.trade.precreate 生成二维码
    const result = await alipaySdk.exec('alipay.trade.precreate', {
      bizContent: {
        out_trade_no: orderNo,
        total_amount: pkg.price.toFixed(2),
        subject: `云边去水印API ${pkg.name}`,
        body: `短视频解析API授权 - ${pkg.name} (${pkg.quotaLabel})`,
        timeout_express: '10m',
      },
    });

    const qrCode = result?.alipayTradePrecreateResponse?.qrCode || result?.qr_code;
    if (!qrCode) {
      console.error('[Store] 支付宝 precreate 响应:', JSON.stringify(result));
      return res.status(500).json({ code: 500, success: false, message: '支付宝生成二维码失败，请检查配置' });
    }

    // 使用 qrcode 库将二维码链接转为 base64 DataURL
    const QRCode = (await import('qrcode')).default;
    const qrBase64 = await QRCode.toDataURL(qrCode, { width: 240, margin: 1 });

    return res.json({
      code: 200,
      success: true,
      message: '订单创建成功',
      data: { orderNo, qrBase64, amount: pkg.price, packageName: pkg.name }
    });

  } catch (err) {
    console.error('创建支付宝订单失败:', err);
    return res.status(500).json({ code: 500, success: false, message: '创建订单失败: ' + err.message });
  }
});

// 6. 轮询订单支付状态
router.get('/check-order', storeAuth, async (req, res) => {
  try {
    const { order_no } = req.query;
    if (!order_no) {
      return res.status(400).json({ code: 400, success: false, message: '缺少 order_no 参数' });
    }

    const order = await queryOne(
      'SELECT order_no, pay_status, api_key, package_name, amount FROM orders WHERE order_no = ? AND user_id = ?',
      [order_no, req.user.id]
    );

    if (!order) {
      return res.status(404).json({ code: 404, success: false, message: '订单不存在' });
    }

    return res.json({
      code: 200,
      success: true,
      data: {
        paid: order.pay_status === 1,
        apiKey: order.pay_status === 1 ? order.api_key : null,
        packageName: order.package_name,
        amount: order.amount
      }
    });
  } catch (err) {
    return res.status(500).json({ code: 500, success: false, message: '查询失败' });
  }
});

// 6. 获取我的 Key 密钥列表
router.get('/my-keys', storeAuth, async (req, res) => {
  try {
    const list = await queryAll(
      `SELECT id, api_key, status, total_quota, used_quota, expire_time, note, created_at
       FROM api_keys WHERE user_name = ? ORDER BY id DESC`,
      [req.user.username]
    );

    const now = Date.now();
    const formattedList = list.map(item => {
      let isExpired = false;
      if (item.expire_time) {
        let s = typeof item.expire_time === 'string' ? item.expire_time.trim() : (item.expire_time.toISOString ? item.expire_time.toISOString() : String(item.expire_time));
        if (/^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}$/.test(s)) {
          s = s.replace(' ', 'T') + 'Z';
        }
        isExpired = new Date(s).getTime() < now;
      }

      const remainingQuota = item.total_quota === -1 ? '不限次数' : Math.max(0, item.total_quota - item.used_quota);

      let expireDisplay = '永不过期';
      if (item.expire_time) {
        let s = typeof item.expire_time === 'string' ? item.expire_time.trim() : (item.expire_time.toISOString ? item.expire_time.toISOString() : String(item.expire_time));
        if (/^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}$/.test(s)) {
          s = s.replace(' ', 'T') + 'Z';
        }
        const d = new Date(s);
        if (!isNaN(d.getTime())) {
          expireDisplay = d.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', hour12: false });
        }
      }

      return {
        ...item,
        remainingQuota,
        isExpired,
        expireDisplay
      };
    });

    return res.json({ code: 200, success: true, data: formattedList });
  } catch (err) {
    console.error('获取我的 Key 列表失败:', err);
    return res.status(500).json({ code: 500, success: false, message: '获取 Key 列表失败' });
  }
});

// 7. 获取我的订单记录列表
router.get('/my-orders', storeAuth, async (req, res) => {
  try {
    const list = await queryAll(
      `SELECT id, order_no, package_name, amount, quota, expire_days, api_key, status, created_at
       FROM orders WHERE user_id = ? ORDER BY id DESC`,
      [req.user.id]
    );

    const formattedList = list.map(item => {
      let createdDisplay = item.created_at;
      if (item.created_at) {
        const d = new Date(item.created_at);
        if (!isNaN(d.getTime())) {
          createdDisplay = d.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', hour12: false });
        }
      }
      return {
        ...item,
        createdDisplay
      };
    });

    return res.json({ code: 200, success: true, data: formattedList });
  } catch (err) {
    console.error('获取订单列表失败:', err);
    return res.status(500).json({ code: 500, success: false, message: '获取订单列表失败' });
  }
});

export default router;
