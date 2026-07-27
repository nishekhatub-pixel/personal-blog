# R7 Design System

## 设计读取

这是一个面向同学、招聘者与未来自己的中文学生开发者数字花园。视觉语言为编辑型数字杂志、开发者作品集与克制未来感的组合。

设计参数：

- DESIGN_VARIANCE: 8
- MOTION_INTENSITY: 6
- VISUAL_DENSITY: 4

## 品牌概念

### 名称

主标识：`R7`

中文概念：生长回路

英文辅助：Growth Loop

### 核心叙事

学习不是线性升级，而是一组持续回到起点的动作：阅读、练习、构建、复盘。数字“7”既是名字的一部分，也是页面中的路径折点和唯一结构性大图形。

### 品牌关键词

- Digital Garden
- Student Developer
- Learning in Public
- Music and Rhythm
- Growth
- Code and Life
- R7

### 标识规则

- 主标识使用定制排版的 `R7` 字标，不使用现成品牌 Logo。
- 字标保持纯色，不使用渐变填充或发光描边。
- 最小可视宽度为 28px。
- 字标周围安全区不小于字标高度的 25%。
- 大型“7”只能作为每页一次的结构性第二阅读层，不重复铺满页面。

## 色彩令牌

品牌只使用一套青绿色强调色。主题切换允许调整明度，但不改变色相身份。

### Light

| Token | Value | 用途 |
| --- | --- | --- |
| `--page` | `#F4F3ED` | 页面背景 |
| `--surface` | `#FBFAF6` | 提升表面 |
| `--surface-strong` | `#E8ECE8` | 强调分区 |
| `--ink` | `#17201D` | 主文字 |
| `--muted` | `#596660` | 次级文字 |
| `--line` | `#C9D0CC` | 边框与分隔 |
| `--accent` | `#087E69` | CTA、链接、焦点 |
| `--accent-soft` | `#D5EEE7` | 低强度强调背景 |
| `--danger` | `#B64040` | 错误与破坏性操作 |
| `--warning` | `#916314` | 警告 |
| `--success` | `#16745D` | 成功 |

### Dark

| Token | Value | 用途 |
| --- | --- | --- |
| `--page` | `#101613` | 页面背景 |
| `--surface` | `#17201C` | 提升表面 |
| `--surface-strong` | `#202C27` | 强调分区 |
| `--ink` | `#F0F3ED` | 主文字 |
| `--muted` | `#A8B5AE` | 次级文字 |
| `--line` | `#34423C` | 边框与分隔 |
| `--accent` | `#45D9B5` | CTA、链接、焦点 |
| `--accent-soft` | `#183A31` | 低强度强调背景 |
| `--danger` | `#FF8A86` | 错误与破坏性操作 |
| `--warning` | `#F3C56B` | 警告 |
| `--success` | `#74E0BE` | 成功 |

对比规则：

- 正文与背景达到 WCAG AA 4.5:1。
- 大型文字和图标达到至少 3:1。
- 禁用状态仍需可辨识，不只依赖透明度。
- 图片上方的文字必须有实色遮罩或独立安全区。

## 字体系统

### 字体家族

- Display 与拉丁正文：`Geist`, `"Segoe UI"`, sans-serif
- 中文正文：`"PingFang SC"`, `"Microsoft YaHei"`, `"Noto Sans CJK SC"`, sans-serif
- 代码与数字：`"Geist Mono"`, `"Cascadia Code"`, `"SFMono-Regular"`, monospace

只使用无衬线与等宽两个家族。中文正文优先系统原生渲染，减少下载体积和首屏阻塞。

### 流体字号

| Token | 建议值 | 用途 |
| --- | --- | --- |
| `--text-display` | `clamp(4rem, 12vw, 10rem)` | R7 大字标 |
| `--text-hero` | `clamp(2.75rem, 7vw, 6.5rem)` | 首页主标题 |
| `--text-h1` | `clamp(2.5rem, 6vw, 5.25rem)` | 内页标题 |
| `--text-h2` | `clamp(2rem, 4vw, 3.75rem)` | Section 标题 |
| `--text-h3` | `clamp(1.35rem, 2vw, 2rem)` | 卡片与文章标题 |
| `--text-body-lg` | `clamp(1.05rem, 1.3vw, 1.25rem)` | 导语 |
| `--text-body` | `1rem` | 正文 |
| `--text-small` | `0.875rem` | 元数据 |

正文行高 1.8，标题行高 0.95 至 1.15。中文正文最大宽度约 `68ch`。

## 栅格与尺寸

- 页面最大宽度：`1400px`
- 内容最大宽度：`1280px`
- 文章正文：`760px`
- 桌面栅格：12 列，间距 `24px`
- 平板栅格：8 列，间距 `20px`
- 手机栅格：4 列，间距 `16px`
- 页面边距：`clamp(16px, 4vw, 64px)`
- 导航高度：桌面 `68px`，移动端 `60px`
- Hero 使用 `min-height: 100dvh`，不使用 `100vh`

## 间距系统

基础单位为 4px。

| Token | Value |
| --- | --- |
| `--space-1` | `4px` |
| `--space-2` | `8px` |
| `--space-3` | `12px` |
| `--space-4` | `16px` |
| `--space-5` | `24px` |
| `--space-6` | `32px` |
| `--space-7` | `48px` |
| `--space-8` | `64px` |
| `--space-9` | `96px` |
| `--space-section` | `clamp(88px, 12vw, 176px)` |

## 形状、边框与阴影

形状规则：

- 内容卡片与媒体框：`12px`
- 输入框：`8px`
- 按钮：完整 pill
- 标签：仅在语义需要时使用 pill

边框：

- 普通分隔：`1px solid var(--line)`
- 焦点：`2px solid var(--accent)`，外加 3px 背景色间隔
- 不同时为长列表的每一行添加上下双边框

阴影：

- Light：`0 18px 60px rgb(23 32 29 / 0.10)`
- Dark：`0 18px 60px rgb(0 0 0 / 0.28)`
- 阴影只用于浮层、对话框和确有层级的媒体，不用于每一张卡片。

## 动效令牌

| Token | Value | 用途 |
| --- | --- | --- |
| `--duration-fast` | `160ms` | 按钮、焦点 |
| `--duration-base` | `280ms` | 菜单、筛选 |
| `--duration-slow` | `600ms` | Section 进入 |
| `--ease-standard` | `cubic-bezier(0.16, 1, 0.3, 1)` | 大多数过渡 |
| `--ease-emphasis` | `cubic-bezier(0.22, 1, 0.36, 1)` | 媒体揭示 |

动效只改变 transform 与 opacity。所有自动动效在 `prefers-reduced-motion: reduce` 下停用或立即完成。移动端位移距离降低 50%。

## Z-index

| Layer | Value |
| --- | --- |
| Base | `0` |
| Sticky content | `10` |
| Navigation | `30` |
| Popover | `40` |
| Modal backdrop | `50` |
| Modal | `60` |
| Toast | `70` |
| Skip link | `80` |

## 核心组件

### R7 Wordmark

纯文字几何字标。导航使用紧凑版本，Hero 使用大号版本。大号版本在浅色与深色中保持同一轮廓，不使用发光。

### Editorial Rail

用于文章和项目索引。左侧是稳定的时间或类别线索，右侧内容拥有不同宽度和媒体比例。移动端回到单列。

### Growth Timeline

学习、练习、项目和目标沿一条折线路径展开。路径表示顺序，不使用伪统计进度条。

### Interest Accordion

音乐与运动以宽度变化的横向切片展示。键盘聚焦与点击均可展开，移动端改为纵向 disclosure。

### Layered Media Frame

使用 16:10、4:3、3:2 和 1:1 四种固定比例。框外允许单次轻微错位，内部图片统一 `object-fit: cover`，正文图片统一 `contain`。

### Buttons

- Primary：强调色填充，文字对比达到 AA
- Secondary：透明底加清楚边框
- Text link：下划线或箭头，不伪装成按钮
- `:active` 轻微缩放到 `0.98`
- 桌面 CTA 不允许换行

### Forms

- Label 始终位于输入框上方
- Placeholder 不替代 Label
- Helper text 位于输入框下方
- Error text 与字段关联并包含文字说明
- 最小控件高度 `44px`

## 页面级构图

### 首页

Hero 为非对称中央构图。R7 大字标形成背景结构，身份与 CTA 位于前景安全区，学习状态作为真实状态信息。后续 section 在文章索引、项目媒体、技能文字矩阵、时间线和兴趣折叠条之间切换节奏。

### 博客

标题、搜索和分类形成一个开放式编辑页头。精选文章使用不等比例媒体，普通文章使用可扫描列表。分页是真实链接，不使用假加载按钮。

### 文章

标题和封面之后进入窄正文。桌面目录固定于正文侧边，移动端折叠。阅读进度使用顶部细线。代码、表格和图片拥有独立窄屏处理。

### 项目

列表使用分层媒体框和不同跨列尺寸。详情页从背景、目标、技术实现、图像证据到复盘依次展开。

### 关于

以自我介绍、学习经历、技能、兴趣、当前目标和联系方式组成连续叙事。没有虚构履历和奖项。

### 后台

后台不使用营销页的高方差构图。采用 12 列数据网格、清晰侧栏和可操作表格，共用字体、颜色、按钮和表单令牌。高密度内容仍保留 44px 触控目标与响应式抽屉。

## 无障碍检查

- 提供跳过导航链接。
- Heading 不跳级。
- 所有图片有语义化 Alt。
- 图标按钮有可读名称。
- 菜单、对话框、灯箱与抽屉管理焦点。
- 所有互动支持键盘。
- 状态不只依赖颜色。
- 亮暗主题均检查正文、表单、代码块和按钮对比。

## 预检结论

- 单一青绿色强调色已锁定。
- 页面在任一时刻保持统一主题。
- Hero 非左文右图，主标题控制在两行内。
- 不使用紫蓝 AI 渐变、无意义光球、玻璃卡片堆叠、伪终端和三等分功能卡。
- 真实图片与参考图均来自本项目生成资产或用户上传内容。
- 动效支持减少动态偏好并在移动端降级。
