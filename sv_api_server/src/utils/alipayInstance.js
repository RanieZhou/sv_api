/**
 * 支付宝 SDK 实例管理
 * 从 system_config 表中读取配置并初始化 AlipaySdk 实例
 * 每次调用 getAlipayInstance() 都会读取最新配置，确保管理后台更新配置后即时生效
 */
import { AlipaySdk } from 'alipay-sdk';
import { queryOne } from '../db.js';

let cachedConfig = null;
let cachedSdk = null;

async function loadAlipayConfig() {
  try {
    const row = await queryOne("SELECT config_value FROM system_config WHERE config_key = 'alipay_config'", []);
    if (!row) return null;
    return JSON.parse(row.config_value);
  } catch (e) {
    console.error('[AlipayInstance] 读取支付宝配置失败:', e.message);
    return null;
  }
}

/**
 * 获取支付宝 SDK 实例
 * @returns {Promise<AlipaySdk|null>}
 */
export async function getAlipayInstance() {
  const cfg = await loadAlipayConfig();
  if (!cfg || !cfg.appId || !cfg.privateKey || !cfg.alipayPublicKey) {
    console.warn('[AlipayInstance] 支付宝配置不完整，跳过初始化');
    return null;
  }

  // 配置无变化时复用缓存实例
  const cfgStr = JSON.stringify(cfg);
  if (cachedConfig === cfgStr && cachedSdk) {
    return cachedSdk;
  }

  const isSandbox = cfg.sandbox === true || cfg.sandbox === 'true';

  cachedSdk = new AlipaySdk({
    appId: cfg.appId,
    privateKey: cfg.privateKey,
    alipayPublicKey: cfg.alipayPublicKey,
    gateway: isSandbox
      ? 'https://openapi-sandbox.dl.alipaydev.com/gateway.do'
      : 'https://openapi.alipay.com/gateway.do',
    signType: 'RSA2',
  });
  cachedConfig = cfgStr;

  console.log(`[AlipayInstance] 已初始化支付宝 SDK，模式: ${isSandbox ? '沙箱' : '生产'}`);
  return cachedSdk;
}

/**
 * 清除实例缓存（管理后台更新配置后调用）
 */
export function clearAlipayCache() {
  cachedConfig = null;
  cachedSdk = null;
}
