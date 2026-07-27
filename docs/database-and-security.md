# 数据库与安全设计

## 数据库策略

项目保留两套等价 Prisma schema：

- `prisma/schema.prisma` 使用 SQLite，服务于本地开发、自动化测试和无需外部服务的演示。
- `prisma/schema.mysql.prisma` 使用 MySQL 8.0，服务于生产环境。

SQLite 初始化迁移位于 `prisma/migrations/202607270001_init/migration.sql`。MySQL 初始化迁移位于 `prisma/mysql-migrations/202607270001_init/migration.sql`。两套迁移包含相同实体、外键删除策略、唯一约束和查询索引；MySQL 版本额外明确 `utf8mb4_unicode_ci`、文本列长度和原生枚举。

### 核心关系

- User 通过 Session 建立一对多会话，数据库只保存令牌 SHA-256 哈希。
- Post 必须属于一个 Category，通过 PostTag 关联多个 Tag。
- Project 通过 ProjectTag 关联 Tag，图片列表和技术列表使用 JSON 文本持久化。
- Comment 属于 Post，并通过自关联支持一层或多层回复。
- PageView 可关联 Post 或 Project，同时保留路径用于普通页面统计。
- SiteSetting 使用唯一 key 存放可编辑站点配置。

文章列表使用 `(status, publishedAt)` 组合索引，评论审核使用 `(postId, status, createdAt)`，限流与统计分别使用时间范围索引。管理删除遵循显式策略：内容关联表和页面统计级联删除，正在被文章引用的分类限制删除，评论父节点删除后子回复保留并将 parent 置空。

## 种子数据

`prisma/seed.ts` 是幂等脚本，使用 slug、邮箱、设置 key 或固定 id 执行 upsert。它创建：

- 1 个管理员账户；
- 4 个分类与 15 个标签；
- 10 篇完整中文文章；
- 6 个完整中文项目；
- 5 个成长时间线节点；
- 站点设置、1 条审核通过评论与 1 个演示订阅者。

本地账户来自 `ADMIN_EMAIL` 与 `ADMIN_PASSWORD`。生产部署第一次 seed 后必须立即替换密码，并使用部署平台的加密环境变量，不把真实凭据提交到仓库。

## 会话与管理员权限

登录流程在服务端使用 bcrypt 校验密码。成功后生成 256 位随机令牌，浏览器只获得 `HttpOnly`、`SameSite=Lax` Cookie；数据库保存 SHA-256 后的令牌，因此数据库泄露不会直接得到可用 Cookie。生产环境 Cookie 同时启用 `Secure`。

会话默认有效期 14 天，每 24 小时更新最近活动时间。过期会话会在访问时删除，也可由维护任务调用 `purgeExpiredSessions` 批量清理。所有后台 Server Action 与媒体接口都调用 `requireAdmin`，不能只依赖界面隐藏控制权限。

登录限流按“IP 哈希与规范化邮箱”组合键计数，15 分钟内最多 5 次失败。错误响应不会区分账户不存在和密码错误，减少邮箱枚举风险。

## 写请求保护

浏览器发起的写请求必须通过 Origin 与 Host 对比。生产环境只接受 `APP_URL` 或当前反向代理转发主机；开发环境允许本机回环地址。所有表单使用 Zod 做长度、格式、枚举和 URL 协议校验。

公开接口的限流规则：

| 操作 | 窗口 | 上限 |
| --- | ---: | ---: |
| 评论 | 10 分钟 | 5 |
| 联系消息 | 60 分钟 | 3 |
| 邮件订阅 | 60 分钟 | 4 |
| 登录失败 | 15 分钟 | 5 |

评论、联系和订阅表单包含隐藏蜜罐字段。真实用户应保持为空；自动填充该字段的请求会在校验阶段拒绝。访客 IP 使用 HMAC-SHA-256 和独立的 `IP_HASH_SECRET` 处理，数据库不保存原始 IP。User-Agent 截断到 512 字符，避免无界输入。

评论默认进入 `PENDING`，只有管理员改为 `APPROVED` 后才出现在公开页面。父评论必须属于同一文章，阻止跨文章伪造回复关系。

## 媒体安全

上传接口只接受 JPEG、PNG、WebP 和 AVIF，最大 8 MB，并按以下顺序验证：

1. 检查浏览器声明的 MIME；
2. 检查文件扩展名；
3. 读取文件魔数，确认真实 MIME；
4. 要求声明 MIME、扩展名和魔数三者一致；
5. 使用 Sharp 解码，并限制到 4000 万输入像素；
6. 丢弃原始二进制，重新编码为 WebP；
7. 生成不放大的 320、640、1200、2000 像素多尺寸版本。

文件名使用随机 UUID，目录按 UTC 年月分隔。数据库记录最大版本 URL 与全部 variants。删除媒体时先把 URL 解析为绝对路径，再确认目标仍位于 `public/uploads` 内；路径越界会被拒绝。

容器或 Serverless 部署不能依赖临时文件系统。生产环境应把 `processMediaUpload` 的存储层替换为兼容 S3 的对象存储，或为 `public/uploads` 挂载持久卷，并配置独立静态资源域名。

## API 清单

| 路径 | 方法 | 用途 |
| --- | --- | --- |
| `/api/auth/login` | POST | JSON 登录，成功写入安全 Cookie |
| `/api/auth/logout` | POST | 注销当前会话 |
| `/api/comments` | POST | 提交待审核评论 |
| `/api/contact` | POST | 提交联系消息 |
| `/api/subscribe` | POST | 创建或恢复订阅 |
| `/api/search?q=` | GET | 搜索已发布文章和项目 |
| `/api/views` | POST | 30 分钟内按访客和路径去重的浏览统计 |
| `/api/admin/media` | GET / POST | 管理员媒体列表与上传 |
| `/api/media/upload` | POST | 管理员上传兼容路径 |
| `/rss.xml` | GET | 最近 30 篇已发布文章的 RSS 2.0 |

## 生产环境变量

| 变量 | 要求 |
| --- | --- |
| `MYSQL_DATABASE_URL` | TLS 保护的 MySQL 8 连接串 |
| `APP_URL` | 唯一公开 HTTPS 根地址 |
| `SESSION_SECRET` | 至少 24 字符的随机秘密 |
| `IP_HASH_SECRET` | 与会话秘密不同的随机秘密 |
| `ADMIN_EMAIL` | 初始管理员邮箱 |
| `ADMIN_PASSWORD` | 高强度一次性初始密码 |
| `UPLOAD_MAX_BYTES` | 默认 `8388608`，最大允许 16 MB |

生产响应建议同时配置 Content-Security-Policy、Strict-Transport-Security、Referrer-Policy、Permissions-Policy 和 `X-Content-Type-Options: nosniff`。数据库账户按运行与迁移分离，备份需在隔离环境定期验证恢复。
