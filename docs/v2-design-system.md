# R7 Digital Garden V2 设计系统

## 设计定位

R7 Digital Garden 是一个软件技术专业学生长期记录学习、构建、音乐、运动与日常的个人网络空间。它不是企业官网、SaaS 落地页、组件展览或资深工程师履历。

设计关键词：

- Warm digital garden
- Personal living space
- Editorial blog
- Soft dashboard
- Music and memory
- Student developer
- Calm and alive

设计拨盘：

- `DESIGN_VARIANCE: 6`
- `MOTION_INTENSITY: 4`
- `VISUAL_DENSITY: 5`

## 原则

1. 内容先于装饰。
2. 真实数据先于视觉完整。
3. 空状态必须比假内容更可信。
4. 首页可以像生活面板，正文必须像阅读空间。
5. 一个页面只允许一个主要强调色。
6. 卡片只在需要分组或抬升层级时出现。
7. 动画必须表达层级、状态或反馈。
8. 深浅主题保持相同信息架构。

## 色彩令牌

以下值是 R7 V2 的原创实现方向，不来自参考站取色。

### 浅色

```css
:root {
  --canvas: #f6efe5;
  --surface: #fffaf3;
  --surface-strong: #eee3d5;
  --ink: #2b241f;
  --muted: #6f6258;
  --quiet: #94867a;
  --line: rgb(91 69 51 / 16%);
  --line-strong: rgb(91 69 51 / 28%);
  --accent: #b85f12;
  --accent-soft: #f8e2c4;
  --accent-ink: #fff9f0;
  --success: #627d68;
  --danger: #b84c47;
  --petal-color: rgb(209 132 103 / 32%);
  --music-glow: rgb(184 95 18 / 18%);
}
```

### 深色

```css
[data-theme="dark"] {
  --canvas: #1c1713;
  --surface: #261f1a;
  --surface-strong: #322821;
  --ink: #f4eadc;
  --muted: #b9aa9c;
  --quiet: #8f8074;
  --line: rgb(244 234 220 / 14%);
  --line-strong: rgb(244 234 220 / 25%);
  --accent: #e39a43;
  --accent-soft: rgb(227 154 67 / 14%);
  --accent-ink: #26170b;
  --success: #8ba68e;
  --danger: #e07b73;
  --petal-color: rgb(205 135 108 / 18%);
  --music-glow: rgb(227 154 67 / 12%);
}
```

### 对比规则

- 主按钮使用 `--accent` 与 `--accent-ink`，交付前通过 WCAG AA 对比检查。
- 次级文字使用 `--muted`，不可用 `--quiet` 替代正文。
- 鼠尾草只用于真实成功状态、在线状态或已发布状态。
- 错误、危险和删除不使用琥珀，以避免与主操作混淆。

## 阴影与材质

```css
--shadow:
  0 1px 1px rgb(91 69 51 / 5%),
  0 12px 36px rgb(91 69 51 / 10%);
--shadow-raised:
  0 2px 2px rgb(91 69 51 / 6%),
  0 18px 46px rgb(91 69 51 / 14%);
--shadow-pressed:
  inset 0 2px 5px rgb(91 69 51 / 13%);
```

- 表面主要依赖色差、边线与留白。
- 阴影只用于播放器、欢迎卡、表单、灯箱、悬停相册和重要浮层。
- 不使用纯黑投影、厚重双层新拟态或全局玻璃拟态。
- 音乐封面 Backlight 只是一层低透明度模糊色，不是霓虹外发光。

## 字体

- 中文正文：继续使用现有本地系统无衬线栈。
- 英文与数字：继承无衬线栈。
- 代码、时钟、日期短标签：现有等宽栈。
- 不从远程 CDN 加载字体。
- 不为强调词随机混入衬线体。

建议层级：

| 用途 | 尺寸 |
| --- | --- |
| 首页 H1 | `clamp(2.35rem, 5vw, 4.8rem)` |
| 内页 H1 | `clamp(2.2rem, 4vw, 4.2rem)` |
| Section H2 | `clamp(1.7rem, 3vw, 2.7rem)` |
| 卡片标题 | `1.05rem` 至 `1.35rem` |
| 正文 | `1rem`，行高 `1.75` |
| 元信息 | `0.78rem` 至 `0.88rem` |

- 中文正文移动端不小于 16px。
- 首页 H1 最多两行。
- 正文列保持 60ch 至 68ch。

## 形状系统

```css
--radius-panel: 1.125rem;
--radius-media: 0.75rem;
--radius-control: 0.625rem;
--radius-pill: 999px;
```

规则：

- 主面板：18px。
- 媒体、次级面板：12px。
- 输入、图标按钮：10px。
- 主要和次要 CTA：胶囊。
- 时间线、正文段落、列表行不额外套圆角卡。

## 页面宽度和网格

### 全局

```css
--content-max: 91.25rem;
--page-gutter: clamp(1rem, 3.4vw, 3.5rem);
--garden-gap: clamp(1rem, 1.5vw, 1.375rem);
```

### 首页

- `>=1280px`：`252px minmax(0, 1fr) 296px`
- `1024px-1279px`：个人资料横跨两列；主体 `minmax(0,1fr) 300px`
- `<768px`：严格单列
- `<430px`：音乐与天气允许从双格降为单列

sticky 规则：

- 只在 `min-width: 1280px` 且 `min-height: 900px` 启用。
- 顶部偏移包含 header、动态条与 16px 间距。
- sticky 内容自身不能高于可视区。
- 不使用 fixed 左右栏。

### 独立页面

- 文章与说说：约 900px 阅读宽度。
- 相册与留言墙：约 1240px 至 1400px。
- 音乐：约 1240px。
- 关于：约 1160px。
- 后台：沿用现有 AdminShell。

## 导航

桌面：

- 顶部单行，高度 64px 至 72px。
- 一级导航：首页、文章、项目、归档、照片墙、音乐、说说、留言墙、友链、关于。
- 搜索使用图标入口。
- 主题和花瓣开关使用次级图标控制。
- 不显示公共 Dock。

移动：

- 顶部栏只保留 R7、搜索、主题和菜单。
- 固定底部 Dock：主页、文章、照片、说说、音乐。
- 其余页面在移动菜单中。
- Dock 控制区约 72px，另加安全区。
- 每项最小 44px。
- 页面与 Footer 预留 `calc(5.25rem + env(safe-area-inset-bottom))`。

## 核心组件

### TactileButton

- hover：`translateY(-1px)`，切换为 `--shadow-raised`。
- active：`translateY(1px) scale(.985)`，切换为 `--shadow-pressed`。
- focus-visible：2px 对比清晰的焦点环。
- disabled：不响应位移。

### NoticeMarquee

- 数据来自 `noticeText`、`nowText`。
- 页面只出现一次。
- hover 暂停。
- reduced-motion 静态显示单份文本。
- 不复制内容填满整条。

### KineticText

- 只用于 R7 或“生长回路”。
- 单字符位移不超过 3px。
- 不抖动、不循环高频变形。
- reduced-motion 直接渲染普通文字。

### Highlighter

- 全首页最多两处。
- 仅强调“软件技术专业学生”和“数字花园”。
- 使用低透明度琥珀笔触，不遮挡字形。

### PetalField

- 页面：首页、照片墙、留言墙。
- 桌面 16 至 24 个，移动 5 至 8 个。
- 确定性 seed。
- `pointer-events: none`、`aria-hidden`。
- 只动画 transform 与 opacity。
- 深色降低亮度。
- reduced-motion 完全不渲染。
- 用户本地开关优先，管理员全局开关作为上限。

### Backlight

- 只包围真实音乐封面。
- 没有封面或没有歌曲时不生成假色块。
- 低透明度，深色模式进一步降低。

### ContentCalendar

- 使用原生 Date 和 Intl。
- 查询当前月，不加载全年明细。
- 标记文章、说说、照片和项目更新日。
- 支持上月、下月、今天与方向键。
- 每个日期按钮提供完整 aria-label。
- 375px 不横向溢出。

### OrbitingCircles

- 中心 R7。
- 节点：Java、JavaScript、MySQL、Next.js、Git、AI Tools。
- 不使用第三方品牌 Logo。
- 两圈慢速、方向不同。
- reduced-motion 保留节点但停止。

### AnimatedList

- 仅用于最近动态、说说摘要或网站更新。
- 初次进入使用 opacity 与 y transform。
- 不包装全部文章。

### MobileDock

- 真实链接，无 `#`。
- 路由激活态使用琥珀与短底线。
- reduced-motion 关闭磁性缩放。

## 主题

- 使用现有 `next-themes` 与 `data-theme`。
- 页面级主题保持一致，不在单页中段突然翻转。
- 深色不是纯黑反色，而是暖炭黑与深咖啡表面。
- 深浅主题使用相同布局、内容和交互。
- 花瓣和音乐光晕在深色模式降低不透明度。

## 内容语气

- 第一人称、诚实、具体。
- 描述正在学习和正在构建，不包装成多年经验。
- 项目用“目标、技术选择、实现、复盘”说明。
- 不使用“颠覆、赋能、无缝、革命性”等营销词。
- 不虚构公司、奖项、评价、旅行、音乐作品或数据。
- 不在公开页面展示占位 GitHub、示例邮箱或空社交图标。

## 无障碍

- 每页唯一 H1。
- 正确 heading 层级。
- 所有图像提供真实 Alt。
- 表单 label 不由 placeholder 替代。
- 灯箱打开后移动焦点，关闭后恢复触发点。
- Escape 关闭灯箱和移动菜单。
- 触控目标最小 44px。
- 颜色对比达到 WCAG AA。
- 所有动画支持 `prefers-reduced-motion`。
- 装饰元素不进入无障碍树。

## 性能

- Server Component 获取数据。
- Client Component 限制在播放器、时钟、天气交互、日历、灯箱、Dock、花瓣和表单。
- 首页内容流首批 8 项。
- 天气缓存 30 分钟。
- 图片使用 `next/image`、sizes、懒加载和自然比例。
- 音频 `preload="metadata"` 或按需，不自动播放。
- 花瓣节点有限。
- 不引入 GSAP、Three.js、大型日期库、地图 SDK、完整 shadcn/ui 或状态管理库。

## 交付前视觉检查

- 1440、1280、1024、768、430、390、375。
- 浅色和深色。
- 首页三栏、两栏、单列。
- 无横向滚动。
- sticky 不遮 Footer。
- Dock 不遮内容。
- 音乐播放器不溢出。
- 日历可在 375px 操作。
- 空状态完整且没有假内容。
- 页面只使用琥珀主强调。
- 没有紫蓝渐变、纯黑、霓虹、过量玻璃或卡片嵌套。
