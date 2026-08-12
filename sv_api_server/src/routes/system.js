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

// 校验 API Key 有效性并返回额度与到期时间
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

    const row = await queryOne(
      'SELECT api_key, user_name, status, total_quota, used_quota, expire_time FROM api_keys WHERE api_key = ?',
      [key]
    );

    if (!row) {
      return res.json({
        code: 200,
        success: true,
        valid: false,
        message: 'API Key 不存在，请检查输入'
      });
    }

    if (row.status !== 1) {
      return res.json({
        code: 200,
        success: true,
        valid: false,
        message: 'API Key 已被禁用'
      });
    }

    if (row.expire_time && new Date(row.expire_time) < new Date()) {
      return res.json({
        code: 200,
        success: true,
        valid: false,
        message: 'API Key 已过期'
      });
    }

    const remainingCalls = row.total_quota === -1
      ? '不限次数'
      : `${Math.max(0, row.total_quota - row.used_quota)} 次`;

    let expiryDate = '永不过期';
    if (row.expire_time) {
      let s = typeof row.expire_time === 'string' ? row.expire_time.trim() : (row.expire_time.toISOString ? row.expire_time.toISOString() : String(row.expire_time));
      if (/^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}$/.test(s)) {
        s = s.replace(' ', 'T') + 'Z';
      }
      const d = new Date(s);
      if (!isNaN(d.getTime())) {
        expiryDate = d.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', hour12: false });
      }
    }

    return res.json({
      code: 200,
      success: true,
      valid: true,
      message: '密钥有效',
      data: {
        apiKey: row.api_key,
        userName: row.user_name,
        remainingCalls,
        expiryDate,
        totalQuota: row.total_quota,
        usedQuota: row.used_quota
      }
    });
  } catch (err) {
    console.error('校验 API Key 失败:', err);
    return res.status(500).json({ code: 500, success: false, message: '校验 API Key 失败' });
  }
});

router.get('/apiKey/config', handleGetApiKeyConfig);
router.post('/apiKey/config', handleSaveApiKeyConfig);
router.get('/system/apikey-config', handleGetApiKeyConfig);
router.post('/system/apikey-config', handleSaveApiKeyConfig);

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
