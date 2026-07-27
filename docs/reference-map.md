# R7 视觉参考图与组件映射

## 使用原则

- 参考图只定义构图、比例、信息层级、媒体裁切与交互状态，不作为整页背景。
- 图中的生成文字、日期、数量与导航可能存在偏差，真实页面一律使用数据库内容与本项目中文文案。
- 桌面采用 12 栏流体网格，内容上限 1400px；正文阅读栏约 68ch；移动端以 390×844 为关键校验视口。
- Hero 字号约 64–104px，章节标题约 40–64px，正文 16–20px，元信息 13–15px。
- 章节间距桌面 96–176px、移动端 64–104px。图片保持固定比例并使用 `object-fit`，不拉伸。
- 动效以淡入、上移与轻微错位为主，默认 280–700ms；移动端降低距离与并发，`prefers-reduced-motion` 下关闭非必要运动。
- 所有图片都来自本项目生成资产，实施时拆成语义化 HTML、真实数据和可访问控件，不复制生成图中的像素化文字。

## 首页

| 参考图 | 页面区块 | 组件 / 实施要求 |
|---|---|---|
| `home/01-navigation-desktop.png` | `/` 导航 | `SiteHeader`：72px 桌面栏、当前页、搜索、主题切换、键盘焦点 |
| `home/02-hero-desktop.png` | Hero | `HomeHero`：非对称巨型陈述、学习状态、两个层级 CTA、首屏可见 |
| `home/03-introduction-desktop.png` | 简介 | `HomeIntroduction`：60/40 媒体与文本、诚实身份信息 |
| `home/04-featured-posts-desktop.png` | 精选文章 | `FeaturedPosts`：一主两次编辑型索引、真实文章元数据 |
| `home/05-featured-projects-desktop.png` | 精选项目 | `FeaturedProjects`：不等宽媒体节奏、真实项目链接 |
| `home/06-learning-stack-desktop.png` | 学习栈 | `LearningStack`：开放文字网格，不使用熟练度进度条 |
| `home/07-growth-timeline-desktop.png` | 成长轨迹 | `GrowthTimeline`：非等距路径、起步/现在/接下来 |
| `home/08-interests-desktop.png` | 兴趣 | `InterestRibbon`：钢琴与运动媒体切片、统一双色处理 |
| `home/09-subscribe-contact-desktop.png` | 订阅联系 | `SubscribeBand`：真实邮箱表单、成功/错误/加载状态 |
| `home/10-footer-desktop.png` | 页脚 | `SiteFooter`：品牌陈述、站点导航、RSS、返回顶部 |

## 博客列表

| 参考图 | 页面区块 | 组件 / 实施要求 |
|---|---|---|
| `blog/01-page-title-desktop.png` | `/blog` 标题 | `BlogMasthead`：文章总数、短摘要、归档入口 |
| `blog/02-category-filter-desktop.png` | 分类筛选 | `CategoryFilter`：URL 查询参数驱动、当前项双重状态 |
| `blog/03-search-desktop.png` | 搜索入口 | `SearchField`：可清除、键盘提交、加载与空结果 |
| `blog/04-featured-layout-desktop.png` | 精选布局 | `BlogFeatured`：大封面配文章信息、避免三等分卡片 |
| `blog/05-article-list-desktop.png` | 文章列表 | `PostIndex`：日期列、摘要、分类、阅读时长、可选缩略图 |
| `blog/06-pagination-desktop.png` | 分页 | `Pagination`：服务端查询、当前页、上一页/下一页、禁用态 |
| `blog/07-footer-desktop.png` | 继续阅读 | `ReadingFooter`：订阅和 RSS 的明确出口 |

## 文章详情

| 参考图 | 页面区块 | 组件 / 实施要求 |
|---|---|---|
| `article/01-title-cover-desktop.png` | 标题封面 | `ArticleHero`：受控封面比例、安全文字区、分享动作 |
| `article/02-meta-desktop.png` | 元数据 | `ArticleMeta`：作者、日期、阅读时长、浏览量、分类、标签 |
| `article/03-progress-toc-desktop.png` | 阅读进度与目录 | `ReadingProgress` + `TableOfContents`：桌面粘性、移动底部抽屉 |
| `article/04-body-typography-desktop.png` | 正文 | `MarkdownArticle`：标题、段落、引用、列表、表格、提示块和链接 |
| `article/05-code-block-desktop.png` | 代码 | `CodeBlock`：语言名、行号、复制反馈、内部横向滚动 |
| `article/06-image-display-desktop.png` | 图片 | `ArticleFigure`：固定比例、caption、响应式尺寸和灯箱 |
| `article/07-prev-next-desktop.png` | 前后文章 | `PostNavigation`：整区可点、方向和标题清楚、焦点可见 |
| `article/08-related-desktop.png` | 相关文章 | `RelatedPosts`：一主两次的非对称内容索引 |
| `article/09-comments-desktop.png` | 评论 | `CommentThread` + `CommentForm`：审核提示、回复、字段错误和防滥用 |

## 项目

| 参考图 | 页面区块 | 组件 / 实施要求 |
|---|---|---|
| `projects/01-index-hero-desktop.png` | `/projects` Hero | `ProjectsHero`：超大文字与项目切片交织，一个主 CTA |
| `projects/02-filter-desktop.png` | 技术筛选 | `ProjectFilter`：URL 状态、结果数、重置、非胶囊墙 |
| `projects/03-project-cards-desktop.png` | 项目列表 | `ProjectGallery`：2+1+3 非对称桌面节奏、移动单列 |
| `projects/04-detail-hero-desktop.png` | 项目详情 Hero | `ProjectHero`：全幅截图、标题简介、演示与开发记录 |
| `projects/05-background-goals-desktop.png` | 背景目标 | `ProjectIntent`：草图、问题、目标和约束 |
| `projects/06-technical-implementation-desktop.png` | 技术实现 | `ProjectArchitecture`：数据/服务/界面关系和真实实现说明 |
| `projects/07-gallery-desktop.png` | 图库 | `ProjectGalleryViewer`：固定比例、缩略图、键盘切换和灯箱 |
| `projects/08-summary-desktop.png` | 总结 | `ProjectReflection`：单一强调色面、反思和清楚出口 |

## 关于

| 参考图 | 页面区块 | 组件 / 实施要求 |
|---|---|---|
| `about/01-introduction-desktop.png` | 介绍 | `AboutHero`：纪实学习场景、真实身份、此刻入口 |
| `about/02-learning-journey-desktop.png` | 学习方式 | `LearningJourney`：四段开放轨迹，无虚构年份 |
| `about/03-skills-tools-desktop.png` | 技能工具 | `HonestSkills`：学习/实践/常用工具分组，无百分比 |
| `about/04-interests-desktop.png` | 兴趣 | `InterestAccordion`：不等宽媒体条、键盘与触摸可用 |
| `about/05-current-goals-desktop.png` | 当前目标 | `CurrentGoals`：四个不等宽目标、只突出当前主目标 |
| `about/06-contact-desktop.png` | 联系 | `ContactBand`：留言与邮件、真实反馈状态 |

## 管理后台

| 参考图 | 页面区块 | 组件 / 实施要求 |
|---|---|---|
| `admin/01-login-desktop.png` | `/admin/login` | `AdminLogin`：错误、加载、保持登录、速率限制说明 |
| `admin/02-dashboard-desktop.png` | 仪表盘 | `AdminDashboard`：真实统计、趋势、最近文章与留言 |
| `admin/03-posts-desktop.png` | 文章管理 | `AdminPostTable`：搜索、筛选、排序、分页、批量选择 |
| `admin/04-editor-desktop.png` | 编辑器 | `PostEditor`：Markdown、预览、发布设置、未保存提示和校验 |
| `admin/05-taxonomy-desktop.png` | 分类标签 | `TaxonomyManager`：CRUD、计数、冲突校验和删除确认 |
| `admin/06-media-desktop.png` | 媒体库 | `MediaLibrary`：上传进度、类型错误、Alt、复制 URL、删除确认 |
| `admin/07-comments-desktop.png` | 评论审核 | `CommentModeration`：通过/隐藏/垃圾/删除、批量和分页 |
| `admin/08-settings-desktop.png` | 设置 | `SiteSettingsForm`：基本信息、SEO、评论、媒体、外观 |

## 移动端关键状态

| 参考图 | 对应状态 | 组件 / 实施要求 |
|---|---|---|
| `mobile/01-home-navigation-open.png` | 移动导航展开 | `MobileMenu`：全屏、焦点圈定、Esc/关闭、44px 点击目标 |
| `mobile/02-home-hero.png` | 首页 Hero | `HomeHero` 移动构图：标题三行内、CTA 首屏内 |
| `mobile/03-home-featured-posts.png` | 首页精选文章 | `FeaturedPosts` 单列、一张 4:3 主图配两条索引 |
| `mobile/04-blog-filter.png` | 博客筛选 | `FilterSheet`：底部抽屉、应用/重置、结果数量 |
| `mobile/05-blog-search.png` | 博客搜索 | `MobileSearch`：大输入、清除、加载和空结果 |
| `mobile/06-blog-article-list.png` | 文章列表 | `PostIndex` 单列、元数据可扫读、加载更多 |
| `mobile/07-article-title-cover.png` | 文章 Hero | `ArticleHero` 竖向裁切、返回与分享高对比 |
| `mobile/08-article-toc-progress.png` | 文章目录 | `TocSheet` + 顶部 2px 进度线、当前章节双重提示 |
| `mobile/09-article-body.png` | 正文 | `MarkdownArticle` 17px 基准、表格内部横滚 |
| `mobile/10-article-code.png` | 代码块 | `CodeBlock` 不溢出视口、复制按钮固定可达 |
| `mobile/11-article-comments.png` | 评论 | 评论在前、表单在后，回复缩进不造成窄列 |
| `mobile/12-project-cards.png` | 项目列表 | `ProjectGallery` 单列、多种固定媒体比例 |
| `mobile/13-project-detail-hero.png` | 项目 Hero | 重新裁切、两个 CTA 在首屏内 |
| `mobile/14-about-introduction.png` | 关于 Hero | 竖向纪实图、安全文字区、无虚构履历 |
| `mobile/15-admin-login.png` | 后台登录 | 键盘弹起后主按钮仍可见、错误与限流就近显示 |
| `mobile/16-admin-dashboard.png` | 后台首页 | 抽屉导航、一大两小指标、图表和最近内容纵排 |
| `mobile/17-admin-editor.png` | 后台编辑 | 正文优先、发布设置底部抽屉、固定操作栏 |
| `mobile/18-admin-media.png` | 媒体库 | 两列网格、上传可达、详情底部抽屉和删除确认 |

## 与真实实现的差异处理

生成图中偶尔出现的示例年份、英文眉题、数量、装饰编号、额外导航和示例技术栈只用于展示信息密度。最终实现不硬编码这些内容：文章、项目、分类、标签、评论、浏览量和站点设置均从数据库读取；图标使用统一图标库；危险操作使用文本、颜色和确认流程共同表达；亮色、暗色及系统主题共享同一设计令牌。
