import express from 'express';
import axios from 'axios';
import { config } from '../config.js';
import { extractUrl } from '../utils/urlExtractor.js';
import { authenticateKey, logApiCall } from '../middlewares/auth.js';

const router = express.Router();

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
