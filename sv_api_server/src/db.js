import mysql from 'mysql2/promise';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mysqlPool = null;
let sqliteDb = null;
let useSQLite = false;

// 尝试初始化 MySQL 连接池；若未安装/未启动 MySQL 则自动降级使用本地 SQLite (local_test.db)
async function initDb() {
  try {
    const pool = mysql.createPool({ ...config.db, connectTimeout: 1000 });
    // 测试 MySQL 连接
    const conn = await pool.getConnection();
    conn.release();
    mysqlPool = pool;
    console.log('✅ 数据库模式: 已成功连接 MySQL 数据库');
  } catch (err) {
    useSQLite = true;
    console.log('⚡ 本地未检测到 MySQL 服务，已自动启用零配置 SQLite 本地数据库进行测试 (data/local_test.db)');
    
    const dbPath = path.join(__dirname, '../../local_test.db');
    sqliteDb = new Database(dbPath);
    sqliteDb.pragma('journal_mode = WAL');

    // 建表
    sqliteDb.exec(`
      CREATE TABLE IF NOT EXISTS api_keys (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        api_key TEXT UNIQUE NOT NULL,
        user_name TEXT NOT NULL DEFAULT '',
        status INTEGER NOT NULL DEFAULT 1,
        total_quota INTEGER NOT NULL DEFAULT 10000,
        used_quota INTEGER NOT NULL DEFAULT 0,
        qps_limit INTEGER NOT NULL DEFAULT 10,
        expire_time TEXT DEFAULT NULL,
        note TEXT DEFAULT '',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS api_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        api_key TEXT NOT NULL,
        target_url TEXT,
        ip TEXT NOT NULL DEFAULT '',
        status_code INTEGER NOT NULL DEFAULT 200,
        response_time_ms INTEGER NOT NULL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      INSERT OR IGNORE INTO api_keys (api_key, user_name, status, total_quota, used_quota, expire_time, note)
      VALUES (
        'sk_test_00000000000000000000000000000001',
        '演示/测试用户',
        1,
        -1,
        0,
        NULL,
        '内置测试 Key，不限次数永不过期'
      );
    `);
  }
}

// 立即初始化
await initDb();

export async function queryOne(sql, params = []) {
  if (useSQLite) {
    // 兼容 MySQL ? 占位符转换
    const stmt = sqliteDb.prepare(sql.replace(/LIMIT 1/i, ''));
    return stmt.get(...params) || null;
  } else {
    const [rows] = await mysqlPool.query(sql, params);
    return rows.length > 0 ? rows[0] : null;
  }
}

export async function queryAll(sql, params = []) {
  if (useSQLite) {
    // 处理 SQLite 不支持 CURDATE() / DATE_SUB 简化函数
    let querySql = sql
      .replace(/CURDATE\(\)/gi, "DATE('now')")
      .replace(/DATE_SUB\(NOW\(\), INTERVAL 7 DAY\)/gi, "DATE('now', '-7 days')");
    
    // SQLite LIMIT / OFFSET 转换
    const stmt = sqliteDb.prepare(querySql);
    return stmt.all(...params);
  } else {
    const [rows] = await mysqlPool.query(sql, params);
    return rows;
  }
}

export async function execute(sql, params = []) {
  if (useSQLite) {
    let querySql = sql.replace(/NOW\(\)/gi, "DATETIME('now', 'localtime')");
    const stmt = sqliteDb.prepare(querySql);
    const info = stmt.run(...params);
    return { affectedRows: info.changes, insertId: info.lastInsertRowid };
  } else {
    const [result] = await mysqlPool.execute(sql, params);
    return result;
  }
}

export default { queryOne, queryAll, execute };
