import { queryOne, execute } from '../db.js';

/**
 * 校验 API Key 中间件
 */
export async function authenticateKey(req, res, next) {
  try {
    // 1. 尝试从 Header 或 Query/Body 参数中获取 api_key
    let apiKey =
      req.headers['x-api-key'] ||
      (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')
        ? req.headers.authorization.slice(7)
        : null) ||
      req.query.api_key ||
      req.body?.api_key;

    // 2. 严格模式：未显式传递 Key，直接拒绝访问
    if (!apiKey || typeof apiKey !== 'string' || !apiKey.trim()) {
      return res.status(401).json({
        code: 401,
        msg: '未经授权：缺少 api_key 参数，请在请求中传入有效的 API Key 密钥',
        data: null,
      });
    }

    apiKey = apiKey.trim();

    // 3. 校验 Key 是否存在于数据库
    const keyInfo = await queryOne(
      'SELECT * FROM api_keys WHERE api_key = ? LIMIT 1',
      [apiKey]
    );

    if (!keyInfo) {
      return res.status(403).json({
        code: 403,
        msg: '接口密钥配置错误或无效，请管理员在后台【接口设置】中检查 API Key',
        data: null,
      });
    }

    if (keyInfo.status !== 1) {
      return res.status(403).json({
        code: 403,
        msg: '接口密钥已被禁用，请在后台启用或更换新的 API Key',
        data: null,
      });
    }

    // 4. 校验到期时间
    if (keyInfo.expire_time) {
      const expireTs = new Date(keyInfo.expire_time).getTime();
      if (expireTs < Date.now()) {
        return res.status(403).json({
          code: 403,
          msg: '接口密钥已过期，请在后台更新密钥或续费',
          data: null,
        });
      }
    }

    // 5. 校验额度 (-1 为无限)
    if (keyInfo.total_quota !== -1 && keyInfo.used_quota >= keyInfo.total_quota) {
      return res.status(429).json({
        code: 429,
        msg: '接口密钥调用次数已耗尽，请联系管理员充值',
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
