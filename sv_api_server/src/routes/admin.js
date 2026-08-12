import express from 'express';
import crypto from 'crypto';
import { config } from '../config.js';
import { queryOne, queryAll, execute } from '../db.js';

const router = express.Router();

// 管理员 Token 鉴权中间件
function adminAuth(req, res, next) {
  const token =
    req.headers['x-admin-token'] ||
    req.headers.authorization?.replace('Bearer ', '') ||
    req.query.admin_token;

  if (!token || token !== config.adminToken) {
    return res.status(401).json({
      code: 401,
      msg: '管理员身份验证失败，Token 无效或已失效',
    });
  }
  next();
}

// 1. 管理员登录接口
router.post('/login', (req, res) => {
  const { password } = req.body;
  if (password === config.adminPassword) {
    return res.json({
      code: 200,
      msg: '登录成功',
      data: {
        token: config.adminToken,
      },
    });
  } else {
    return res.status(400).json({
      code: 400,
      msg: '密码错误，请输入正确的管理员密码',
    });
  }
});

// 2. Dashboard 概览数据统计
router.get('/stats', adminAuth, async (req, res) => {
  try {
    const totalKeysObj  = await queryOne('SELECT COUNT(*) as cnt FROM api_keys');
    const activeKeysObj = await queryOne('SELECT COUNT(*) as cnt FROM api_keys WHERE status = 1');
    const totalCallsObj = await queryOne('SELECT COALESCE(SUM(used_quota), 0) as cnt FROM api_keys');

    // 今日调用 (兼容 MySQL 与 SQLite)
    let todayCallsObj;
    try {
      todayCallsObj = await queryOne('SELECT COUNT(*) as cnt FROM api_logs WHERE created_at >= CURDATE()');
    } catch (e) {
      todayCallsObj = await queryOne("SELECT COUNT(*) as cnt FROM api_logs WHERE created_at >= date('now', 'start of day')");
    }
    
    // 最近 7 天调用趋势
    let recentLogs;
    try {
      recentLogs = await queryAll(
        `SELECT DATE(created_at) as date, COUNT(*) as count 
         FROM api_logs 
         WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) 
         GROUP BY DATE(created_at) 
         ORDER BY date ASC`
      );
    } catch (e) {
      recentLogs = await queryAll(
        `SELECT strftime('%Y-%m-%d', created_at) as date, COUNT(*) as count 
         FROM api_logs 
         WHERE created_at >= date('now', '-7 days') 
         GROUP BY strftime('%Y-%m-%d', created_at) 
         ORDER BY date ASC`
      );
    }

    // 状态码占比分布
    const statusCodeLogs = await queryAll(
      `SELECT status_code, COUNT(*) as count FROM api_logs GROUP BY status_code`
    );

    // Top 5 常用 API Key 榜单
    const topKeys = await queryAll(
      `SELECT user_name, api_key, used_quota FROM api_keys ORDER BY used_quota DESC LIMIT 5`
    );

    return res.json({
      code: 200,
      msg: 'ok',
      data: {
        total_keys: totalKeysObj ? (totalKeysObj.cnt || 0) : 0,
        active_keys: activeKeysObj ? (activeKeysObj.cnt || 0) : 0,
        total_calls: totalCallsObj ? (parseInt(totalCallsObj.cnt, 10) || 0) : 0,
        today_calls: todayCallsObj ? (todayCallsObj.cnt || 0) : 0,
        chart_7d: recentLogs || [],
        status_codes: statusCodeLogs || [],
        top_keys: topKeys || []
      },
    });
  } catch (err) {
    console.error('获取统计数据失败:', err);
    return res.status(500).json({ code: 500, msg: '获取统计失败', error: err.message });
  }
});

// 3. API Key 列表查询（分页 + 模糊搜索）
router.get('/keys', adminAuth, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.page_size || '20', 10)));
    const offset = (page - 1) * pageSize;
    const keyword = (req.query.keyword || '').trim();

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (keyword) {
      whereClause += ' AND (api_key LIKE ? OR user_name LIKE ? OR note LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
    }

    const totalObj = await queryOne(`SELECT COUNT(*) as cnt FROM api_keys ${whereClause}`, params);
    const list = await queryAll(
      `SELECT id, api_key, user_name, status, total_quota, used_quota, qps_limit, expire_time, note, created_at, updated_at
       FROM api_keys ${whereClause} ORDER BY id DESC LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    );

    const now = Date.now();
    const formattedList = list.map((item) => {
      const isExpired = item.expire_time ? new Date(item.expire_time).getTime() < now : false;
      const remainingQuota = item.total_quota === -1 ? -1 : Math.max(0, item.total_quota - item.used_quota);
      return {
        ...item,
        remaining_quota: remainingQuota,
        is_expired: isExpired,
      };
    });

    return res.json({
      code: 200,
      msg: 'ok',
      data: {
        total: totalObj.cnt || 0,
        page,
        page_size: pageSize,
        list: formattedList,
      },
    });
  } catch (err) {
    console.error('获取 Key 列表失败:', err);
    return res.status(500).json({ code: 500, msg: '获取 Key 列表失败' });
  }
});

// 4. 创建新的 API Key
router.post('/keys', adminAuth, async (req, res) => {
  try {
    const { user_name, total_quota = 10000, expire_days = 0, note = '', qps_limit = 10 } = req.body;

    if (!user_name || !user_name.trim()) {
      return res.status(400).json({ code: 400, msg: '买家姓名/联系方式不能为空' });
    }

    // 生成随机 40 位 API Key (sk_xxx)
    const apiKey = 'sk_' + crypto.randomBytes(20).toString('hex');
    let expireTime = null;

    if (parseInt(expire_days, 10) > 0) {
      const d = new Date();
      d.setDate(d.getDate() + parseInt(expire_days, 10));
      expireTime = d.toISOString().slice(0, 19).replace('T', ' ');
    }

    await execute(
      `INSERT INTO api_keys (api_key, user_name, status, total_quota, used_quota, qps_limit, expire_time, note)
       VALUES (?, ?, 1, ?, 0, ?, ?, ?)`,
      [apiKey, user_name.trim(), parseInt(total_quota, 10), parseInt(qps_limit, 10), expireTime, note.trim()]
    );

    return res.json({
      code: 200,
      msg: 'API Key 创建成功',
      data: {
        api_key: apiKey,
        user_name,
        total_quota,
        expire_time: expireTime,
      },
    });
  } catch (err) {
    console.error('创建 Key 失败:', err);
    return res.status(500).json({ code: 500, msg: '创建 Key 失败', error: err.message });
  }
});

// 5. 更新 API Key (续费/禁用/加额度/改备注)
router.put('/keys/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { add_quota, expire_days, status, note, qps_limit } = req.body;

    const keyRow = await queryOne('SELECT * FROM api_keys WHERE id = ?', [id]);
    if (!keyRow) {
      return res.status(404).json({ code: 404, msg: 'Key 不存在' });
    }

    const sets = [];
    const params = [];

    if (add_quota !== undefined && add_quota !== null && add_quota !== '') {
      sets.push('total_quota = total_quota + ?');
      params.push(parseInt(add_quota, 10));
    }

    if (expire_days !== undefined && expire_days !== null && expire_days !== '') {
      const days = parseInt(expire_days, 10);
      if (days === 0) {
        sets.push('expire_time = NULL');
      } else {
        const base = keyRow.expire_time && new Date(keyRow.expire_time).getTime() > Date.now()
          ? new Date(keyRow.expire_time)
          : new Date();
        base.setDate(base.getDate() + days);
        sets.push('expire_time = ?');
        params.push(base.toISOString().slice(0, 19).replace('T', ' '));
      }
    }

    if (status !== undefined) {
      sets.push('status = ?');
      params.push(parseInt(status, 10) === 1 ? 1 : 0);
    }

    if (note !== undefined) {
      sets.push('note = ?');
      params.push(note.trim());
    }

    if (qps_limit !== undefined) {
      sets.push('qps_limit = ?');
      params.push(Math.max(1, parseInt(qps_limit, 10)));
    }

    if (sets.length === 0) {
      return res.status(400).json({ code: 400, msg: '没有提供需要更新的参数' });
    }

    params.push(id);
    await execute(`UPDATE api_keys SET ${sets.join(', ')} WHERE id = ?`, params);

    return res.json({ code: 200, msg: '更新成功' });
  } catch (err) {
    console.error('更新 Key 失败:', err);
    return res.status(500).json({ code: 500, msg: '更新 Key 失败' });
  }
});

// 6. 删除 API Key
router.delete('/keys/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    await execute('DELETE FROM api_keys WHERE id = ?', [id]);
    return res.json({ code: 200, msg: '删除成功' });
  } catch (err) {
    console.error('删除 Key 失败:', err);
    return res.status(500).json({ code: 500, msg: '删除失败' });
  }
});

// 7. 查询接口调用日志
router.get('/logs', adminAuth, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.page_size || '20', 10)));
    const offset = (page - 1) * pageSize;
    const apiKey = (req.query.api_key || '').trim();

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (apiKey) {
      whereClause += ' AND api_key = ?';
      params.push(apiKey);
    }

    const totalObj = await queryOne(`SELECT COUNT(*) as cnt FROM api_logs ${whereClause}`, params);
    const list = await queryAll(
      `SELECT * FROM api_logs ${whereClause} ORDER BY id DESC LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    );

    return res.json({
      code: 200,
      msg: 'ok',
      data: {
        total: totalObj.cnt || 0,
        page,
        page_size: pageSize,
        list,
      },
    });
  } catch (err) {
    console.error('获取日志失败:', err);
    return res.status(500).json({ code: 500, msg: '获取日志失败' });
  }
});

// 8. 管理员查询所有售卖商城订单
router.get('/orders', adminAuth, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.page_size || '20', 10)));
    const offset = (page - 1) * pageSize;
    const keyword = (req.query.keyword || '').trim();

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (keyword) {
      whereClause += ' AND (order_no LIKE ? OR user_name LIKE ? OR api_key LIKE ? OR package_name LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
    }

    const totalObj = await queryOne(`SELECT COUNT(*) as cnt FROM orders ${whereClause}`, params);
    const list = await queryAll(
      `SELECT * FROM orders ${whereClause} ORDER BY id DESC LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
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

    return res.json({
      code: 200,
      msg: 'ok',
      data: {
        total: totalObj.cnt || 0,
        page,
        page_size: pageSize,
        list: formattedList,
      },
    });
  } catch (err) {
    console.error('获取订单列表失败:', err);
    return res.status(500).json({ code: 500, msg: '获取订单列表失败' });
  }
});

// 9. 管理员查询所有售卖商城注册用户
router.get('/store-users', adminAuth, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.page_size || '20', 10)));
    const offset = (page - 1) * pageSize;
    const keyword = (req.query.keyword || '').trim();

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (keyword) {
      whereClause += ' AND (username LIKE ? OR email LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`);
    }

    const totalObj = await queryOne(`SELECT COUNT(*) as cnt FROM store_users ${whereClause}`, params);
    const list = await queryAll(
      `SELECT id, username, email, created_at FROM store_users ${whereClause} ORDER BY id DESC LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
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

    return res.json({
      code: 200,
      msg: 'ok',
      data: {
        total: totalObj.cnt || 0,
        page,
        page_size: pageSize,
        list: formattedList,
      },
    });
  } catch (err) {
    console.error('获取售卖用户列表失败:', err);
    return res.status(500).json({ code: 500, msg: '获取用户列表失败' });
  }
});

// 支付宝配置：读取（私钥脱敏）
router.get('/alipay-config', adminAuth, async (req, res) => {
  try {
    const row = await queryOne("SELECT config_value FROM system_config WHERE config_key = 'alipay_config'", []);
    if (!row) {
      return res.json({ code: 200, msg: 'ok', data: null });
    }
    const cfg = JSON.parse(row.config_value);
    // 脱敏私钥
    const masked = {
      ...cfg,
      privateKey: cfg.privateKey ? '******（已配置，保存时重新填写才会更新）' : '',
      alipayPublicKey: cfg.alipayPublicKey ? '******（已配置）' : '',
    };
    return res.json({ code: 200, msg: 'ok', data: masked, configured: true });
  } catch (err) {
    return res.status(500).json({ code: 500, msg: '读取配置失败' });
  }
});

// 支付宝配置：保存
router.post('/alipay-config', adminAuth, async (req, res) => {
  try {
    const { appId, privateKey, alipayPublicKey, sandbox } = req.body;
    if (!appId || !privateKey || !alipayPublicKey) {
      return res.status(400).json({ code: 400, msg: 'appId、privateKey、alipayPublicKey 均为必填项' });
    }

    // 如果私钥是脱敏字符串，则读取旧配置中的真实值
    let finalPrivateKey = privateKey;
    let finalAlipayPublicKey = alipayPublicKey;
    if (privateKey.startsWith('******')) {
      const oldRow = await queryOne("SELECT config_value FROM system_config WHERE config_key = 'alipay_config'", []);
      if (oldRow) {
        const oldCfg = JSON.parse(oldRow.config_value);
        finalPrivateKey = oldCfg.privateKey || privateKey;
      }
    }
    if (alipayPublicKey.startsWith('******')) {
      const oldRow = await queryOne("SELECT config_value FROM system_config WHERE config_key = 'alipay_config'", []);
      if (oldRow) {
        const oldCfg = JSON.parse(oldRow.config_value);
        finalAlipayPublicKey = oldCfg.alipayPublicKey || alipayPublicKey;
      }
    }

    const cfgJson = JSON.stringify({ appId, privateKey: finalPrivateKey, alipayPublicKey: finalAlipayPublicKey, sandbox: !!sandbox });
    await execute(
      "INSERT INTO system_config (config_key, config_value) VALUES ('alipay_config', ?) ON CONFLICT(config_key) DO UPDATE SET config_value = excluded.config_value, updated_at = DATETIME('now', 'localtime')",
      [cfgJson]
    );

    // 清除 SDK 实例缓存，使新配置立即生效
    const { clearAlipayCache } = await import('../utils/alipayInstance.js');
    clearAlipayCache();

    return res.json({ code: 200, msg: '支付宝配置已保存并生效' });
  } catch (err) {
    console.error('保存支付宝配置失败:', err);
    return res.status(500).json({ code: 500, msg: '保存失败: ' + err.message });
  }
});

// 邮箱配置：读取（授权码脱敏）
router.get('/email-config', adminAuth, async (req, res) => {
  try {
    const row = await queryOne("SELECT config_value FROM system_config WHERE config_key = 'email_config'", []);
    if (!row) {
      return res.json({ code: 200, msg: 'ok', data: null, configured: false });
    }
    const cfg = JSON.parse(row.config_value);
    const masked = {
      qqNumber: cfg.qqNumber || '',
      authCode: cfg.authCode ? '******' : ''
    };
    return res.json({ code: 200, msg: 'ok', data: masked, configured: true });
  } catch (err) {
    return res.status(500).json({ code: 500, msg: '读取邮箱配置失败' });
  }
});

// 邮箱配置：保存
router.post('/email-config', adminAuth, async (req, res) => {
  try {
    const { qqNumber, authCode } = req.body;
    if (!qqNumber) {
      return res.status(400).json({ code: 400, msg: 'QQ 号码不能为空' });
    }

    let finalAuthCode = authCode;
    if (authCode.startsWith('******')) {
      const oldRow = await queryOne("SELECT config_value FROM system_config WHERE config_key = 'email_config'", []);
      if (oldRow) {
        const oldCfg = JSON.parse(oldRow.config_value);
        finalAuthCode = oldCfg.authCode || authCode;
      }
    }

    const cfgJson = JSON.stringify({ qqNumber: qqNumber.trim(), authCode: finalAuthCode.trim() });
    await execute(
      "INSERT INTO system_config (config_key, config_value) VALUES ('email_config', ?) ON CONFLICT(config_key) DO UPDATE SET config_value = excluded.config_value, updated_at = DATETIME('now', 'localtime')",
      [cfgJson]
    );

    return res.json({ code: 200, msg: 'QQ 邮箱配置已保存' });
  } catch (err) {
    console.error('保存邮箱配置失败:', err);
    return res.status(500).json({ code: 500, msg: '保存失败: ' + err.message });
  }
});

// 邮箱配置：测试发送邮件
router.post('/email-test', adminAuth, async (req, res) => {
  try {
    const { targetEmail } = req.body;
    if (!targetEmail) {
      return res.status(400).json({ code: 400, msg: '请输入收件人邮箱' });
    }
    const { sendVerificationCode } = await import('../utils/mailer.js');
    const result = await sendVerificationCode(targetEmail.trim());
    return res.json({ code: 200, msg: result.message || '测试邮件发送成功！' });
  } catch (err) {
    console.error('发送测试邮件失败:', err);
    return res.status(500).json({ code: 500, msg: '发送失败: ' + err.message });
  }
});

export default router;
