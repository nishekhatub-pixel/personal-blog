# R7 Personal Garden V2 架构

## 产品边界

V2 沿用现有 Next.js 16 App Router 应用，不新建项目，也不把原有文章、项目、评论、媒体、SEO、订阅和后台能力拆成另一套系统。新增的照片、音乐、说说、留言墙与友链共享同一个认证、数据库、媒体库、设计令牌和发布状态体系。

公开站点的原则是“服务端读取，交互叶子客户端化”：

```text
公开页面 Server Component
  ├─ src/lib/data.ts               文章、项目、兼容设置
  ├─ src/lib/garden-data.ts        相册、照片、说说、音乐、留言、友链、日历
  └─ Prisma Client
       ├─ SQLite（本地与自动化验证）
       └─ MySQL 8（生产 schema）

客户端交互叶子
  ├─ AudioPlayerProvider           跨页面播放状态
  ├─ ContentCalendar              月份切换与键盘导航
  ├─ PhotoLightbox                焦点管理、ESC、前后切换
  ├─ MomentInteractions           点赞与待审核评论
  ├─ Guestbook/Friend forms       公开申请
  └─ AtmosphereProvider           花瓣偏好与减少动态效果
```

## 公开路由

| 路由 | 数据与职责 |
| --- | --- |
| `/` | 三栏首页、真实统计、混合内容流、音乐、天气、日历 |
| `/photos` | 公开相册列表 |
| `/photos/[slug]` | 自然比例照片流与可访问灯箱 |
| `/music` | 全站播放器、播放队列、公开歌单与音乐随记 |
| `/moments` | 说说时间线、图片、点赞、待审核评论 |
| `/guestbook` | 已审核留言与提交表单 |
| `/friends` | 已发布友链与待审核申请 |
| `/calendar` | 指定日期的文章、项目、说说和照片摘要 |
| `/about` | R7 学习、项目、兴趣、目标与技术生态 |

原有 `/blog`、`/projects`、`/archive`、分类、标签、搜索、联系、RSS 与 SEO 路由继续保留。

## 首页组合

桌面端在 1280px 及以上为三栏：

- 左栏：资料、真实数量、快捷入口、配置时区时钟、运行统计。
- 中栏：紧凑欢迎区与数据库驱动的混合内容流。
- 右栏：全站音乐、城市级天气、内容日历。

1024–1279px 时资料区横跨顶部，下方为主内容和辅助栏；768px 以下为严格单列。固定底部 Dock 只在移动端出现，Footer 预留安全区。

## 音乐状态

`AudioPlayerProvider` 位于公开站点布局内，因此 App Router 页面切换不会销毁同一个 `<audio>` 元素。它只在用户触发播放后调用 `HTMLMediaElement.play()`，不自动播放。音量、当前曲目、队列、循环与随机偏好写入 `localStorage`；服务端初次输出不读取浏览器存储，从而避免 hydration mismatch。

本地音频由 `/api/admin/audio` 接收。远程音频只允许管理员录入公开 HTTPS 直链；服务端不会下载、抓取或代理第三方音乐平台。

## 天气与位置

浏览器不会请求 Geolocation。管理员只配置城市名称、经纬度和 IANA 时区，公开页面仅显示城市名称。`/api/weather` 在服务端请求 Open-Meteo：

- 30 分钟共享缓存；
- 6 秒超时；
- 响应结构经 Zod 校验；
- 服务不可用时返回稳定空状态，不阻断首页；
- 测试通过 mock fetch，不依赖真实网络。

## 互动与审核

公开写请求统一执行：

1. Origin/Host 同源检查；
2. JSON 或 multipart 类型检查；
3. Zod 校验和纯文本约束；
4. 蜜罐；
5. HMAC IP/访客标识与数据库限频；
6. 默认待审核或草稿状态。

留言、说说评论和友链申请不会因提交成功立即公开。访客邮箱、联系信息、User-Agent 与 IP 哈希只在需要的后台或数据库边界存在。

## 媒体与文件

图片继续复用现有 Media 管线：文件签名、声明 MIME、扩展名、体积和像素上限检查后，通过 Sharp 重编码为 WebP 响应式版本。照片只引用 Media 记录，不复制图片。

音频使用独立上限和目录 `public/uploads/audio/YYYY/MM`。文件名为 UUID，路径必须保持在音频根目录内。MP3、M4A/AAC 与 OGG 均同时核验扩展名、MIME 和真实签名；大型音频不会提交到 Git。

## 性能与降级

- Server Components 承担数据库读取。
- 首页内容限制为 8 项，音乐与分页查询有上限。
- 日历只查询目标月份附近的窄时间窗口。
- 图片使用 `next/image`、响应式 sizes 与懒加载。
- 花瓣节点数量：桌面 16/20/24，移动 5/7/8。
- 花瓣只动画 transform/opacity，且使用确定性 seed。
- `prefers-reduced-motion: reduce` 时花瓣、跑马灯、轨道和列表入场动画停止。
- 文章正文、后台和密集表单不渲染花瓣。

## 部署边界

SQLite 适用于单机本地开发与测试。生产使用 `prisma/schema.mysql.prisma` 和独立 MySQL 增量迁移。当前上传实现需要持久卷；Serverless 临时文件系统必须先替换为对象存储适配器。真实 MySQL、域名、TLS、持久卷和天气服务生产配额都需要在部署环境二次验收。
