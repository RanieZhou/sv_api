import { queryOne, execute } from '../db.js';

/**
 * 校验 API Key 中间件
 */
export async function authenticateKey(req, res, next) {
  try {
    // 1. 尝试从 Header 或 Query 参数中获取 api_key
    const apiKey =
      req.headers['x-api-key'] ||
      (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')
        ? req.headers.authorization.slice(7)
        : null) ||
      req.query.api_key ||
      req.body.api_key;

    if (!apiKey) {
      return res.status(401).json({
        code: 401,
        msg: '缺少 API Key，请在 URL 参数中带上 ?api_key=xxx 或在 Header 中传入 X-API-Key',
        data: null,
      });
    }

    // 2. 校验 Key 是否存在于数据库
    const keyInfo = await queryOne(
      'SELECT * FROM api_keys WHERE api_key = ? LIMIT 1',
      [apiKey]
    );

    if (!keyInfo) {
      return res.status(403).json({
        code: 403,
        msg: 'API Key 无效',
        data: null,
      });
    }

    if (keyInfo.status !== 1) {
      return res.status(403).json({
        code: 403,
        msg: 'API Key 已被禁用，请联系服务提供方',
        data: null,
      });
    }

    // 3. 校验到期时间
    if (keyInfo.expire_time) {
      const expireTs = new Date(keyInfo.expire_time).getTime();
      if (expireTs < Date.now()) {
        return res.status(403).json({
          code: 403,
          msg: 'API Key 已过期，请联系管理员续费',
          data: null,
        });
      }
    }

    // 4. 校验额度 (-1 为无限)
    if (keyInfo.total_quota !== -1 && keyInfo.used_quota >= keyInfo.total_quota) {
      return res.status(429).json({
        code: 429,
        msg: '调用次数已耗尽（剩余 0 次），请联系管理员充值',
        data: null,
      });
    }

    // 5. 扣减次数
    await execute(
      'UPDATE api_keys SET used_quota = used_quota + 1, updated_at = NOW() WHERE api_key = ?',
      [apiKey]
    );

    req.keyInfo = keyInfo;
    req.apiKey = apiKey;
    next();
  } catch (err) {
    console.error('鉴权中间件异常:', err);
    return res.status(500).json({
      code: 500,
      msg: '服务器鉴权服务异常',
      data: null,
    });
  }
}

/**
 * 异步记录接口调用日志
 */
export async function logApiCall(apiKey, targetUrl, clientIp, statusCode, responseTimeMs) {
  try {
    await execute(
      `INSERT INTO api_logs (api_key, target_url, ip, status_code, response_time_ms, created_at)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [apiKey, (targetUrl || '').substring(0, 500), clientIp || '0.0.0.0', statusCode, responseTimeMs]
    );
  } catch (err) {
    console.error('记录 API 调用日志失败:', err);
  }
}
