# R7 数字花园部署指南

## 部署边界

本项目的生产目标是“常驻 Node.js 服务 + MySQL 8 + HTTPS 反向代理 + 持久化媒体存储”。

当前仓库已经在本地 SQLite 环境完成类型、Lint、单元、端到端、无障碍、响应式和生产构建验证。仓库没有提供真实域名、MySQL、服务器、共享磁盘或对象存储凭据，因此尚未执行线上部署，也没有声称生产 MySQL 或云存储集成已经通过实机验证。

## 推荐拓扑

```text
浏览器
  │ HTTPS
  ▼
Nginx / Caddy / 托管负载均衡器
  │ HTTP，仅私有网络或本机回环
  ▼
Next.js Node 进程（pnpm start）
  ├─ TLS 连接 ──► MySQL 8
  └─ 读写 ─────► public/uploads 持久卷
                 或完成改造后的对象存储
```

最小部署可以只有一个 Node 实例和一个持久卷。水平扩容时，所有实例必须连接同一 MySQL，并共享同一上传存储；不能让每个实例各自写临时磁盘。

## 基础要求

- Node.js 20.9 或更高版本。
- pnpm 11。
- MySQL 8.0，数据库字符集 `utf8mb4`，排序规则 `utf8mb4_unicode_ci`。
- 独立 HTTPS 域名。
- Nginx、Caddy、云负载均衡器或等效反向代理。
- 可持久化、可备份的上传目录，或已经完成代码接入的对象存储。
- 发布制品、数据库和上传文件的版本化备份位置。

## 生产环境变量

推荐把环境变量放在部署平台的 Secret 管理器或仅 root 可读的环境文件中，不要写入 Git、镜像层、构建日志或进程参数。

```dotenv
MYSQL_DATABASE_URL="mysql://r7_app:REDACTED@mysql.internal:3306/r7_blog"
APP_URL="https://example.com"
SESSION_SECRET="至少 32 个高熵随机字符"
IP_HASH_SECRET="另一组至少 32 个高熵随机字符"
ADMIN_EMAIL="owner@example.com"
ADMIN_PASSWORD="仅首次 Seed 使用的唯一长密码"
UPLOAD_MAX_BYTES="104857600"
AUDIO_UPLOAD_MAX_BYTES="104857600"
```

说明：

- MySQL 构建使用 `MYSQL_DATABASE_URL`，不使用 SQLite 的 `DATABASE_URL`。
- `APP_URL` 必须是用户实际访问的唯一 HTTPS 根地址。它参与 Origin 校验，并决定登录 Cookie 是否设置 `Secure`。
- `SESSION_SECRET` 和 `IP_HASH_SECRET` 必须独立生成，不得复用管理员密码。
- `ADMIN_PASSWORD` 只在 Seed 中读取。首次初始化完成后，如果日常启动不再执行 Seed，应从常驻运行环境移除它。
- 数据库密码如果含有 `@`、`:`、`/` 等字符，必须在 URL 中正确百分号编码。
- 使用托管 MySQL 时应采用供应商要求的 CA/TLS 参数；不要关闭证书验证来“解决”连接问题。

## MySQL 账号与数据库

建议分开两个账号：

### 迁移账号

只在部署窗口使用。对目标数据库授予执行初始化或增量 DDL 所需的 `CREATE`、`ALTER`、`INDEX`、`REFERENCES`，以及必要的读写权限。

### 运行账号

Next.js 日常连接使用。只授予目标数据库的 `SELECT`、`INSERT`、`UPDATE`、`DELETE`，不授予全局权限、账号管理或其他数据库访问权。

创建空数据库时明确使用：

```sql
CREATE DATABASE r7_blog
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

真实用户名、主机范围和授权语句应由数据库管理员按基础设施策略生成，不要把示例密码直接用于生产。

## Prisma MySQL schema 与迁移

项目有两套 schema：

- `prisma/schema.prisma`：SQLite，本地开发和自动化测试。
- `prisma/schema.mysql.prisma`：MySQL 8，生产构建。

MySQL 初始化 SQL 位于：

```text
prisma/mysql-migrations/202607270001_init/migration.sql
```

它包含原生 MySQL 枚举、索引、外键、`utf8mb4` 字符集和排序规则。SQLite 的 `prisma/migrations` 不能用于 MySQL。

### 首次初始化

以下命令只针对空的 MySQL 8 数据库：

```bash
pnpm install --frozen-lockfile
pnpm db:mysql:generate
pnpm exec prisma db execute --schema prisma/schema.mysql.prisma --file prisma/mysql-migrations/202607270001_init/migration.sql
```

执行前：

1. 备份目标数据库或为全新空库创建可回收快照。
2. 确认连接的是预期主机和数据库，而不是其他环境。
3. 先在结构相同的预发布空库执行。
4. 检查 SQL 文件和 schema 的 Git 提交版本一致。
5. 使用迁移账号，而不是扩大长期运行账号权限。

`prisma db execute` 会直接执行已审阅 SQL；当前自定义 MySQL 目录不与 SQLite 的 `_prisma_migrations` 历史共用。不要对 MySQL 执行 `pnpm db:deploy`。

可运行以下命令核对“空库到当前 schema”的完整结构：

```bash
pnpm db:mysql:diff
```

该命令生成的是完整建库差异，不是面向已有生产库的增量迁移，不能把输出不经审阅地重复应用到生产。

### 后续 schema 变更

后续迁移应按以下流程管理：

1. 同步修改 SQLite 和 MySQL 两套 schema，保持模型、关系与删除策略等价。
2. 基于上一个已发布 MySQL 结构生成增量 SQL，不使用“from-empty”结果冒充增量。
3. 将 SQL 保存为新的、只追加的编号目录，例如 `prisma/mysql-migrations/<timestamp>_<name>/migration.sql`。
4. 人工检查锁表、数据回填、索引创建、外键删除策略和回滚边界。
5. 在生产数据副本上测试执行时间和应用兼容性。
6. 备份生产数据库，再在维护窗口应用。
7. 记录迁移文件哈希、执行人、时间、数据库快照和结果。

已在生产执行的迁移文件不得原地改写。

## Seed

`prisma/seed.ts` 是幂等脚本，会创建或更新演示文章、项目、分类、标签、时间线、站点设置、管理员、评论和演示订阅者。

如果生产站点需要这套初始内容，在 MySQL Client 已生成且迁移完成后运行：

```bash
pnpm db:mysql:seed
```

注意：

- Seed 会按 `ADMIN_EMAIL` 创建或更新管理员，并用 `ADMIN_PASSWORD` 重新计算密码哈希。
- Seed 会同步内置演示内容；正式运营后重复执行可能覆盖对同 slug 内置内容的编辑。
- 第一次生产 Seed 后应验证登录，轮换临时凭据，并从无需再次 Seed 的运行环境移除 `ADMIN_PASSWORD`。
- 对已有正式数据运行 Seed 前必须备份。

## 构建与发布

生产构建必须使用 MySQL schema：

```bash
pnpm install --frozen-lockfile
pnpm build:mysql
```

`build:mysql` 先执行：

```text
prisma generate --schema prisma/schema.mysql.prisma
```

然后执行 `next build`。这一步确保应用导入的 `@prisma/client` 使用 MySQL provider。

启动：

```bash
pnpm start
```

默认监听 3000 端口。生产中由 systemd、PM2、容器编排器或托管 Node 平台负责：

- 异常退出后重启；
- 限制进程用户权限；
- 注入 Secret；
- 收集经过脱敏的日志；
- 执行滚动或蓝绿发布；
- 只向反向代理暴露内部端口。

不要在同一发布目录先执行 MySQL generate，随后又执行默认 `pnpm build`；默认构建会重新生成 SQLite Client。生产始终使用 `pnpm build:mysql`。

## systemd 示例

以下示例只展示进程边界，路径和用户必须按服务器实际情况修改：

```ini
[Unit]
Description=R7 Digital Garden
After=network-online.target

[Service]
Type=simple
User=r7
Group=r7
WorkingDirectory=/srv/r7/current
EnvironmentFile=/etc/r7-blog.env
ExecStart=/usr/bin/pnpm start
Restart=on-failure
RestartSec=5
NoNewPrivileges=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
```

`/srv/r7/current/public/uploads` 必须指向持久卷或共享存储。`/etc/r7-blog.env` 不应对普通用户可读。

## Nginx 反向代理示例

```nginx
server {
    listen 80;
    server_name example.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name example.com;

    ssl_certificate     /etc/letsencrypt/live/example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;

    client_max_body_size 10m;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Proto https;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_read_timeout 60s;
    }
}
```

要点：

- HTTP 永久跳转 HTTPS。
- `Host` 与 `X-Forwarded-Proto` 必须正确，避免 Origin 校验和安全 Cookie 行为异常。
- `client_max_body_size` 要略高于 `UPLOAD_MAX_BYTES`，为 multipart 边界预留空间。
- Next.js 已返回 `X-Content-Type-Options`、`Referrer-Policy`、`X-Frame-Options` 和 `Permissions-Policy`；代理不应覆盖成更弱值。
- 确认所有子域和备用域名都重定向到 `APP_URL` 的唯一主域。
- HSTS 只应在 HTTPS、证书续期和全部子域策略确认后启用。

如果使用 Cloudflare、ALB 或多层代理，要清楚哪一层可以信任客户端 IP 头。应用对访客地址做 HMAC 哈希，但错误信任外部可伪造头仍会削弱限流。

## Content-Security-Policy

当前 `next.config.ts` 没有发布 CSP。Next.js 与主题脚本可能需要内联脚本策略，不能直接复制一条过度宽松或会破坏页面的 CSP。

建议：

1. 在预发布环境先配置 `Content-Security-Policy-Report-Only`。
2. 收集首页、文章、后台登录、编辑器、主题切换、图片和上传流程报告。
3. 使用 nonce 或 hash 收紧脚本策略。
4. 确认无违规后再切换为强制 CSP。
5. 不使用 `unsafe-eval`；对 `unsafe-inline` 的任何保留都要有明确原因。

## 持久化上传

### 方案 A：持久卷或共享文件系统

当前代码可以直接使用此方案。把应用目录中的：

```text
public/uploads
```

挂载到持久磁盘。要求：

- Node 运行用户拥有创建目录、写入和删除权限。
- 重新构建、重新部署、容器替换不会清空挂载内容。
- 多个 Node 实例看到同一目录。
- 备份保留目录结构和文件名。
- 静态资源域或代理不会缓存已经删除的对象过久。

建议在发布前后验证：上传一张测试图、刷新媒体库、访问最大版本 URL、重启实例后再次访问、删除并确认所有响应式版本消失。

### 方案 B：对象存储

当前仓库没有对象存储适配器，不能仅增加 S3/R2/Blob 环境变量就完成接入。

接入时需要改造 `src/lib/uploads.ts`：

- 保留文件扩展名、声明 MIME、文件魔数和 Sharp 解码校验。
- 在内存中完成重新编码，再把各尺寸 WebP 上传到对象存储。
- 数据库 `Media.url` 和 `variantsJson` 保存稳定的公开 URL 或受控 CDN URL。
- 删除媒体时删除所有变体；数据库与对象操作失败要有补偿或可重试机制。
- 配置 Bucket 权限、CORS、缓存头、生命周期和对象版本控制。
- 不允许客户端绕过服务端校验直接写入公开 Bucket，除非实现等价的签名上传与完成回调校验。

对象存储改造完成前，Serverless 或临时容器部署应禁用后台上传，或选择带持久卷的 Node 平台。

## 备份

至少备份：

- MySQL 全量备份和可用的增量/binlog；
- `public/uploads` 或对象存储版本；
- 当前发布提交 SHA、锁文件和 MySQL migration SQL；
- 站点设置与 Secret 的恢复流程，但不要把明文 Secret 放入普通备份日志。

数据库与上传文件要使用接近的恢复时间点。建议每日自动备份，并定期在隔离环境实际恢复，而不是只检查“备份任务成功”。

## 发布检查

### 发布前

1. 类型检查、Lint、Vitest 和生产构建通过。
2. MySQL migration 在预发布数据副本通过。
3. 数据库和上传存储已完成可恢复备份。
4. `APP_URL` 是正式 HTTPS 地址。
5. 两个 Secret 独立且足够长。
6. 管理员密码与开发密码不同。
7. 运行账号没有 DDL 或全局权限。
8. 上传目录是持久存储，或对象存储适配已完成测试。
9. 代理请求体上限、Host 和转发协议正确。
10. 回滚制品和数据库快照已准备。

### 发布后

1. 首页、文章、项目、搜索、RSS、站点地图返回成功。
2. 匿名访问 `/admin` 会跳转到登录页。
3. 管理员可登录和登出，Cookie 在 HTTPS 下带 `Secure`。
4. 文章读取、评论提交、后台审核和站点设置写入正常。
5. 上传、访问、重启后访问、删除媒体完整通过。
6. 深浅主题和 390 × 844 页面无横向溢出。
7. 日志没有数据库 URL、密码、Cookie、会话令牌或完整读者邮箱。
8. 监控、错误告警、数据库连接和磁盘容量告警已生效。

## 回滚

应用和数据库回滚要分开判断。

### 仅应用代码回滚

如果新版本没有执行不兼容的数据库迁移：

1. 保留当前故障版本日志和发布标识。
2. 把反向代理或编排器流量切回上一份已验证制品。
3. 不重新执行 Seed。
4. 验证首页、登录、数据库读取和上传。
5. 保留故障版本用于离线分析。

### 包含数据库变更

不要在没有验证的情况下手工逆向 DDL。更安全的流程是：

1. 停止会产生新写入的应用版本，或进入维护模式。
2. 从迁移前快照恢复到新的数据库实例。
3. 恢复同一时间点的上传存储。
4. 切换 `MYSQL_DATABASE_URL` 到恢复实例。
5. 启动与该 schema 兼容的上一版本应用。
6. 执行一致性检查后再恢复流量。

如果迁移是经过设计的向后兼容扩展，可先回滚应用、保留新增列；是否可行必须由该次迁移评审决定，不能作为默认假设。

### 凭据事故

如怀疑泄露：

1. 轮换数据库密码、`SESSION_SECRET`、`IP_HASH_SECRET` 和管理员密码。
2. 删除数据库中现有 Session，使全部管理员会话失效。
3. 检查访问日志和数据库审计记录。
4. 重新部署只含新 Secret 的制品。
5. 确认旧凭据已经撤销，而不只是“新增了一个密码”。

## 当前未验证的生产项

由于没有外部基础设施凭据，本次交付没有执行：

- 真实 MySQL 8 实例迁移和 TLS 连通性测试；
- 真实域名、证书和反向代理上线；
- 共享卷重启/多实例一致性测试；
- S3、R2、Vercel Blob 等对象存储集成；
- 线上备份恢复演练；
- 真实流量压测和长期运行监控。

这些是上线清单，而不是已经完成的结果。
