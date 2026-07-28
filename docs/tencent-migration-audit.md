# 腾讯云轻量应用服务器迁移审计

审计日期：2026-07-28  
审计分支：`codex/warm-garden-visual-redesign`

## 结论

当前项目可以作为标准 Node.js 应用运行，适合使用 Next.js standalone、PM2
和 Nginx 部署到 Ubuntu。项目没有依赖 Vercel Blob、Vercel Postgres、
Vercel KV、Vercel Cron 或 `@vercel/*` SDK。

主 Prisma schema 已经是 PostgreSQL，不需要把业务模型从 SQLite 改写成
PostgreSQL。当前本地环境的 `DATABASE_URL` 指向托管 PostgreSQL；迁移到
腾讯云时可以先继续使用该数据库，确认应用稳定后再单独安排数据库搬迁，
这是风险最低的顺序。

`prisma/dev.db` 是遗留 SQLite 文件，不是当前主 schema 的数据源。它已在
代码改造前备份到工作区外：

`C:\Users\sveta\Documents\个人博客-backups\dev-before-tencent-20260728-111952.db`

备份文件与源文件的 SHA-256 一致。该备份不替代正式 PostgreSQL 的
`pg_dump`。

## 项目运行方式

- Next.js：16.2.12
- React：19.2
- 路由：App Router（`src/app`）
- TypeScript：5.9
- Prisma Client / CLI：6.19
- 主数据库：PostgreSQL，schema 为 `prisma/schema.prisma`
- 备用生产 schema：MySQL，文件为 `prisma/schema.mysql.prisma`
- 主、备用 schema 均包含 27 个业务模型
- 包管理器锁文件：`pnpm-lock.yaml`
- 现有脚本：
  - `dev`：Next.js 开发服务器
  - `build`：生成 PostgreSQL Prisma Client 后构建
  - `build:mysql`：生成 MySQL Prisma Client 后构建
  - `start`：标准 Next.js Node.js 服务器
  - `lint`、`typecheck`、`test`、`test:e2e`、`test:a11y`

Next.js 官方说明标准 Node.js server 支持完整 Next.js 功能，standalone
输出会生成最小化生产运行文件：

- https://nextjs.org/docs/app/getting-started/deploying

## Vercel 绑定审计

没有发现以下依赖：

- Vercel Blob
- Vercel Postgres
- Vercel KV
- Vercel Analytics
- Vercel Cron
- `@vercel/*`

仓库中的 `vercel.json` 只指定了 pnpm 安装命令。它可以保留用于旧 Vercel
部署回退，不影响 Ubuntu 上的 standalone 运行。

当前上传实现写入 `public/uploads`。这在 Vercel 临时文件系统上不能作为
可靠持久存储，也是 100 MB 本地上传在 Vercel Functions 上不能完整落地
的根本限制之一。腾讯云部署会改为项目目录外的持久化根目录，并继续保存
`/uploads/...` 相对公开 URL。

## Sharp 与文件上传

- `sharp@0.35.3` 位于 `dependencies`
- Linux x64 的 Sharp 与 libvips 包位于 `optionalDependencies`
- 图片只在上传处理叶子模块中动态加载 Sharp
- 上传 Route Handler 显式使用 Node.js runtime
- 没有把 Windows `node_modules` 作为部署产物的设计
- Linux 必须在服务器上重新安装依赖，不能复制本机 `node_modules`
- Next.js 图片优化继续开启，不通过关闭优化规避 Sharp 问题

当前文件存储的待改问题：

- 图片根目录硬编码为 `public/uploads`
- 音频根目录硬编码为 `public/uploads/audio`
- `/uploads/[...path]` 只识别旧图片变体路径
- 项目构建目录与上传目录没有隔离

迁移改造将保留数据库中的旧 URL，并新增统一、可校验的本地存储适配层。

## Serverless、Runtime 与缓存

- 未发现 Edge Runtime
- 图片、音频和上传读取接口均使用 Node.js Runtime
- Prisma、文件系统、Sharp、音乐元数据解析均在服务端执行
- Server Components、Server Actions、Route Handlers 和动态路由均可由
  标准 Next.js Node.js server 运行
- 天气接口保留服务端缓存头和失败降级
- RSS、Sitemap 与 SEO 路由不依赖 Vercel API

## 鉴权与反向代理

项目不是 NextAuth/Auth.js，而是自定义数据库 Session：

- Session token 仅以哈希形式存入数据库
- Cookie 为 `httpOnly`、`sameSite=lax`
- `APP_URL` 为 HTTPS 时自动启用 Secure Cookie
- 写操作使用 Origin/Host 同源校验
- Nginx 必须转发 `Host`、`X-Forwarded-Host`、`X-Forwarded-Proto`、
  `X-Forwarded-For` 和 `X-Real-IP`
- 生产 `APP_URL` 必须与最终 HTTPS 域名完全一致

无需添加未使用的 `NEXTAUTH_URL`、`NEXTAUTH_SECRET` 或 `AUTH_SECRET`。

## 数据库迁移风险

PostgreSQL migrations 已存在于 `prisma/migrations`，生产只允许使用：

```bash
npx prisma generate
npx prisma migrate deploy
```

禁止在生产执行 `prisma migrate reset` 或无备份的 `db push`。

现有托管 PostgreSQL 搬迁到腾讯云 PostgreSQL 时，必须：

1. 记录源数据库版本和扩展。
2. 使用 `pg_dump --format=custom` 生成一致性备份。
3. 在新库执行 migration 或恢复 dump，不能两者盲目叠加。
4. 比较表、行数、关键业务记录和 Prisma 读取。
5. 切换前暂停写入并做最后一次增量/最终备份。
6. 保留旧连接串，验证失败时回滚应用环境变量。

Prisma 官方将 `migrate deploy` 定义为生产/预发布环境应用待执行 migration
的命令：

- https://www.prisma.io/docs/cli/migrate/deploy

## 建议部署边界

- 新项目目录：`/var/www/r7-next-blog`
- 持久化目录：`/var/www/r7-blog-storage`
- 应用端口：`127.0.0.1:3000`
- PM2 应用名：`r7-blog`
- PM2 使用单实例 fork 模式
- Nginx 使用新的站点配置和独立域名或子域名
- 不覆盖旧 PHP 站点目录、Nginx 配置、数据库或上传文件

## 当前未执行的操作

- 未连接腾讯云服务器
- 未安装、删除或重启任何服务器服务
- 未修改生产 PostgreSQL 数据
- 未执行数据库导入、导出或切换
- 未修改真实 `.env`
- 未申请域名证书

只有拿到服务器地址、SSH 用户/密钥、目标域名和数据库选择后，才进入服务
器只读检查与实际部署阶段。
