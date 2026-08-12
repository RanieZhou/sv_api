import express from 'express';
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
      api_key: 'sk_test_00000000000000000000000000000001'
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

router.get('/apiKey/config', handleGetApiKeyConfig);
router.post('/apiKey/config', handleSaveApiKeyConfig);
router.get('/system/apikey-config', handleGetApiKeyConfig);
router.post('/system/apikey-config', handleSaveApiKeyConfig);

// 3. 流量主/广告设置
router.get('/system/ad-config', async (req, res) => {
  try {
    const data = await getConfig('ad', {
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
