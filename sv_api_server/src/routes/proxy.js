import express from 'express';
import axios from 'axios';

const router = express.Router();

/**
 * GET /api/proxy
 * 视频/图片反向代理接口，解决微信小程序播放抖音视频 ERR_FAILED / 403 防盗链问题。
 * 参数: ?url=<编码后的原始视频直链>
 */
router.get('/proxy', async (req, res) => {
  const rawUrl = req.query.url;
  if (!rawUrl) {
    return res.status(400).json({ code: 400, msg: '缺少 url 参数' });
  }

  let targetUrl;
  try {
    targetUrl = decodeURIComponent(rawUrl);
  } catch (e) {
    targetUrl = rawUrl;
  }

  try {
    const response = await axios({
      method: 'GET',
      url: targetUrl,
      responseType: 'stream',
      timeout: 30000,
      headers: {
        // 伪装成移动端浏览器，绕过防盗链
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
        'Referer': 'https://www.douyin.com/',
        'Accept': '*/*',
        'Accept-Language': 'zh-CN,zh;q=0.9',
        'Range': req.headers['range'] || '',
      },
    });

    // 透传关键 header：Content-Type, Content-Length, Content-Range, Accept-Ranges
    const headersToForward = [
      'content-type',
      'content-length',
      'content-range',
      'accept-ranges',
      'last-modified',
    ];
    headersToForward.forEach(key => {
      if (response.headers[key]) {
        res.setHeader(key, response.headers[key]);
      }
    });

    // 透传 HTTP 状态码（支持 206 Partial Content 以允许视频 seek）
    res.status(response.status);

    // 允许跨域（小程序本地开发测试用）
    res.setHeader('Access-Control-Allow-Origin', '*');

    // 管道转发响应流
    response.data.pipe(res);

    response.data.on('error', (err) => {
      console.error('[proxy] 流式传输中断:', err.message);
      if (!res.headersSent) {
        res.status(500).json({ code: 500, msg: '代理流式传输错误' });
      }
    });
  } catch (err) {
    console.error('[proxy] 代理请求失败:', err.message, '目标:', targetUrl);
    if (!res.headersSent) {
      const status = err.response?.status || 500;
      res.status(status).json({
        code: status,
        msg: `代理失败: ${err.message}`,
      });
    }
  }
});

export default router;
