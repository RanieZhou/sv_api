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
    const pool = mysql.createPool({ ...config.db, timezone: '+08:00', dateStrings: true, connectTimeout: 1000 });
    // 测试 MySQL 连接
    const conn = await pool.getConnection();
    conn.release();
    mysqlPool = pool;
    console.log('✅ 数据库模式: 已成功连接 MySQL 数据库');
    await createMySQLTables(pool);
    // 一次性修正既有测试 Key 时间偏差
    try {
      await execute("UPDATE api_keys SET expire_time = '2026-09-12 01:00:40' WHERE expire_time LIKE '2026-09-11 17%'");
    } catch (e) {}
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

      CREATE TABLE IF NOT EXISTS banners (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL DEFAULT '',
        image_url TEXT NOT NULL,
        link_url TEXT DEFAULT '',
        sort_order INTEGER DEFAULT 0,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS system_config (
        config_key TEXT PRIMARY KEY,
        config_value TEXT NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS store_users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        email TEXT DEFAULT '',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_no TEXT UNIQUE NOT NULL,
        user_id INTEGER NOT NULL DEFAULT 0,
        user_name TEXT NOT NULL DEFAULT '',
        package_id TEXT NOT NULL,
        package_name TEXT NOT NULL,
        amount REAL NOT NULL DEFAULT 0,
        quota INTEGER NOT NULL DEFAULT 0,
        expire_days INTEGER NOT NULL DEFAULT 30,
        api_key TEXT NOT NULL DEFAULT '',
        status INTEGER NOT NULL DEFAULT 1,
        pay_status INTEGER NOT NULL DEFAULT 0,
        paid_at DATETIME DEFAULT NULL,
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

      INSERT OR IGNORE INTO banners (id, title, image_url, link_url, sort_order, is_active)
      VALUES 
      (1, '去水印神器', 'https://p3-pc-sign.douyinpic.com/tos-cn-p-0015c000-ce/owE0NiIQQJgUPrvefRLQfby3kPaUjBAGGDo7Au~tplv-dy-360p.jpeg?lk3s=138a59ce', '', 1, 1),
      (2, '全平台支持', 'https://p3.douyinpic.com/aweme/100x100/aweme-avatar/tos-cn-i-0813c000-ce_oIDIOuJkIw7B8fwEeCBGeJy7pBALAArgAsESQr.webp?from=327834062', '', 2, 1);
    `);
  }
}

async function createMySQLTables(pool) {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS \`api_keys\` (
        \`id\` INT(11) NOT NULL AUTO_INCREMENT,
        \`api_key\` VARCHAR(64) NOT NULL,
        \`user_name\` VARCHAR(100) NOT NULL DEFAULT '',
        \`status\` TINYINT(1) NOT NULL DEFAULT 1,
        \`total_quota\` INT(11) NOT NULL DEFAULT 10000,
        \`used_quota\` INT(11) NOT NULL DEFAULT 0,
        \`qps_limit\` INT(11) NOT NULL DEFAULT 10,
        \`expire_time\` DATETIME DEFAULT NULL,
        \`note\` VARCHAR(255) DEFAULT '',
        \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`uk_api_key\` (\`api_key\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS \`api_logs\` (
        \`id\` BIGINT(20) NOT NULL AUTO_INCREMENT,
        \`api_key\` VARCHAR(64) NOT NULL,
        \`target_url\` TEXT,
        \`ip\` VARCHAR(45) NOT NULL DEFAULT '',
        \`status_code\` INT(4) NOT NULL DEFAULT 200,
        \`response_time_ms\` INT(11) NOT NULL DEFAULT 0,
        \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS \`banners\` (
        \`id\` INT(11) NOT NULL AUTO_INCREMENT,
        \`title\` VARCHAR(100) NOT NULL DEFAULT '',
        \`image_url\` VARCHAR(500) NOT NULL DEFAULT '',
        \`link_url\` VARCHAR(500) DEFAULT '',
        \`sort_order\` INT(11) DEFAULT 0,
        \`is_active\` TINYINT(1) DEFAULT 1,
        \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS \`system_config\` (
        \`config_key\` VARCHAR(64) NOT NULL,
        \`config_value\` LONGTEXT NOT NULL,
        \`updated_at\` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`config_key\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS \`store_users\` (
        \`id\` INT(11) NOT NULL AUTO_INCREMENT,
        \`username\` VARCHAR(100) NOT NULL,
        \`password\` VARCHAR(255) NOT NULL,
        \`email\` VARCHAR(100) DEFAULT '',
        \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`uk_username\` (\`username\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS \`orders\` (
        \`id\` INT(11) NOT NULL AUTO_INCREMENT,
        \`order_no\` VARCHAR(64) NOT NULL,
        \`user_id\` INT(11) NOT NULL DEFAULT 0,
        \`user_name\` VARCHAR(100) NOT NULL DEFAULT '',
        \`package_id\` VARCHAR(32) NOT NULL,
        \`package_name\` VARCHAR(50) NOT NULL,
        \`amount\` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        \`quota\` INT(11) NOT NULL DEFAULT 0,
        \`expire_days\` INT(11) NOT NULL DEFAULT 30,
        \`api_key\` VARCHAR(64) NOT NULL DEFAULT '',
        \`status\` TINYINT(1) NOT NULL DEFAULT 1,
        \`pay_status\` TINYINT(1) NOT NULL DEFAULT 0,
        \`paid_at\` DATETIME DEFAULT NULL,
        \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`uk_order_no\` (\`order_no\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
  } catch (err) {
    console.error('MySQL 建表失败:', err.message);
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
