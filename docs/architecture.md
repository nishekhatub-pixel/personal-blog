# R7 博客技术架构

## 选择结论

当前仓库是空白项目，工作环境提供 Node.js，因此采用 Next.js App Router、TypeScript、Tailwind CSS v4、Motion、Prisma、Zod 和 SQLite/MySQL 双环境策略。公开页面优先使用 Server Components 读取内容；管理变更使用带权限检查的 Server Actions；上传、评论、订阅、联系、统计和 RSS 使用 Route Handlers。

## 为什么这样选择

- Next.js 同时覆盖公开页面、SEO、动态路由、后台和 API，减少学生项目的运维面。
- TypeScript 和 Zod 在编译期与请求边界共同约束数据形状。
- Prisma 提供参数化查询、关系模型、迁移与可复现种子数据。
- Tailwind v4 配合项目级设计令牌，方便在不引入模板观感的前提下快速维护响应式界面。
- Motion 只负责进入、反馈与空间关系动画；复杂滚动时间轴没有足够产品价值，因此不引入 GSAP。
- 自定义数据库会话使用 HttpOnly Cookie、随机令牌哈希、过期与撤销记录，避免把授权判断交给客户端。

## 数据库环境

### 本地与自动化测试

使用 SQLite，原因是当前 Windows 工作区没有 MySQL 服务、Docker 或 PHP。SQLite 仍通过真实 Prisma 迁移、真实 CRUD、真实查询、真实会话和真实种子数据运行，不是内存 mock。

### 生产

使用 MySQL 8。项目单独维护 `prisma/schema.mysql.prisma` 和 MySQL 初始化迁移。生产构建必须针对 MySQL schema 生成 Prisma Client，并在预发布数据库执行迁移。SQLite URL 不能直接替换为 MySQL URL，因为 provider 与迁移 SQL 都不同。

### 部署边界

- Vercel 等无状态平台不能持久保存 SQLite 文件或 `public/uploads`。
- 生产环境需要托管 MySQL，以及 S3、Cloudflare R2、Vercel Blob 或持久卷作为媒体存储。
- 本地上传实现保留统一的媒体记录和 URL 结构，后续替换存储适配器时不影响文章数据模型。

## 请求与权限边界

```text
浏览器
  ├─ 公开页面 Server Components ── 内容查询层 ── Prisma ── 数据库
  ├─ 公开表单 / API ── Zod + Origin + 限流 ── Prisma
  └─ 管理后台
       ├─ 登录 ── 密码哈希 + 登录限流 ── Session
       ├─ 页面布局 ── requireAdmin
       └─ Server Actions / 管理 API ── requireAdmin + Zod + 审计字段
```

`proxy.ts` 或路由重定向只能优化体验，真正权限校验始终放在读取或写入数据之前。媒体上传额外执行扩展名、声明 MIME、文件魔数、大小和像素尺寸检查，再用 Sharp 重编码并生成响应式变体。

## 内容与索引

- 文章、项目、分类、标签、评论、时间线、媒体、站点设置和浏览数据均由数据库驱动。
- `slug` 唯一索引保证稳定 URL。
- 文章通过状态和发布时间复合索引支持公开列表与后台过滤。
- 标签使用显式中间表，便于排序、统计和 MySQL 迁移。
- 评论保留审核状态、父评论、自定义作者信息与 IP 哈希，不公开邮箱。
- 搜索使用 Prisma 参数化 `contains` 查询；生产数据量增长后可替换为 MySQL FULLTEXT，页面接口不变。

## 关键目录

```text
src/app/(site)       公开站点
src/app/admin        管理后台
src/app/api          上传、评论、订阅、联系和统计接口
src/actions          受保护的后台变更
src/components       站点、内容、后台和共享组件
src/lib              数据库、会话、校验、搜索、上传和 Markdown
prisma               SQLite/MySQL schema、迁移和种子
database             生产 MySQL SQL
tests/unit           单元与组件测试
tests/e2e            浏览器、移动端和无障碍测试
```

## 性能策略

- 默认 Server Components，只有菜单、主题、目录、复制、编辑器和表单反馈使用 Client Components。
- 生成素材使用 `next/image` 自动生成响应式格式和尺寸。
- 字体使用本地系统中文无衬线与等宽回退，避免首次构建时下载远程字体。
- 长列表使用服务端分页；搜索参数进入 URL，可分享且支持无 JavaScript 首次请求。
- 动效仅使用 `transform` 与 `opacity`，并尊重 `prefers-reduced-motion`。

## 安全策略

- bcrypt 密码哈希；数据库只保存会话令牌哈希。
- Cookie 使用 HttpOnly、SameSite=Lax，生产环境开启 Secure。
- 所有写入做 Zod 校验、会话与角色检查、Origin 检查和频率限制。
- Markdown 渲染通过白名单清理，代码高亮不执行内容脚本。
- 上传文件随机命名并由 Sharp 重编码，拒绝 SVG 和可执行格式。
- 登录、评论、联系和浏览访客标识只保存加盐哈希 IP。
- 错误响应不暴露数据库连接、绝对路径、密钥或堆栈。
