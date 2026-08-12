import express from 'express';
import axios from 'axios';

const router = express.Router();

/**
 * 根据目标 URL 域名推断合适的 Referer/User-Agent
 * 避免把抖音 Referer 发给视频号/B站等导致 400/403
 */
function getHeadersForUrl(targetUrl) {
  const mobileUA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1';
  const pcUA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

  try {
    const u = new URL(targetUrl);
    const host = u.hostname;

    // 视频号 (WeChat Channel)
    if (host.includes('finder.video.qq.com') || host.includes('qq.com')) {
      return {
        'User-Agent': pcUA,
        'Referer': 'https://channels.weixin.qq.com/',
        'Accept': '*/*',
        'Accept-Language': 'zh-CN,zh;q=0.9',
      };
    }

    // 小红书
    if (host.includes('xhscdn.com') || host.includes('xiaohongshu.com') || host.includes('xhscdn.net')) {
      return {
        'User-Agent': mobileUA,
        'Referer': 'https://www.xiaohongshu.com/',
        'Accept': '*/*',
        'Accept-Language': 'zh-CN,zh;q=0.9',
      };
    }

    // B站
    if (host.includes('bilibili.com') || host.includes('bilivideo.com') || host.includes('akamaized.net')) {
      return {
        'User-Agent': pcUA,
        'Referer': 'https://www.bilibili.com/',
        'Accept': '*/*',
        'Accept-Language': 'zh-CN,zh;q=0.9',
      };
    }

    // 快手
    if (host.includes('kwimgs.com') || host.includes('yximgs.com') || host.includes('ndcimgs.com') || host.includes('kuaishou.com')) {
      return {
        'User-Agent': mobileUA,
        'Referer': 'https://www.kuaishou.com/',
        'Accept': '*/*',
        'Accept-Language': 'zh-CN,zh;q=0.9',
      };
    }

    // 抖音（默认）
    return {
      'User-Agent': mobileUA,
      'Referer': 'https://www.douyin.com/',
      'Accept': '*/*',
      'Accept-Language': 'zh-CN,zh;q=0.9',
    };
  } catch (e) {
    // URL 解析失败时用通用 UA
    return {
      'User-Agent': mobileUA,
      'Referer': '',
      'Accept': '*/*',
    };
  }
}

/**
 * GET /api/proxy
 * 视频/图片反向代理，根据域名自动设置正确 Referer，解决防盗链问题。
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

  // 基本安全校验：只允许 http/https
  if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
    return res.status(400).json({ code: 400, msg: '非法的目标 URL' });
  }

  const headers = getHeadersForUrl(targetUrl);
  const rangeHeader = req.headers['range'];
  if (rangeHeader) {
    headers['Range'] = rangeHeader;
  }

  try {
    const response = await axios({
      method: 'GET',
      url: targetUrl,
      responseType: 'stream',
      timeout: 30000,
      maxRedirects: 5,
      headers,
    });

    // 透传关键 header
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

    // 支持 206 Partial Content（视频 seek）
    res.status(response.status);
    res.setHeader('Access-Control-Allow-Origin', '*');

    response.data.pipe(res);

    response.data.on('error', (err) => {
      console.error('[proxy] 流式传输中断:', err.message);
      if (!res.headersSent) {
        res.status(500).json({ code: 500, msg: '代理流式传输错误' });
      }
    });

  } catch (err) {
    const status = err.response?.status || 500;
    console.error(`[proxy] 代理失败 [${status}]:`, err.message, '\n目标:', targetUrl.substring(0, 120) + '...');
    if (!res.headersSent) {
      res.status(status).json({
        code: status,
        msg: `代理失败: ${err.message}`,
        target_domain: (() => { try { return new URL(targetUrl).hostname; } catch(e) { return ''; } })()
      });
    }
  }
});

export default router;
