# R7 数字花园测试报告

## 结论

本地交付验证已经通过：

- TypeScript 类型检查：通过。
- ESLint：通过。
- Next.js 生产构建：通过。
- Vitest：6 个测试文件，62 项通过，0 项失败。
- Playwright：106 项总计，78 项通过，28 项按测试项目条件主动跳过，0 项失败。
- axe：桌面 Chromium 完整审计 14 个页面/状态，0 个自动检测违规。
- 响应式：390 × 844 精确视口检查通过，无页面级横向溢出。
- 数据库：迁移、Seed、真实读取和端到端 CRUD 后数量验证通过。
- 生产依赖审计：`pnpm audit --prod` 未发现已知漏洞。
- 最终视觉：10 张生产构建截图完成，人工检查未见空白内容、框架错误覆盖层、浏览器 console error 或 page error。

以上结果来自本地环境，不代表已经完成线上 MySQL、真实域名、反向代理或对象存储验收。

## 验证环境

| 项目 | 值 |
| --- | --- |
| 操作系统 | Windows |
| Node.js | 24.14.0 |
| pnpm | 11.9.0 |
| Web 框架 | Next.js 16.2.12、React 19.2.8 |
| 本地数据库 | SQLite，`prisma/dev.db` |
| 端到端服务器 | `next start` 本地生产构建 |
| 桌面浏览器项目 | Chromium |
| 移动浏览器项目 | iPhone 13 设备模拟；响应式用例强制 390 × 844 |

## 执行结果

| 检查 | 命令 | 结果 |
| --- | --- | --- |
| 类型检查 | `pnpm typecheck` | 通过，0 个 TypeScript 错误 |
| Lint | `pnpm lint` | 通过，0 个 ESLint 错误 |
| 单元/组件 | `pnpm test` | 6 files / 62 passed / 0 failed |
| 生产构建 | `pnpm build` | 通过 |
| 端到端 | `pnpm test:e2e` | 106 total / 78 passed / 28 skipped / 0 failed |
| axe | `pnpm test:a11y` 或全量 E2E 中对应测试 | 14 个桌面审计通过 |
| 数据库 | `pnpm db:verify` | 数量符合 Seed 预期 |
| 生产依赖审计 | `pnpm audit --prod` | No known vulnerabilities found |
| 视觉截图 | `pnpm visual:capture` | 10 张完成 |

`pnpm verify` 包含类型检查、Lint、Vitest 和 SQLite 生产构建。Playwright、axe 专项和视觉截图需要在生产构建后单独执行。

## 为什么有 28 项 skipped

28 项为测试代码中的显式项目条件，不是失败，也不是运行时跳过：

- 14 个完整 axe 审计只在桌面 Chromium 项目执行，在移动项目主动跳过。
- 14 个精确 390 × 844 响应式检查只在移动项目执行，在桌面项目主动跳过。

因此两套项目合计为：

```text
106 total = 78 passed + 28 intentional skipped + 0 failed
```

## Vitest 覆盖

6 个测试文件：

| 文件 | 重点 |
| --- | --- |
| `tests/unit/components.test.tsx` | 组件渲染、导航与交互语义 |
| `tests/unit/content-helpers.test.ts` | 内容辅助逻辑 |
| `tests/unit/data.test.ts` | 数据查询与映射 |
| `tests/unit/security.test.ts` | 哈希、请求元数据与安全辅助逻辑 |
| `tests/unit/uploads-security.test.ts` | 上传格式、路径与媒体安全边界 |
| `tests/unit/validation.test.ts` | 表单和 API Zod 校验 |

最终结果：62 项全部通过。

## Playwright 覆盖

### 公开路由

覆盖：

- `/`
- `/blog`
- `/blog/array-to-linked-list-tradeoffs`
- `/archive`
- `/categories`
- `/tags`
- `/projects`
- `/projects/r7-digital-garden`
- `/about`
- `/now`
- `/contact`
- `/search?q=MySQL`

同时验证未知内容返回自定义 404，而不是流式边界产生的假 200。

### SEO 与分发

- `robots.txt` 指向站点地图。
- `sitemap.xml` 包含公开内容 URL。
- RSS 暴露已发布中文文章。
- 文章页包含 Canonical。

### 公开交互

- 搜索读取真实文章结果。
- 评论提交写入数据库并进入待审核状态。
- 主题切换生效并持久化。

### 管理后台

- 匿名访问受保护后台会重定向到登录。
- 无效凭据显示统一错误。
- 有效凭据进入真实后台。
- 文章创建、发布、编辑和删除完整 CRUD。
- 客户端与服务端共同拒绝伪造扩展名或 MIME 的上传文件。

### 响应式

精确设置 390 × 844 后验证：

- 12 个公开路径没有页面级横向溢出。
- 移动导航在视口内打开，并可使用 Escape 关闭。
- 管理员登录、后台概览和新建文章编辑器适应移动视口。

### 无障碍

axe 在桌面 Chromium 完整审计：

- 12 个公开路径；
- 管理员登录；
- 已登录后台概览。

共 14 个页面/状态，未检测到自动化无障碍违规。自动化 axe 不能替代真实读屏、人工键盘顺序和认知可用性测试；本结论仅限工具可检测规则。

## 数据库验证

SQLite 初始化迁移和幂等 Seed 已实际执行。端到端测试完成清理后，数据库数量为：

| 模型 | 数量 |
| --- | ---: |
| Post | 10 |
| Project | 6 |
| Category | 4 |
| Tag | 15 |
| User | 1 |
| SiteSetting | 22 |
| Comment | 1 |

这验证了 10 篇文章、6 个项目、4 个分类、15 个标签、管理员、站点设置和 Seed 评论仍然存在。生产 MySQL 未因缺少外部服务凭据而执行实库迁移；本次数据库结果来自真实 SQLite 文件，不是内存 mock。

## 三轮浏览器与视觉修复

### Round 1：建立失败基线

结果：

```text
59 passed / 19 failed / 28 skipped
```

首轮 Chromium/WebKit 定位阶段发现：

- 公开列表的 loading UI 与真实页面同时输出 `main#main-content`，造成重复 landmark。
- 详情页和根级流式边界让不存在内容以 HTTP 200 呈现，破坏真实 404。
- 后台 accent 色小字对比度不足。
- 在 HTTP `next start` 下无条件设置 Secure Cookie，WebKit 登录后不发送 Cookie，后台/API 返回 401。
- 评论与后台表单的 accessible name 不够明确，端到端 locator 产生歧义。

实际修复：

- loading 改为不再输出重复 `main`/id，并把列表 loading 放入正确 route group。
- 移除会吞掉 404 状态的详情与根级流式边界，恢复真实 404 响应。
- 小号 accent 文本改用对比度更高的 success token。
- Cookie 的 `secure` 改为依据 `APP_URL` 是否为 HTTPS 决定：本地 HTTP 可测试，生产 HTTPS 仍启用 Secure。
- 补全表单 accessible name；有状态 CRUD 用例串行执行；locator 收紧到精确作用域。

### Round 2：收敛定位与移动端断言

中间结果：

```text
69 passed / 9 failed / 28 skipped
77 passed / 1 failed / 28 skipped
```

这一轮先确认公开路由、axe 审计和移动端横向溢出已经全绿，再继续修复：

- 标题和导航使用 exact 匹配，避免相近文字命中多个元素。
- 评论断言限制到评论表单或评论区域，避免同文案跨区重复。
- 最后一个移动 CRUD 用例原本断言隐藏目录中的链接，改为断言编辑器内实际可见的 `h2`，使测试与移动信息层级一致。

### Round 3：全量通过与最终截图

全量结果：

```text
78 passed / 28 intentional skipped / 0 failed
```

首次运行最终 `fullPage` 截图时发现：Playwright 直接截完整页面不会逐段触发 `IntersectionObserver`，使用 Reveal 的后续内容因此在图片中像“空白”，但页面本身并未渲染失败。

实际修复 `scripts/capture-visuals.ts`：

1. 截图前按视口高度逐屏滚动；
2. 等待 Reveal 内容进入观察区域；
3. 到达页面底部后回到顶部；
4. 再执行完整页面截图；
5. 同时把 console error、page error、框架错误覆盖层和空正文作为失败条件。

重拍后人工检查首页浅色/深色、文章、项目、后台和 390 × 844 移动页面，内容完整，未发现 console error 或 page error。

## 最终视觉截图

目录：

```text
artifacts/visual-final
```

文件：

1. [`01-home-desktop-light.png`](../artifacts/visual-final/01-home-desktop-light.png) — 首页，桌面浅色。
2. [`02-blog-desktop-light.png`](../artifacts/visual-final/02-blog-desktop-light.png) — 文章列表，桌面浅色。
3. [`03-article-desktop-light.png`](../artifacts/visual-final/03-article-desktop-light.png) — 文章详情，桌面浅色。
4. [`04-project-desktop-light.png`](../artifacts/visual-final/04-project-desktop-light.png) — 项目详情，桌面浅色。
5. [`05-admin-login-desktop-light.png`](../artifacts/visual-final/05-admin-login-desktop-light.png) — 后台登录，桌面浅色。
6. [`06-admin-dashboard-desktop-light.png`](../artifacts/visual-final/06-admin-dashboard-desktop-light.png) — 后台概览，桌面浅色。
7. [`07-home-desktop-dark.png`](../artifacts/visual-final/07-home-desktop-dark.png) — 首页，桌面深色。
8. [`08-home-mobile-light.png`](../artifacts/visual-final/08-home-mobile-light.png) — 首页，390 × 844 浅色。
9. [`09-article-mobile-light.png`](../artifacts/visual-final/09-article-mobile-light.png) — 文章详情，390 × 844 浅色。
10. [`10-admin-login-mobile-light.png`](../artifacts/visual-final/10-admin-login-mobile-light.png) — 后台登录，390 × 844 浅色。

这些截图来自本地生产构建，不是设计稿或静态参考图。`design-references` 中的 66 张图片是设计过程参考，不计入最终页面截图。

## 已知验证边界

本次没有虚构以下未执行项：

- 未部署真实线上域名。
- 未连接或迁移真实 MySQL 8 实例。
- 未验证 MySQL TLS、连接池和托管平台限制。
- 未接入或验证 S3、Cloudflare R2、Vercel Blob。
- 未在真实共享卷上执行多实例上传一致性测试。
- 未进行生产流量压测、长时间稳定性测试或灾难恢复演练。
- axe 自动化通过不等于完整人工无障碍认证。
- 最终视觉人工检查覆盖 10 个代表性页面/状态，不等于每个后台筛选组合都做了像素级回归。

这些项目必须在获得生产基础设施、域名和凭据后进入上线验收。
