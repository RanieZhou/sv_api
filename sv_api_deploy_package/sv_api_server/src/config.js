import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 加载项目根目录的 .env
dotenv.config({ path: path.join(__dirname, '../.env') });

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    database: process.env.DB_NAME || 'sv_api',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    waitForConnections: true,
    connectionLimit: 20,
    queueLimit: 0,
  },
  adminPassword: process.env.ADMIN_PASSWORD || 'admin123456',
  adminToken: process.env.ADMIN_TOKEN || 'sv_admin_secret_token_2026',
  upstreamUrl: process.env.UPSTREAM_API_URL || 'https://api.bugpk.com/api/short_videos',
};
