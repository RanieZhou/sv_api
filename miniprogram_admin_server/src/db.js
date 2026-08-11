import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '../../mp_config.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

// 初始化配置表与默认配置数据
db.exec(`
  CREATE TABLE IF NOT EXISTS mp_config (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT UNIQUE NOT NULL,
    value TEXT NOT NULL DEFAULT '',
    description TEXT DEFAULT ''
  );
`);

const defaultConfig = [
  { key: 'mp_title', value: '极速去水印助手', description: '小程序导航栏标题' },
  { key: 'mp_notice', value: '欢迎使用！复制抖音、快手、小红书链接粘贴即可一键无水印下载！', description: '首页公告文本' },
  { key: 'parse_api_url', value: 'https://shortvideo.aihubzone.cn/api/parse', description: '固定解析 API 服务端地址' },
  { key: 'api_key', value: 'sk_test_00000000000000000000000000000001', description: '小程序调用的 API Key' },
  { key: 'subscribe_url', value: 'https://shortvideo.aihubzone.cn/', description: '获取/订阅 API Key 链接页面' },
  { key: 'daily_free_quota', value: '5', description: '普通用户每日免费解析次数' },
  { key: 'ad_banner_id', value: '', description: '流量主 Banner 广告位 ID' },
  { key: 'ad_video_id', value: '', description: '流量主 激励视频广告位 ID' },
  { key: 'ad_interstitial_id', value: '', description: '流量主 插屏广告位 ID' },
  { key: 'contact_wechat', value: 'admin', description: '客服微信/联系方式' },
  { key: 'disclaimer', value: '本小程序仅供个人学习交流使用，作品版权归原作者所有。', description: '免责声明' },
];

const insertStmt = db.prepare(`INSERT OR IGNORE INTO mp_config (key, value, description) VALUES (?, ?, ?)`);
for (const item of defaultConfig) {
  insertStmt.run(item.key, item.value, item.description);
}

export function getConfig() {
  const rows = db.prepare('SELECT key, value FROM mp_config').all();
  const res = {};
  rows.forEach((r) => {
    res[r.key] = r.value;
  });
  return res;
}

export function updateConfig(newConfig) {
  const updateStmt = db.prepare('UPDATE mp_config SET value = ? WHERE key = ?');
  const transaction = db.transaction((data) => {
    for (const [k, v] of Object.entries(data)) {
      updateStmt.run(String(v), k);
    }
  });
  transaction(newConfig);
  return getConfig();
}

export default db;
