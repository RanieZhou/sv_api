<?php
/**
 * ============================================================
 *  核心鉴权与日志记录中间件
 * ============================================================
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/db.php';

// 输出全局 CORS 头
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-API-Key, Authorization, ' . API_KEY_HEADER);

// 响应 OPTIONS 预检请求
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

/**
 * 校验 API Key 状态，失败直接中断并输出 JSON 错误
 *
 * @param string $targetUrl 解析的视频链接（用于记录日志）
 * @return array 当前 Key 信息
 */
function authenticate(string $targetUrl = ''): array
{
    if (!AUTH_ENABLED) {
        return ['api_key' => 'system_bypass', 'user_name' => 'Bypass'];
    }

    // 1. 获取 API Key（Header 优先，其次为 GET/POST）
    $apiKey = null;
    $headerKey = 'HTTP_' . strtoupper(str_replace('-', '_', API_KEY_HEADER));

    if (!empty($_SERVER[$headerKey])) {
        $apiKey = trim($_SERVER[$headerKey]);
    } elseif (!empty($_SERVER['HTTP_AUTHORIZATION'])) {
        $auth = trim($_SERVER['HTTP_AUTHORIZATION']);
        if (strncasecmp($auth, 'bearer ', 7) === 0) {
            $apiKey = substr($auth, 7);
        }
    }

    if (empty($apiKey)) {
        $apiKey = $_GET[API_KEY_PARAM] ?? $_POST[API_KEY_PARAM] ?? null;
    }

    if (empty($apiKey)) {
        _authError(401, '缺少 API Key，请在请求参数中带上 ?api_key=xxx 或在 Header 中传入 X-API-Key');
    }

    // 2. 校验 Key 是否存在
    $keyInfo = DB::queryOne(
        'SELECT * FROM api_keys WHERE api_key = ? LIMIT 1',
        [$apiKey]
    );

    if (!$keyInfo) {
        _authError(403, 'API Key 无效');
    }

    if ((int)$keyInfo['status'] !== 1) {
        _authError(403, 'API Key 已被禁用，请联系服务提供方');
    }

    // 3. 校验到期时间
    if (!empty($keyInfo['expire_time'])) {
        $expireTs = strtotime($keyInfo['expire_time']);
        if ($expireTs !== false && $expireTs < time()) {
            _authError(403, 'API Key 已过期，请续费后继续使用');
        }
    }

    // 4. 校验额度 (-1 为无限)
    $totalQuota = (int)$keyInfo['total_quota'];
    $usedQuota  = (int)$keyInfo['used_quota'];
    if ($totalQuota !== -1 && $usedQuota >= $totalQuota) {
        _authError(429, '调用次数已耗尽（剩余 0 次），请联系管理员充值');
    }

    // 5. 扣减次数
    DB::execute(
        'UPDATE api_keys SET used_quota = used_quota + 1, updated_at = NOW() WHERE api_key = ?',
        [$apiKey]
    );

    return $keyInfo;
}

/**
 * 记录调用日志
 */
function logApiCall(string $apiKey, string $targetUrl, int $statusCode, int $responseTimeMs): void
{
    if (!LOG_ENABLED) return;

    $ip = _getClientIp();
    DB::execute(
        'INSERT INTO api_logs (api_key, target_url, ip, status_code, response_time_ms, created_at)
         VALUES (?, ?, ?, ?, ?, NOW())',
        [$apiKey, mb_substr($targetUrl, 0, 500), $ip, $statusCode, $responseTimeMs]
    );
}

function _authError(int $code, string $msg): void
{
    http_response_code($code === 200 ? 200 : $code);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'code' => $code,
        'msg'  => $msg,
        'data' => null,
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

function _getClientIp(): string
{
    foreach (['HTTP_X_FORWARDED_FOR', 'HTTP_X_REAL_IP', 'REMOTE_ADDR'] as $key) {
        if (!empty($_SERVER[$key])) {
            $ip = trim(explode(',', $_SERVER[$key])[0]);
            if (filter_var($ip, FILTER_VALIDATE_IP)) {
                return $ip;
            }
        }
    }
    return '0.0.0.0';
}
