-- ============================================================
-- SV-API 数据库初始化脚本
-- 执行前请在 MySQL 中创建数据库：
--   CREATE DATABASE sv_api DEFAULT CHARSET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- ============================================================

USE sv_api;

-- ============================================================
-- 1. api_keys (API Key 账号与额度表)
-- ============================================================
CREATE TABLE IF NOT EXISTS `api_keys` (
  `id`           INT(11)      NOT NULL AUTO_INCREMENT          COMMENT '主键ID',
  `api_key`      VARCHAR(64)  NOT NULL                         COMMENT 'API Key (唯一，如 sk_8f9a2b...)',
  `user_name`    VARCHAR(100) NOT NULL DEFAULT ''              COMMENT '买家姓名/联系方式(如 微信:xxx)',
  `status`       TINYINT(1)   NOT NULL DEFAULT 1               COMMENT '状态：1=正常，0=禁用',
  `total_quota`  INT(11)      NOT NULL DEFAULT 10000           COMMENT '总授权次数 (-1 表示无限次)',
  `used_quota`   INT(11)      NOT NULL DEFAULT 0               COMMENT '已使用次数',
  `qps_limit`    INT(11)      NOT NULL DEFAULT 10              COMMENT 'QPS限制(次/秒)',
  `expire_time`  DATETIME              DEFAULT NULL            COMMENT '到期时间 (NULL 表示永不过期)',
  `note`         VARCHAR(255)          DEFAULT ''              COMMENT '管理员备注',
  `created_at`   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at`   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '最后更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_api_key` (`api_key`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='API Key 账号与额度表';

-- ============================================================
-- 2. api_logs (接口调用日志表)
-- ============================================================
CREATE TABLE IF NOT EXISTS `api_logs` (
  `id`               BIGINT(20)   NOT NULL AUTO_INCREMENT        COMMENT '主键ID',
  `api_key`          VARCHAR(64)  NOT NULL                       COMMENT '调用的 API Key',
  `target_url`       TEXT                                        COMMENT '解析的目标视频链接',
  `ip`               VARCHAR(45)  NOT NULL DEFAULT ''            COMMENT '客户端 IP',
  `status_code`      INT(4)       NOT NULL DEFAULT 200           COMMENT 'HTTP 响应状态码',
  `response_time_ms` INT(11)      NOT NULL DEFAULT 0             COMMENT '上游响应耗时(毫秒)',
  `created_at`       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '调用时间',
  PRIMARY KEY (`id`),
  KEY `idx_api_key`   (`api_key`),
  KEY `idx_created_at`(`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='接口调用日志表';

-- ============================================================
-- 3. banners (轮播图管理表)
-- ============================================================
CREATE TABLE IF NOT EXISTS `banners` (
  `id`         INT(11)      NOT NULL AUTO_INCREMENT          COMMENT '主键ID',
  `title`      VARCHAR(100) NOT NULL DEFAULT ''              COMMENT '标题',
  `image_url`  VARCHAR(500) NOT NULL DEFAULT ''              COMMENT '图片URL',
  `link_url`   VARCHAR(500)          DEFAULT ''              COMMENT '跳转链接',
  `sort_order` INT(11)               DEFAULT 0               COMMENT '排序',
  `is_active`  TINYINT(1)            DEFAULT 1               COMMENT '状态：1=启用 0=禁用',
  `created_at` DATETIME              DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='轮播图管理表';

-- ============================================================
-- 4. system_config (系统与小程序/广告设置表)
-- ============================================================
CREATE TABLE IF NOT EXISTS `system_config` (
  `config_key`   VARCHAR(64)  NOT NULL                       COMMENT '配置项 Key',
  `config_value` LONGTEXT     NOT NULL                       COMMENT '配置项 JSON 值',
  `updated_at`   DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`config_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系统与小程序/广告设置表';

-- ============================================================
-- 5. 初始测试数据
-- ============================================================
INSERT INTO `api_keys` (`api_key`, `user_name`, `status`, `total_quota`, `used_quota`, `expire_time`, `note`)
VALUES (
  'sk_test_00000000000000000000000000000001',
  '演示/测试用户',
  1,
  -1,
  0,
  NULL,
  '内置测试 Key，不限次数永不过期'
) ON DUPLICATE KEY UPDATE `updated_at` = NOW();
