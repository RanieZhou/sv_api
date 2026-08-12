import axios from 'axios';
import { queryOne } from '../db.js';

let cachedAccessToken = null;
let tokenExpireTime = 0;

/**
 * 获取微信 Access Token
 */
async function getWeChatAccessToken() {
  const now = Date.now();
  if (cachedAccessToken && now < tokenExpireTime) {
    return cachedAccessToken;
  }

  try {
    const row = await queryOne("SELECT config_value FROM system_config WHERE config_key = 'miniprogram'", []);
    if (!row || !row.config_value) return null;
    const cfg = JSON.parse(row.config_value);

    if (!cfg.appId || !cfg.appSecret) {
      console.warn('[secCheck] 小程序 appId 或 appSecret 未配置，跳过微信官方 msgSecCheck 校验');
      return null;
    }

    const res = await axios.get('https://api.weixin.qq.com/cgi-bin/token', {
      params: {
        grant_type: 'client_credential',
        appid: cfg.appId.trim(),
        secret: cfg.appSecret.trim()
      },
      timeout: 8000
    });

    if (res.data && res.data.access_token) {
      cachedAccessToken = res.data.access_token;
      tokenExpireTime = now + (res.data.expires_in - 300) * 1000;
      return cachedAccessToken;
    } else {
      console.error('[secCheck] 获取微信 access_token 失败:', res.data);
      return null;
    }
  } catch (err) {
    console.error('[secCheck] 请求微信 access_token 异常:', err.message);
    return null;
  }
}

/**
 * 微信 msgSecCheck 内容安全检查
 * @param {string} text 待检测文本
 * @returns {Promise<{pass: boolean, errcode: number, errmsg: string, detail?: any}>}
 */
export async function checkMsgSecurity(text = '') {
  const content = (text || '').trim();
  if (!content) {
    return { pass: true, errcode: 0, errmsg: 'ok' };
  }

  const token = await getWeChatAccessToken();

  if (token) {
    try {
      const res = await axios.post(
        `https://api.weixin.qq.com/wxa/msg_sec_check?access_token=${token}`,
        { content, version: 2, scene: 1 },
        { timeout: 8000 }
      );

      console.log('[secCheck] 微信 msgSecCheck 检查响应:', JSON.stringify(res.data));

      const result = res.data?.result || {};
      const errcode = res.data?.errcode ?? 0;
      const errmsg = res.data?.errmsg || 'ok';

      if (errcode === 0 && (!result.suggest || result.suggest === 'pass')) {
        return { pass: true, errcode: 0, errmsg: 'ok', detail: res.data };
      } else {
        return {
          pass: false,
          errcode: errcode || 87014,
          errmsg: errmsg || '内容含有违规敏感信息',
          detail: res.data
        };
      }
    } catch (err) {
      console.error('[secCheck] 调用微信 msgSecCheck 异常:', err.message);
      return { pass: true, errcode: 0, errmsg: 'ok', fallback: true };
    }
  }

  // 默认格式，符合微信规范指示
  return {
    pass: true,
    errcode: 0,
    errmsg: 'ok'
  };
}
