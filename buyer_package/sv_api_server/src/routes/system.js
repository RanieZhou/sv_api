import express from 'express';
import axios from 'axios';
import { config } from '../config.js';
import { queryOne, execute } from '../db.js';

const router = express.Router();

// Helper: 获取/保存 JSON 配置
async function getConfig(key, defaultVal = {}) {
  const row = await queryOne('SELECT config_value FROM system_config WHERE config_key = ?', [key]);
  if (!row || !row.config_value) return defaultVal;
  try {
    return JSON.parse(row.config_value);
  } catch (e) {
    return defaultVal;
  }
}

async function saveConfig(key, val) {
  const valStr = JSON.stringify(val);
  const existing = await queryOne('SELECT config_key FROM system_config WHERE config_key = ?', [key]);
  if (existing) {
    await execute('UPDATE system_config SET config_value = ? WHERE config_key = ?', [valStr, key]);
  } else {
    await execute('INSERT INTO system_config (config_key, config_value) VALUES (?, ?)', [key, valStr]);
  }
}

// 1. 小程序基本设置
router.get('/system/miniprogram-config', async (req, res) => {
  try {
    const data = await getConfig('miniprogram', {
      appName: '短视频聚合解析',
      appId: '',
      appSecret: '',
      noticeText: '欢迎使用短视频无水印解析工具！',
      noticeEnabled: true
    });
    return res.json({ code: 200, success: true, data });
  } catch (err) {
    console.error('获取小程序设置失败:', err);
    return res.status(500).json({ code: 500, success: false, message: '获取小程序设置失败' });
  }
});

router.post('/system/miniprogram-config', async (req, res) => {
  try {
    await saveConfig('miniprogram', req.body);
    return res.json({ code: 200, success: true, message: '保存小程序设置成功' });
  } catch (err) {
    console.error('保存小程序设置失败:', err);
    return res.status(500).json({ code: 500, success: false, message: '保存小程序设置失败' });
  }
});

// 2. 接口设置（API Key 配置）
const handleGetApiKeyConfig = async (req, res) => {
  try {
    const data = await getConfig('apikey', {
      api_key: ''
    });
    return res.json({ code: 200, success: true, data });
  } catch (err) {
    console.error('获取接口配置失败:', err);
    return res.status(500).json({ code: 500, success: false, message: '获取接口配置失败' });
  }
};

const handleSaveApiKeyConfig = async (req, res) => {
  try {
    await saveConfig('apikey', req.body);
    return res.json({ code: 200, success: true, message: '保存接口配置成功' });
  } catch (err) {
    console.error('保存接口配置失败:', err);
    return res.status(500).json({ code: 500, success: false, message: '保存接口配置失败' });
  }
};

// 校验 API Key 有效性并返回额度与到期时间 (买家服务端转发给总站网关进行真实校验)
router.get('/apiKey/verify', async (req, res) => {
  try {
    const key = (req.query.api_key || req.query.apiKey || '').trim();
    if (!key) {
      return res.json({
        code: 200,
        success: true,
        valid: false,
        message: '未输入 API Key'
      });
    }

    // 动态构造总站 verify 校验接口地址
    const masterVerifyUrl = new URL('/api/apiKey/verify', config.upstreamUrl).href;

    const response = await axios.get(masterVerifyUrl, {
      params: { apiKey: key, api_key: key },
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    return res.json(response.data);
  } catch (err) {
    console.error('向总站校验 API Key 失败:', err.message);
    const errData = err.response ? err.response.data : null;
    if (errData) {
      return res.json(errData);
    }
    return res.status(500).json({
      code: 500,
      success: false,
      message: '无法连接总站网关进行密钥校验: ' + err.message
    });
  }
});

router.get('/apiKey/config', handleGetApiKeyConfig);
router.post('/apiKey/config', handleSaveApiKeyConfig);
router.get('/system/apikey-config', handleGetApiKeyConfig);
router.post('/system/apikey-config', handleSaveApiKeyConfig);
router.get('/system/interface-config', handleGetApiKeyConfig);
router.post('/system/interface-config', handleSaveApiKeyConfig);
router.get('/interface-config', handleGetApiKeyConfig);
router.post('/interface-config', handleSaveApiKeyConfig);

// 3. 流量主/广告设置
router.get('/system/ad-config', async (req, res) => {
  try {
    const data = await getConfig('ad', {
      adEnabled: true,
      toolPageAdId: '',
      interstitialAdId: '',
      rewardedAdId: '',
      videoAdId: '',
      nativeAdId: ''
    });
    return res.json({ code: 200, success: true, data });
  } catch (err) {
    console.error('获取流量主设置失败:', err);
    return res.status(500).json({ code: 500, success: false, message: '获取流量主设置失败' });
  }
});

router.post('/system/ad-config', async (req, res) => {
  try {
    await saveConfig('ad', req.body);
    return res.json({ code: 200, success: true, message: '保存流量主设置成功' });
  } catch (err) {
    console.error('保存流量主设置失败:', err);
    return res.status(500).json({ code: 500, success: false, message: '保存流量主设置失败' });
  }
});

export default router;
