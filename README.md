# R7 Personal Garden V2

R7 Personal Garden V2 是一个数据库驱动的中文个人博客、项目作品集与生活记录站。它在同一个 Next.js 应用中提供公开站点和受保护的管理后台，内容覆盖文章、项目、照片、说说、音乐、留言与友链。

本仓库包含本地 SQLite 开发方案、生产 MySQL 8 schema 与增量迁移、图片和音频上传、审核型公开互动、天气组件、SEO 输出以及自动化测试代码。仓库不包含真实域名、生产数据库、对象存储或任何可用密钥，也不代表已经完成线上部署。

## 技术栈

| 层级 | 当前实现 |
| --- | --- |
| Web | Next.js 16 App Router、React 19、TypeScript 5.9 |
| UI | Tailwind CSS 4、Motion、next-themes、Lucide |
| 数据 | Prisma 6、本地 SQLite、生产 MySQL 8 |
| 内容 | react-markdown、remark-gfm、rehype-sanitize、rehype-highlight |
| 校验与安全 | Zod、bcryptjs、数据库会话、Origin 校验、HMAC 访客标识、数据库限频 |
| 媒体 | file-type、Sharp、本地持久化图片与音频 |
| 测试 | Vitest、Testing Library、Playwright、axe-core |
| 包管理 | pnpm 11 |

## 当前功能

### 公开站点

| 路由 | 内容与交互 |
| --- | --- |
| `/` | 个人资料、真实内容统计、混合内容流、全站音乐、天气和内容日历 |
| `/blog`、`/blog/[slug]` | 文章分页、分类/标签筛选、Markdown 正文、目录、阅读进度和待审核评论 |
| `/archive`、`/categories`、`/tags` | 文章归档与内容分类入口 |
| `/projects`、`/projects/[slug]` | 项目列表、详情、技术栈、真实外链和相关内容 |
| `/photos`、`/photos/[slug]` | 相册优先的照片墙、自然比例图片流与可访问灯箱 |
| `/music` | 唯一共享播放器、播放队列、进度、音量、随机、循环、歌单、歌词与音乐随记 |
| `/moments` | 按年月组织的说说、置顶、心情/天气标签、图片、点赞和待审核评论 |
| `/guestbook` | 已审核留言墙、管理员回复与待审核留言提交 |
| `/friends` | 已发布友链、精选/标签与待审核友链申请 |
| `/calendar` | 按日期汇总文章、项目、说说与照片 |
| `/about`、`/now` | 个人介绍、学习状态、时间线、兴趣与近期目标 |
| `/contact`、`/search` | 联系表单与数据库内容搜索 |

站点同时输出 `/rss.xml`、`/robots.txt`、`/sitemap.xml`、Web App Manifest、Canonical 与 Open Graph 元数据。浅色、深色和跟随系统主题可持久化；花瓣效果可以由管理员和访客分别关闭，并尊重 `prefers-reduced-motion`。

音乐由公开站点布局中的同一个 `AudioPlayerProvider` 管理，页面切换不会创建第二个 `<audio>`。播放器不会自动播放，只有访客主动点击后才调用浏览器播放 API。

### 公开写入与审核

- 文章评论、说说评论和留言提交后进入待审核状态，不会立即公开。
- 友链申请保存为草稿，管理员核验后才能发布。
- 说说点赞按 HMAC 访客标识切换，不保存原始 IP。
- 公开表单使用同源校验、Zod、纯文本约束、蜜罐与数据库限频。
- 邮箱、联系方式、User-Agent 和 IP 哈希不会出现在公开页面。
- 留言、友链或音乐功能关闭时，页面仍提供明确说明，但不保留对应提交或播放入口。

### 管理后台

后台入口为 `/admin/login`，登录后可以使用：

- 数据库实时概览；
- 文章、分类、标签与项目 CRUD；
- 说说、说说图片与评论审核；
- 相册、照片、封面和媒体关系管理；
- 本地/远程音乐曲目、歌单、顺序、歌词和随记管理；
- 留言审核、置顶与管理员回复；
- 友链申请审核、编辑、精选、排序和发布；
- 图片媒体库和独立音频上传；
- 文章评论审核；
- 站点资料、个人资料、主题功能、花瓣、天气、音乐、留言与友链开关。

受保护页面、Server Actions、图片接口和音频接口都会在服务端重新验证管理员会话。

## 项目目录

```text
.
├─ src/
│  ├─ app/
│  │  ├─ (site)/                  # 公开路由
│  │  ├─ admin/                   # 登录和受保护后台
│  │  ├─ api/                     # 认证、互动、搜索、天气、上传等接口
│  │  ├─ rss.xml/                 # RSS 2.0
│  │  ├─ sitemap.ts               # 动态站点地图
│  │  ├─ robots.ts                # 搜索引擎规则
│  │  └─ manifest.ts              # Web App Manifest
│  ├─ actions/
│  │  ├─ admin.ts                 # 文章、项目、分类、标签、设置等写操作
│  │  └─ garden-admin.ts          # V2 花园内容写操作
│  ├─ components/
│  │  ├─ admin/                   # 后台界面
│  │  ├─ content/                 # Markdown、分页和内容组件
│  │  └─ site/                    # 首页、音乐、照片、说说、留言、友链等
│  └─ lib/
│     ├─ data.ts                  # 文章、项目和基础设置查询
│     ├─ garden-data.ts           # V2 公开内容查询
│     ├─ uploads.ts               # 图片验证、转换和删除
│     ├─ audio-uploads.ts         # 音频验证、存储和清理
│     ├─ weather.ts               # Open-Meteo 服务适配
│     └─ auth.ts / security.ts    # 会话与安全边界
├─ prisma/
│  ├─ schema.prisma               # SQLite schema
│  ├─ schema.mysql.prisma         # MySQL 8 schema
│  ├─ migrations/                 # SQLite V1 + V2 迁移
│  ├─ mysql-migrations/           # MySQL V1 + V2 审阅 SQL
│  └─ seed.ts                     # 幂等初始内容与管理员
├─ public/
│  ├─ images/                     # 仓库内置图片
│  └─ uploads/                    # 运行时图片与音频，Git 忽略
├─ tests/
│  ├─ unit/                       # 数据、组件、安全、上传、天气和 V2 测试
│  └─ e2e/                        # 公开路由、后台、V2、响应式和无障碍测试
├─ scripts/
│  ├─ verify-database.ts          # 核心数据快照和测试数据清理
│  └─ capture-visuals.ts          # 本地视觉截图
├─ docs/                          # 架构、设计、迁移、后台和部署文档
├─ design-references/             # 设计参考图
└─ artifacts/                     # 参考研究与既有视觉产物
```

## 环境要求

- Node.js 20.9 或更高版本；
- pnpm 11，仓库通过 `packageManager` 固定为 `pnpm@11.9.0`；
- 本地开发无需 MySQL，SQLite 文件默认位于 `prisma/dev.db`；
- Playwright 测试需要 Chromium；
- 生产环境需要 MySQL 8、HTTPS 根域名和可持久化的上传存储。

## 本地快速开始

安装依赖：

```bash
pnpm install --frozen-lockfile
```

复制环境变量模板：

```powershell
# Windows PowerShell
Copy-Item .env.example .env
```

```bash
# macOS / Linux
cp .env.example .env
```

在运行 Seed 前，至少为 `.env` 设置独立的管理员邮箱、管理员长密码、会话 Secret 和 IP 哈希 Secret。不要把 `.env`、本机密码或真实生产凭据提交到 Git，也不要从文档复制所谓“默认登录密码”。

初始化 SQLite：

```bash
pnpm db:generate
pnpm db:deploy
pnpm db:seed
pnpm db:verify
```

启动开发服务器：

```bash
pnpm dev
```

常用地址：

- 公开站点：`http://localhost:3000`
- 管理后台：`http://localhost:3000/admin/login`
- RSS：`http://localhost:3000/rss.xml`
- 站点地图：`http://localhost:3000/sitemap.xml`

管理员登录信息由执行 Seed 时的 `ADMIN_EMAIL` 和 `ADMIN_PASSWORD` 决定。Seed 会更新同邮箱管理员的密码哈希，因此对已有环境重复运行前应确认变量并先备份。

## 环境变量

`.env.example` 只包含不可用的占位值：

| 变量 | 用途与约束 |
| --- | --- |
| `DATABASE_URL` | 默认 SQLite 连接串 `file:./dev.db`，供 `prisma/schema.prisma` 使用 |
| `MYSQL_DATABASE_URL` | MySQL 8 连接串，只供 `prisma/schema.mysql.prisma` 使用 |
| `APP_URL` | 唯一公开根地址；参与绝对 URL、Origin 校验和 HTTPS Cookie 判断 |
| `SESSION_SECRET` | 会话安全 Secret；代码最低 24 字符，生产建议使用至少 32 个高熵字符 |
| `IP_HASH_SECRET` | 访客/IP HMAC Secret；必须与会话 Secret 不同 |
| `ADMIN_EMAIL` | Seed 创建或更新管理员时使用 |
| `ADMIN_PASSWORD` | Seed 计算管理员密码哈希时使用；应为唯一长密码 |
| `UPLOAD_MAX_BYTES` | 图片上传上限；默认 8 MiB，代码允许配置到 16 MiB |
| `AUDIO_UPLOAD_MAX_BYTES` | 音频上传上限；默认 25 MiB，代码允许 1 至 200 MiB |

生产环境应从 Secret 管理器注入敏感变量。完成首次 Seed 后，如果日常启动不再执行 Seed，可以从常驻运行环境移除 `ADMIN_PASSWORD`。

天气不需要 API Key。城市名、经纬度、IANA 时区与开关保存在站点设置中。

## SQLite 开发与升级

SQLite 的迁移按顺序位于：

```text
prisma/migrations/202607270001_init/
prisma/migrations/202607270002_personal_garden_v2/
```

`pnpm db:deploy` 会应用所有尚未执行的 SQLite 迁移。修改 SQLite schema 时使用：

```bash
pnpm db:migrate
```

查看数据：

```bash
pnpm db:studio
```

`pnpm db:seed` 会幂等写入基础分类、标签、文章、项目、时间线、站点设置和管理员。V2 的初始说说只会在数据库完全没有说说时创建。Seed 不会伪造访客留言、友链、照片、音乐、评论或订阅者，也不会清空用户创建的 V2 内容。

`pnpm db:verify` 输出文章、项目、分类、标签、用户、设置、评论和自动化测试残留的核心快照；它不是 V2 全表完整性检查。

升级已有数据库前先停止使用该文件的开发进程，并同时备份数据库与 `public/uploads`。不要在包含需要保留数据的环境运行 `prisma migrate reset`。

## MySQL 8 生产迁移

生产使用：

- `prisma/schema.mysql.prisma`
- `MYSQL_DATABASE_URL`
- `prisma/mysql-migrations/*`
- `pnpm build:mysql`

SQLite 与 MySQL 的 provider 和 SQL 方言不同。不要把 MySQL URL 写进 `DATABASE_URL`，也不要对 MySQL 运行 `pnpm db:deploy`。

### 全新空库

在空 MySQL 8 数据库中依次执行 V1 初始化和 V2 增量迁移：

```bash
pnpm db:mysql:generate
pnpm exec prisma db execute --schema prisma/schema.mysql.prisma --file prisma/mysql-migrations/202607270001_init/migration.sql
pnpm exec prisma db execute --schema prisma/schema.mysql.prisma --file prisma/mysql-migrations/202607270002_personal_garden_v2/migration.sql
```

如确实需要仓库内置初始内容，再执行：

```bash
pnpm db:mysql:seed
```

生产构建与启动：

```bash
pnpm build:mysql
pnpm start
```

### 已有 V1 数据库

先创建数据库和上传目录的同一恢复点备份，在预发布副本验证后，只应用：

```bash
pnpm db:mysql:generate
pnpm exec prisma db execute --schema prisma/schema.mysql.prisma --file prisma/mysql-migrations/202607270002_personal_garden_v2/migration.sql
pnpm build:mysql
```

V2 的 `rollback.sql` 会删除新增业务表，仅能在已经导出 V2 数据、应用也同步回退且确认可以丢弃新表时使用。

`pnpm db:mysql:diff` 输出“空库到当前 MySQL schema”的完整差异，只用于审阅，不是可直接反复应用到已有生产库的增量迁移。

如果先生成过 MySQL Prisma Client，回到本地 SQLite 开发前重新运行：

```bash
pnpm db:generate
```

当前仓库没有内置真实 MySQL 服务、TLS 凭据或生产连接，因此 MySQL 迁移必须在目标基础设施中重新验证。完整边界见 [V2 数据库迁移](docs/v2-database-migration.md)。

## 图片与音频上传

### 图片

管理员上传的 JPEG、PNG、WebP 和 AVIF 会经过：

1. 文件大小、扩展名、声明 MIME 与真实文件签名校验；
2. Sharp 解码与 4,000 万像素上限检查；
3. 自动旋转并重新编码为 WebP；
4. 生成不放大的 320、640、1200 和 2000 像素宽版本；
5. 写入 `public/uploads/YYYY/MM`；
6. 将主 URL、尺寸和全部变体写入 `Media`。

删除仍被相册、照片、说说、音乐封面或歌单封面引用的媒体会被拒绝。

### 音频

本地音频写入 `public/uploads/audio/YYYY/MM`，支持 MP3、M4A、AAC 和 OGG。上传接口会检查：

- 管理员会话与同源请求；
- multipart 类型和配置上限；
- 扩展名、声明 MIME 与真实文件签名一致性；
- 常见可执行文件签名；
- UUID 文件名和路径越界；
- 保存前后的文件大小与真实格式。

超过 24 小时且没有曲目引用的音频可能在后续上传时作为孤立文件清理。删除上传型曲目时，其本地音频文件也会删除。

远程曲目只接受公开 HTTPS 直链。服务端不会抓取、下载、转码或代理第三方音乐平台。

### 持久化边界

`public/uploads` 中的运行时文件被 Git 忽略。单机部署必须将它挂载到可备份的持久卷；多实例部署必须共享同一存储。

当前没有 S3、Cloudflare R2、Vercel Blob 等对象存储适配器。Serverless 或临时文件系统平台在改造存储层前不能可靠使用上传功能。数据库和上传目录必须作为同一恢复点备份，否则会产生失效 URL 或孤立文件。

## 天气

天气由管理员在后台设置：

- 城市级公开名称；
- 纬度和经度；
- IANA 时区，例如 `Asia/Shanghai`；
- `weatherEnabled` 开关。

浏览器不会请求 Geolocation，公开页面也不会显示经纬度。`/api/weather` 在服务端访问 Open-Meteo，使用 6 秒超时、响应结构校验和共享缓存；未配置、已关闭或上游不可用时返回稳定空状态，不阻断首页。

部署环境需要允许服务端访问 `https://api.open-meteo.com`。展示天气时应保留页面中的 Open-Meteo 署名。

## 音乐与版权

请只发布以下内容：

- 自己创作或录制且有权公开的音频；
- 已获得明确授权的文件；
- 许可允许公开嵌入的 HTTPS 音频直链；
- 自己撰写的音乐随记；
- 自有、公共领域或获授权的歌词。

不要抓取音乐平台、绕过防盗链、上传盗版音频，或复制完整的受版权保护歌词。数据库中的标题、艺人和专辑信息不等于获得了音频或歌词授权。远程 URL 的可用性、跨域策略和版权责任由站点运营者确认。

播放器不会自动播放，也不会绕过浏览器的媒体策略。

## 测试与质量检查

基础检查：

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

一次运行类型检查、Lint、Vitest 和 SQLite 生产构建：

```bash
pnpm verify
```

Playwright 配置使用已经构建的 `pnpm start`。先生成 SQLite Client 并构建，再运行：

```bash
pnpm db:generate
pnpm build
pnpm test:e2e
pnpm test:a11y
```

首次使用 Playwright 时安装浏览器：

```bash
pnpm exec playwright install chromium
```

清理端到端测试生成的文章和评论：

```bash
pnpm test:cleanup
pnpm db:verify
```

生成本地视觉截图：

```bash
pnpm build
pnpm visual:capture
```

README 不固化历史测试数量，也不把旧报告当作当前提交已经通过的证明。每次合并或发布都应重新执行与目标数据库和部署方式匹配的命令，并保存本次运行结果。`docs/testing-report.md` 是早期交付快照，V2 新路由的当前状态应以重新运行的测试输出为准。

## 部署边界

推荐生产拓扑为：

```text
浏览器
  └─ HTTPS 反向代理
       └─ 常驻 Next.js Node 进程
            ├─ MySQL 8
            └─ public/uploads 持久卷或已完成接入的对象存储
```

上线前至少需要：

1. 使用迁移账号在预发布副本验证两批 MySQL SQL；
2. 为数据库和上传存储创建可恢复备份；
3. 配置唯一 HTTPS `APP_URL` 和相互独立的 Secrets；
4. 使用最小权限 MySQL 运行账号；
5. 使用 `pnpm build:mysql`，不要用默认 SQLite 构建替代；
6. 配置代理的 Host、转发协议和足够的请求体上限；
7. 验证登录、公开读取、审核、图片/音频上传、删除和重启后持久化；
8. 重新运行类型、Lint、单元、端到端、响应式和无障碍检查。

仓库当前没有提供真实生产 MySQL、域名、TLS、共享卷、对象存储、备份恢复演练或长期运行监控结果。

## 安全要点

- 管理员密码只保存 bcrypt 哈希；
- 数据库会话只保存随机令牌的 SHA-256 哈希；
- Cookie 使用 `HttpOnly` 和 `SameSite=Lax`，HTTPS `APP_URL` 下启用 `Secure`；
- 写请求执行 Origin/Host 校验；
- 公开输入执行 Zod、纯文本约束、蜜罐和数据库限频；
- 原始 IP 不入库，只保存使用独立 Secret 计算的 HMAC；
- Markdown 在服务端清理；
- 图片和音频拒绝格式伪装、路径越界与可执行内容；
- Next.js 返回 `nosniff`、拒绝嵌入、严格 Referrer Policy 和禁用浏览器定位等安全头；
- 当前没有强制 CSP，生产应先在预发布使用 Report-Only 验证后再收紧。

## 文档索引

V2 文档优先：

- [V2 架构](docs/v2-architecture.md)
- [V2 数据库迁移与回滚](docs/v2-database-migration.md)
- [V2 后台指南](docs/v2-admin-guide.md)
- [V2 内容指南](docs/v2-content-guide.md)
- [V2 设计审计](docs/v2-design-audit.md)
- [V2 设计系统](docs/v2-design-system.md)
- [V2 参考图映射](docs/v2-reference-map.md)
- [Aibrium 公开参考研究](docs/reference-aibrium-analysis.md)

基础与早期交付文档：

- [技术架构](docs/architecture.md)
- [数据库与安全](docs/database-and-security.md)
- [后台使用指南](docs/admin-guide.md)
- [部署指南](docs/deployment.md)
- [设计调研](docs/design-research.md)
- [设计系统](docs/design-system.md)
- [视觉参考映射](docs/reference-map.md)
- [早期测试报告快照](docs/testing-report.md)

早期文档可能只覆盖 V1。若描述与当前源码、Prisma schema 或 V2 文档冲突，以当前源码和 V2 文档为准。
