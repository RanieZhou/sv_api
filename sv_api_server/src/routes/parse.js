import express from 'express';
import axios from 'axios';
import { config } from '../config.js';
import { extractUrl } from '../utils/urlExtractor.js';
import { authenticateKey, logApiCall } from '../middlewares/auth.js';
import { checkMsgSecurity } from '../utils/secCheck.js';
import { isPhotosCompatibleVideoCodec, probeVideoCodec } from '../utils/videoCodec.js';

const router = express.Router();

const DOUYIN_HOST_PATTERN = /(^|\/\/)([^/]+\.)?(douyin\.com|iesdouyin\.com)(\/|$)/i;

function isDouyinUrl(url) {
  return DOUYIN_HOST_PATTERN.test(String(url || ''));
}

async function fetchUpstream(url, targetUrl) {
  const response = await axios.get(url, {
    params: { url: targetUrl },
    timeout: config.upstreamUrlTimeout || 15000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
    },
  });
  return response.data;
}

async function inspectVideoBackups(responseData) {
  const data = responseData && responseData.data;
  if (!data || String(data.type || '').toLowerCase() !== 'video') {
    return { responseData, probed: [], compatible: [], codecs: [] };
  }

  const backups = Array.isArray(data.video_backup) ? data.video_backup : [];
  const candidates = [
    ...(data.url ? [{
      url: data.url,
      quality: data.quality || '原画',
      label: data.quality || '原画',
      format: 'mp4',
      bit_rate: data.bit_rate || 0,
    }] : []),
    ...backups.filter((item) => item && item.url),
  ].filter((item, index, list) => (
    list.findIndex((candidate) => candidate.url === item.url) === index
  ));
  if (candidates.length === 0) {
    return { responseData, probed: [], compatible: [], codecs: [] };
  }

  const inspectCandidate = async (item) => {
    const probe = await probeVideoCodec(item.url);
    if (!probe) return item;
    return {
      ...item,
      codec: probe.codec,
      actual_codec: probe.codec,
    };
  };

  const first = await inspectCandidate(candidates[0]);
  if (first.actual_codec && isPhotosCompatibleVideoCodec(first.actual_codec)) {
    return {
      responseData,
      inspected: [first],
      probed: [first],
      compatible: [first],
      codecs: [first.actual_codec],
    };
  }

  const inspected = [first, ...(await Promise.all(candidates.slice(1).map(inspectCandidate)))];

  const probed = inspected.filter((item) => item.actual_codec);
  const compatible = probed.filter((item) => isPhotosCompatibleVideoCodec(item.actual_codec));
  const codecs = [...new Set(probed.map((item) => item.actual_codec))];
  return { responseData, inspected, probed, compatible, codecs };
}

function useCompatibleVideos(responseData, compatible) {
  const data = responseData.data || {};
  const primary = compatible[0];
  return {
    ...responseData,
    data: {
      ...data,
      url: primary?.url || data.url,
      video_codec: primary?.actual_codec || primary?.codec || data.video_codec,
      video_backup: compatible,
    },
  };
}

function unsupportedVideoResponse(codecs) {
  const codecText = codecs.length > 0 ? codecs.join(', ') : '未知';
  return {
    code: 422,
    msg: '该视频当前没有兼容手机相册的 H.264/HEVC 视频流',
    error_code: 'UNSUPPORTED_VIDEO_CODEC',
    detail: '检测到视频编码：' + codecText,
    data: null,
  };
}

async function normalizeDouyinVideo(responseData, targetUrl) {
  if (!isDouyinUrl(targetUrl)) return { responseData };

  try {
    const primaryReport = await inspectVideoBackups(responseData);
    if (primaryReport.compatible.length > 0) {
      return { responseData: useCompatibleVideos(responseData, primaryReport.compatible) };
    }

    if (config.douyinUpstreamUrl) {
      try {
        const fallbackData = await fetchUpstream(config.douyinUpstreamUrl, targetUrl);
        const fallbackReport = await inspectVideoBackups(fallbackData);
        if (fallbackReport.compatible.length > 0) {
          return { responseData: useCompatibleVideos(fallbackData, fallbackReport.compatible) };
        }
      } catch (e) {}
    }
  } catch (err) {
    console.warn('[normalizeDouyinVideo] 探针检测异常:', err.message);
  }

  // 兜底：即使未探测到纯 h264 视频流，也直接返回上游原始视频，绝不返回 422 拦截报错
  return { responseData };
}

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
    const responseData = await fetchUpstream(config.upstreamUrl, targetUrl);
    const normalized = await normalizeDouyinVideo(responseData, targetUrl);

    const responseTimeMs = Date.now() - startTime;
    if (normalized.unsupported) {
      logApiCall(req.apiKey, targetUrl, clientIp, 422, responseTimeMs);
      return res.status(422).json(normalized.body);
    }
    logApiCall(req.apiKey, targetUrl, clientIp, 200, responseTimeMs);

    // 移除上游接口返回的版权标识 (bktip)
    const outputData = normalized.responseData || responseData;
    if (outputData && typeof outputData === 'object') {
      delete outputData.bktip;
    }

    return res.json(outputData);
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
