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
    const todayCallsObj = await queryOne('SELECT COUNT(*) as cnt FROM api_logs WHERE created_at >= CURDATE()');
    
    // 最近 7 天调用排行
    const recentLogs = await queryAll(
      `SELECT DATE(created_at) as date, COUNT(*) as count 
       FROM api_logs 
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) 
       GROUP BY DATE(created_at) 
       ORDER BY date ASC`
    );

    return res.json({
      code: 200,
      msg: 'ok',
      data: {
        total_keys: totalKeysObj.cnt || 0,
        active_keys: activeKeysObj.cnt || 0,
        total_calls: parseInt(totalCallsObj.cnt, 10) || 0,
        today_calls: todayCallsObj.cnt || 0,
        chart_7d: recentLogs,
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

export default router;
