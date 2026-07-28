# 腾讯云部署准备验证报告

验证日期：2026-07-28
分支：`codex/warm-garden-visual-redesign`

## 结论

本地代码已经具备 PostgreSQL、外部持久化上传目录、Next.js standalone、
npm、PM2 和 Nginx 部署条件。standalone 产物已真实启动并读取当前
PostgreSQL；主要公开路由和后台登录页均返回 200。

本报告只证明本地交付物。由于没有腾讯云 SSH、域名和服务器数据库权限，
没有执行真实服务器安装、Nginx reload、PM2 启动、数据库搬迁或 HTTPS
签发。

## 依赖与 npm

- 在不读取现有 pnpm `node_modules` 的隔离目录生成
  `package-lock.json`：通过
- 隔离目录执行 `npm ci --include=optional`：通过
- npm 实际安装：629 packages
- npm 安装后的 Sharp 加载：
  - Sharp：0.35.3
  - libvips：8.18.3
  - 本地验证平台：Windows x64
- `package-lock.json` 同时包含 Linux x64 的 Sharp 与 libvips 可选包：
  - `@img/sharp-linux-x64@0.35.3`
  - `@img/sharp-libvips-linux-x64@1.3.2`
- `npm run build`：通过

Linux 仍必须在 Linux release 目录执行 `npm ci`，不能复制 Windows
`node_modules`。

## 静态检查与单元测试

- TypeScript `tsc --noEmit`：通过
- ESLint：通过，0 error
- Vitest：12 files / 91 tests 通过
- `git diff --check`：通过
- `node --check ecosystem.config.cjs`：通过
- Git Bash `bash -n deploy/deploy.sh`：通过

## 生产构建

- Next.js：16.2.12
- Prisma Client：6.19.3
- PostgreSQL Prisma Client generate：通过
- `pnpm build`：通过
- `npm run build`：通过
- 生成 44 个静态页面，其余动态路由正常进入 standalone trace
- `.next/standalone/server.js`：已生成
- `public` 与 `.next/static`：由
  `scripts/prepare-standalone.mjs` 自动复制
- Prisma 的旧 `package.json#prisma` 弃用警告：已通过直接 seed script
  消除

## Standalone 冒烟

使用 `.next/standalone/server.js` 在 `127.0.0.1:3110` 实际启动，并连接
当前 PostgreSQL。

以下路由均返回 HTTP 200：

- `/`
- `/blog`
- `/photos`
- `/music`
- `/moments`
- `/guestbook`
- `/friends`
- `/about`
- `/admin/login`

首页引用的 `/_next/static/*.css` 返回 HTTP 200，证明 standalone 资源复制
完整。

第一次在受限网络沙箱中启动时，Prisma 无法建立外部 TLS 连接；改为允许当前
测试进程访问现有 PostgreSQL 后，同一构建全部路由通过。这不是应用错误。

## Sharp 边界验证

`pnpm verify:sharp`：通过。

```json
{
  "platform": "win32",
  "arch": "x64",
  "sharp": "0.35.3",
  "vips": "8.18.3",
  "encodedBytes": 64,
  "protectedAdminPagesWithoutSharp": 31,
  "lazyUploadRoutesWithLinuxRuntime": 2,
  "largestUploadTraceMb": 121.64,
  "verifiedLocalRoutes": 13
}
```

图片处理仍只在上传叶子模块动态加载 Sharp，普通后台页面不会静态引入它。

## Playwright 与 axe

完整命令 `pnpm test:e2e` 使用 standalone server 执行：

- 110 passed
- 47 skipped（桌面/移动项目的互斥配置）
- 1 failed

失败项是桌面文章 CRUD 在等待保存后的 URL 时超过原 5 秒；同一文章 CRUD
在该次完整运行的移动项目中通过。当前 PostgreSQL 是远程托管连接，运行中
也出现过一次可恢复的连接瞬断。

已将保存 URL 的等待窗口从 5 秒调整为 15 秒，并单独重跑完整桌面文章
CRUD：

- 1 passed，包含创建、发布、公开读取、修改、删除和 404 验证

因此所有测试场景都在最终代码上通过过，但没有声称最后一次 158 项是单次
全绿运行。

测试结束后执行 `pnpm test:cleanup`，清理了失败用例遗留的 1 篇自动化
文章；`pnpm db:verify` 确认所有测试文章、评论、说说、留言、友链、相册与
媒体残留均为 0。

axe 结果来自完整运行：

- 20 个桌面公开/后台页面通过
- 没有自动检测到的 axe violation
- 移动 axe 项由项目配置跳过，移动响应式测试单独执行

响应式结果：

- 375 × 812 的 17 个主要路由无页面级横向滚动
- 移动菜单、底部 Dock、reduced motion 和移动后台通过
- 1440px 三栏首页通过
- 1440、1280、1024、768、430、390、375 接受矩阵通过

## 未在本机执行

- Nginx `nginx -t`：本机没有 Ubuntu Nginx 环境
- PM2 `startOrReload`：本机未安装目标服务器 PM2
- Ubuntu Linux Sharp 加载：需在真实服务器 `npm ci` 后再次验证
- `prisma migrate deploy` 到目标腾讯云数据库
- `pg_dump` / `pg_restore` 生产数据迁移
- 腾讯云防火墙、DNS、Nginx、HTTPS 和旧 PHP 站点并存验证

真实服务器阶段必须先执行
`DEPLOY_TENCENT_CLOUD.md` 的只读检查，再决定安装和切换步骤。
