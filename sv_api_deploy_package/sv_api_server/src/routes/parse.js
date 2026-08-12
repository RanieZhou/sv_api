import express from 'express';
import axios from 'axios';
import { config } from '../config.js';
import { extractUrl } from '../utils/urlExtractor.js';
import { authenticateKey, logApiCall } from '../middlewares/auth.js';
import { checkMsgSecurity } from '../utils/secCheck.js';

const router = express.Router();

// 微信内容安全校验对外公开接口 (支持浏览器/小程序直接测试)
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
  const rawInput = req.query.url || req.body.url || '';

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

  try {
    // 后台 cURL / Axios 请求上游 API
    const response = await axios.get(config.upstreamUrl, {
      params: { url: targetUrl },
      timeout: config.upstreamUrlTimeout || 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
      },
    });

    const responseTimeMs = Date.now() - startTime;
    logApiCall(req.apiKey, targetUrl, clientIp, 200, responseTimeMs);

    // 移除上游接口返回的版权标识 (bktip)
    const responseData = response.data;
    if (responseData && typeof responseData === 'object') {
      delete responseData.bktip;
    }

    return res.json(responseData);
  } catch (err) {
    const responseTimeMs = Date.now() - startTime;
    const statusCode = err.response ? err.response.status : 500;
    logApiCall(req.apiKey, targetUrl, clientIp, statusCode, responseTimeMs);

    console.error('调用上游解析 API 出错:', err.message);
    return res.status(500).json({
      code: 500,
      msg: '解析失败：上游接口响应超时或报错',
      error: err.message,
    });
  }
}

// 支持路由: /api/parse 和 /api/short_videos (防别名调错)
router.get('/parse', authenticateKey, handleParseRequest);
router.post('/parse', authenticateKey, handleParseRequest);

router.get('/short_videos', authenticateKey, handleParseRequest);
router.post('/short_videos', authenticateKey, handleParseRequest);

export default router;
