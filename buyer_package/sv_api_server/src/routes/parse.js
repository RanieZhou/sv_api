import express from 'express';
import axios from 'axios';
import { config } from '../config.js';
import { queryOne } from '../db.js';
import { extractUrl } from '../utils/urlExtractor.js';
import { logApiCall } from '../middlewares/auth.js';
import { checkMsgSecurity } from '../utils/secCheck.js';

const router = express.Router();

// 微信内容安全校验对外公开接口
router.all('/sec-check', async (req, res) => {
  const text = req.query.text || req.body?.text || '测试链接';
  const openid = req.query.openid || req.body?.openid || '';
  const sec = await checkMsgSecurity(text, openid);
  return res.json({
    code: 200,
    success: sec.pass,
    errcode: sec.errcode,
    errmsg: sec.errmsg,
    msg: sec.pass ? '内容安全检查通过' : '内容包含违规词汇',
    detail: sec.detail || null
  });
});

async function handleParseRequest(req, res) {
  const startTime = Date.now();
  const rawInput = req.query.url || req.body?.url || '';

  if (!rawInput) {
    return res.status(400).json({
      code: 400,
      msg: '缺少 url 参数，请传入待解析的视频链接或分享文本',
      data: null,
    });
  }

  // 微信内容安全校验 msgSecCheck
  const secCheckRes = await checkMsgSecurity(rawInput);
  if (!secCheckRes.pass) {
    return res.status(400).json({
      code: 400,
      msg: '内容安全检查未通过：输入文本包含违法违规或敏感信息',
      errcode: secCheckRes.errcode,
      errmsg: secCheckRes.errmsg,
      data: null
    });
  }

  // 从分享文本中正则提取 URL
  const targetUrl = extractUrl(rawInput);
  const clientIp = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;

  // 获取站长在后台配置的 API Key
  let apiKey = req.query.api_key || req.body?.api_key || req.headers['x-api-key'] || '';
  if (!apiKey) {
    try {
      const cfgRow = await queryOne("SELECT config_value FROM system_config WHERE config_key = 'apikey'", []);
      if (cfgRow && cfgRow.config_value) {
        apiKey = cfgRow.config_value;
      }
    } catch (e) {}
  }

  if (!apiKey) {
    return res.status(401).json({
      code: 401,
      msg: '未传入 api_key：请站长登录后台【接口设置】配置向总站购买的授权 Key',
      data: null,
    });
  }

  try {
    // 防环保护：若 UPSTREAM_API_URL 误设为本买家域名，自动纠正为总站域名
    let targetUpstreamUrl = config.upstreamUrl || 'https://shortvideo.aihubzone.cn/api/parse';
    const currentReqHost = (req.get('host') || '').toLowerCase();
    if (currentReqHost && targetUpstreamUrl.toLowerCase().includes(currentReqHost)) {
      targetUpstreamUrl = 'https://shortvideo.aihubzone.cn/api/parse';
    }

    // 请求总站 API 解析服务 (传递 url 及站长 api_key)
    const response = await axios.get(targetUpstreamUrl, {
      params: { url: targetUrl, api_key: apiKey },
      timeout: config.upstreamUrlTimeout || 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
      },
    });

    const responseTimeMs = Date.now() - startTime;
    logApiCall(apiKey, targetUrl, clientIp, 200, responseTimeMs);

    const responseData = response.data;
    if (responseData && typeof responseData === 'object') {
      delete responseData.bktip;
    }

    return res.json(responseData);
  } catch (err) {
    const responseTimeMs = Date.now() - startTime;
    const statusCode = err.response ? err.response.status : 500;
    const errData = err.response ? err.response.data : null;
    logApiCall(apiKey, targetUrl, clientIp, statusCode, responseTimeMs);

    console.error('调用总站解析 API 出错:', err.message);
    if (errData) {
      return res.status(statusCode).json(errData);
    }
    return res.status(500).json({
      code: 500,
      msg: '解析失败：总站接口响应超时或报错',
      error: err.message,
    });
  }
}

// 路由挂载
router.get('/parse', handleParseRequest);
router.post('/parse', handleParseRequest);

router.get('/short_videos', handleParseRequest);
router.post('/short_videos', handleParseRequest);

export default router;
