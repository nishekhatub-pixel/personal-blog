import { hash } from "bcryptjs";
import {
  ContentStatus,
  PrismaClient,
  UserRole,
} from "@prisma/client";

const prisma = new PrismaClient();

const categories = [
  { name: "计算机基础", slug: "computer-science", description: "数据结构、算法、网络与操作系统的学习笔记。" },
  { name: "后端工程", slug: "backend-engineering", description: "Java、数据库、API 与服务端工程实践。" },
  { name: "前端开发", slug: "frontend-development", description: "现代 Web、交互设计与浏览器工程。" },
  { name: "成长记录", slug: "learning-notes", description: "学习方法、项目复盘与学生阶段的真实进度。" },
];

const tags = [
  ["数据结构", "data-structures"],
  ["算法", "algorithms"],
  ["Java", "java"],
  ["MySQL", "mysql"],
  ["数据库", "database"],
  ["TypeScript", "typescript"],
  ["React", "react"],
  ["Next.js", "nextjs"],
  ["CSS", "css"],
  ["可访问性", "accessibility"],
  ["Git", "git"],
  ["测试", "testing"],
  ["工程化", "engineering"],
  ["学习方法", "learning"],
  ["设计系统", "design-system"],
] as const;

const posts = [
  {
    title: "从数组到链表：真正理解数据结构的取舍",
    slug: "array-to-linked-list-tradeoffs",
    excerpt: "不背结论，从内存布局、访问成本和实际业务三个角度重新理解数组与链表。",
    category: "computer-science",
    tags: ["data-structures", "algorithms"],
    coverImage: "/images/cover-data-structures.png",
    coverAlt: "抽象的数据结构节点与连接关系",
    featured: true,
    readingMinutes: 9,
    publishedAt: "2026-01-08T08:00:00.000Z",
    content: `## 为什么这两个结构总被放在一起

数组和链表常常是数据结构课程的第一组对照。只记住“数组查询快、链表插入快”并不足够，因为真实程序里的速度还受缓存、数据规模和访问方式影响。

## 从内存布局开始

数组元素在内存中连续排列。给定下标后，地址可以直接计算，所以随机访问是常数时间。链表节点可能分散在不同位置，每个节点保存下一节点的引用，找到第 n 个元素需要从头移动。

\`\`\`ts
const values = [7, 14, 21, 28]
const third = values[2]
\`\`\`

连续布局还有一个容易被忽略的优势：CPU 缓存会一次读取相邻数据。顺序遍历数组时，后续元素往往已经进入缓存；链表的跳转则更容易产生缓存未命中。

## 插入为何不一定是链表赢

链表在“已经拿到目标节点”的前提下，修改几个引用即可完成插入。但如果必须先寻找位置，查找成本仍然存在。数组移动一段元素看似昂贵，小规模数据却可能因为连续内存和高度优化的复制而更快。

> 选择结构时，先描述访问模式，再讨论复杂度。

## 我的决策清单

1. 需要频繁按下标访问时优先数组。
2. 需要稳定节点引用并频繁在已知位置插入时考虑链表。
3. 数据量不大时，优先选择更简单、更容易维护的结构。
4. 对性能敏感时，用接近真实负载的数据做基准测试。

理解取舍比背诵表格更重要。复杂度给出增长趋势，机器的缓存与程序的访问方式决定实际表现。`,
  },
  {
    title: "栈、队列与一次任务调度器练习",
    slug: "stack-queue-task-scheduler",
    excerpt: "用一个可运行的任务调度器，把先进后出、先进先出和边界处理连接起来。",
    category: "computer-science",
    tags: ["data-structures", "typescript", "testing"],
    coverImage: "/images/cover-data-structures.png",
    coverAlt: "按顺序排列的任务卡片",
    featured: false,
    readingMinutes: 8,
    publishedAt: "2026-01-22T08:00:00.000Z",
    content: `## 两种顺序，两类问题

栈遵循后进先出，适合撤销、表达式求值和深度优先遍历。队列遵循先进先出，适合任务调度、消息处理和广度优先遍历。

## 一个小型队列

\`\`\`ts
class TaskQueue<T> {
  private values: T[] = []

  enqueue(task: T) {
    this.values.push(task)
  }

  dequeue() {
    return this.values.shift()
  }

  get size() {
    return this.values.length
  }
}
\`\`\`

这个版本很直观，但 \`shift\` 会移动数组元素。更稳妥的实现可以保留头指针，在头部空间达到阈值时再整理数组。

## 调度器需要处理的边界

任务执行可能失败、超时或在运行前被取消。队列只负责顺序，调度器还要定义状态机。我的练习把任务分为 waiting、running、done 和 failed，并为每次变化留下时间戳。

测试重点不是只有“能运行”：

- 空队列取任务时返回什么。
- 新任务是否严格排在已有任务之后。
- 失败任务会不会阻塞后续任务。
- 并发数量变化时是否超出限制。

## 复盘

写完之后我意识到，数据结构不是孤立的容器。它会直接影响接口语义、错误处理和可观察性。把课堂概念放入小项目，才能看到完整问题。`,
  },
  {
    title: "Java 集合框架：从接口选择到复杂度判断",
    slug: "java-collections-decision-guide",
    excerpt: "用场景驱动的方式梳理 List、Set、Map，以及我在练习中遇到的几个误区。",
    category: "backend-engineering",
    tags: ["java", "data-structures", "engineering"],
    coverImage: "/images/cover-java-collections.png",
    coverAlt: "Java 集合接口关系的抽象图形",
    featured: true,
    readingMinutes: 11,
    publishedAt: "2026-02-05T08:00:00.000Z",
    content: `## 先从问题出发

选择集合时，我现在先问三个问题：是否需要保持顺序、是否允许重复、主要通过下标还是键访问。答案通常会把选择范围快速缩小。

## List

\`ArrayList\` 适合读取多、尾部追加多的场景。\`LinkedList\` 同时实现 List 和 Deque，但它不是所有头尾操作的默认最优解。多数常规列表依然可以先从 ArrayList 开始。

## Set

\`HashSet\` 用来表达“不重复”，它不承诺遍历顺序。\`LinkedHashSet\` 保留插入顺序，\`TreeSet\` 按比较规则排序。把顺序需求明确写进类型选择，能避免依赖偶然行为。

## Map

\`\`\`java
Map<String, Integer> counts = new HashMap<>();
for (String word : words) {
    counts.merge(word, 1, Integer::sum);
}
\`\`\`

这段代码比“先判断是否存在再更新”更集中，也减少了分支。

## 常见误区

1. 把平均常数时间理解成每次都一样快。
2. 修改对象后忘记它的 hashCode 可能变化。
3. 在遍历时直接修改集合，引发并发修改异常。
4. 忘记为业务对象同时实现一致的 equals 与 hashCode。

## 一个实用原则

先选择语义最贴近问题、最简单的集合。只有性能测量指出瓶颈时，再替换具体实现。接口表达意图，测试保护行为，基准数据验证性能。`,
  },
  {
    title: "MySQL 索引不是越多越好：一次查询优化复盘",
    slug: "mysql-index-query-optimization",
    excerpt: "从慢查询出发，记录联合索引顺序、执行计划和写入成本之间的关系。",
    category: "backend-engineering",
    tags: ["mysql", "database", "engineering"],
    coverImage: "/images/cover-mysql-indexes.png",
    coverAlt: "数据库索引页与查询路径示意",
    featured: true,
    readingMinutes: 12,
    publishedAt: "2026-02-26T08:00:00.000Z",
    content: `## 问题现场

练习项目的文章列表按状态筛选并按发布时间倒序排列。数据量增加后，查询开始出现明显延迟。

\`\`\`sql
SELECT id, title, published_at
FROM posts
WHERE status = 'PUBLISHED'
ORDER BY published_at DESC
LIMIT 20;
\`\`\`

## 执行计划告诉了什么

只为 status 建索引仍然需要额外排序。把过滤列和排序列放入联合索引后，数据库可以沿索引顺序直接取出前 20 条。

\`\`\`sql
CREATE INDEX idx_posts_status_published
ON posts(status, published_at);
\`\`\`

联合索引的列顺序不是格式问题。它决定哪些查询可以利用索引前缀。对比执行计划时，我关注访问类型、预计扫描行数、实际耗时和是否出现额外排序。

## 索引的成本

索引会占用空间，也会增加插入、更新和删除的维护成本。重复或很少使用的索引会让写入变慢。优化完成后，我会检查现有索引是否有包含关系，并保留能服务明确查询的组合。

## 这次学到的流程

1. 用真实参数确认慢查询。
2. 记录优化前执行计划和耗时。
3. 根据过滤、连接、排序设计候选索引。
4. 再次测量，并检查写入影响。
5. 把查询与索引意图写进迁移说明。

索引优化不是猜一个名字，而是一段可以复现的实验。`,
  },
  {
    title: "事务隔离级别：用转账场景理解并发异常",
    slug: "transaction-isolation-with-transfer",
    excerpt: "把脏读、不可重复读和幻读放进同一个转账实验，观察隔离级别如何改变结果。",
    category: "backend-engineering",
    tags: ["mysql", "database", "testing"],
    coverImage: "/images/cover-mysql-indexes.png",
    coverAlt: "两条并发数据库事务流",
    featured: false,
    readingMinutes: 10,
    publishedAt: "2026-03-12T08:00:00.000Z",
    content: `## 为什么用转账练习

事务的四个特性很容易背下来，但并发异常只有在两个会话交错执行时才直观。转账同时包含读取、校验和两次更新，是很好的实验场景。

## 原子性只是起点

\`\`\`sql
START TRANSACTION;
UPDATE accounts SET balance = balance - 100 WHERE id = 1;
UPDATE accounts SET balance = balance + 100 WHERE id = 2;
COMMIT;
\`\`\`

如果第二次更新失败，必须回滚第一次更新。但即使两条语句可以一起提交，两个并发事务仍可能读取到不一致的状态。

## 三类现象

- 脏读：读到其他事务尚未提交的数据。
- 不可重复读：同一事务两次读取同一行，值发生变化。
- 幻读：同一条件查询两次，结果集合出现或消失记录。

不同数据库对隔离级别的具体实现有差异。学习时不能只看标准名称，还要查目标数据库的锁与多版本并发控制行为。

## 应用层也要参与

高隔离级别并不替代业务约束。余额不能为负应该由明确校验和数据库约束共同保护；并发冲突需要定义重试上限；幂等键可以防止网络重试导致重复扣款。

## 实验结论

我最终保留了一份双会话脚本，每个步骤都有预期结果。以后遇到库存或计数问题时，可以先复现交错顺序，再选择锁、隔离级别或乐观并发方案。`,
  },
  {
    title: "用 TypeScript 写一个可预测的 API 客户端",
    slug: "predictable-typescript-api-client",
    excerpt: "围绕超时、错误类型、运行时校验和取消请求，构建一个不隐藏失败的请求层。",
    category: "frontend-development",
    tags: ["typescript", "testing", "engineering"],
    coverImage: "/images/cover-responsive-design.png",
    coverAlt: "浏览器与服务端之间的数据流",
    featured: false,
    readingMinutes: 9,
    publishedAt: "2026-03-30T08:00:00.000Z",
    content: `## 类型不能验证网络数据

TypeScript 类型在运行时会被移除。服务端返回字段缺失时，类型断言不会保护应用。请求层应该把未知数据当作 unknown，再通过 schema 验证。

\`\`\`ts
async function request<T>(url: string, parse: (value: unknown) => T) {
  const response = await fetch(url)
  const payload: unknown = await response.json()
  if (!response.ok) throw new HttpError(response.status, payload)
  return parse(payload)
}
\`\`\`

## 错误需要可区分

网络断开、超时、HTTP 失败和响应格式错误对用户意味着不同的提示，也有不同的重试策略。我为它们定义不同错误类型，并让界面只展示安全、可理解的信息。

## 超时与取消

\`AbortController\` 可以同时处理主动取消和超时。页面切换时取消不再需要的请求，能避免旧响应覆盖新状态。

## 我保留的约束

- GET 可以在明确条件下重试，写请求默认不自动重试。
- 每次请求都有超时。
- 响应先做运行时校验。
- 日志不记录令牌与完整个人信息。
- 错误对象保留状态码和追踪标识，但不泄漏服务端细节。

一个好的请求封装不会假装网络永远可靠，它会让失败路径也变得可预测。`,
  },
  {
    title: "响应式设计不只是三个断点",
    slug: "responsive-design-beyond-breakpoints",
    excerpt: "从内容约束、容器查询、触控目标和真实设备测试出发，重新整理响应式工作流。",
    category: "frontend-development",
    tags: ["css", "accessibility", "design-system"],
    coverImage: "/images/cover-responsive-design.png",
    coverAlt: "同一网页在不同尺寸中的自适应布局",
    featured: true,
    readingMinutes: 10,
    publishedAt: "2026-04-16T08:00:00.000Z",
    content: `## 断点应该来自内容

我以前习惯先写 768、1024、1440 三个断点，再把设计塞进去。现在会先缩放页面，观察标题何时拥挤、导航何时换行、正文何时过宽，再在真正失效的位置调整。

## 流式尺寸

\`\`\`css
.hero-title {
  font-size: clamp(3rem, 8vw, 7rem);
  max-width: 11ch;
}
\`\`\`

\`clamp\` 让尺寸在上下限之间连续变化，减少突然跳变。网格可以用 \`minmax\` 和自动排列，让卡片根据可用空间决定列数。

## 组件也需要上下文

同一个文章卡片可能出现在全宽列表或狭窄侧栏。容器查询让组件根据自身空间变化，不必推测整个视口。

## 不能忽略的细节

- 触控目标至少保留舒适尺寸和间距。
- 横向滚动只能出现在代码块等明确区域。
- 键盘焦点在所有断点都必须可见。
- 图片提供尺寸，避免加载时布局跳动。
- 移动端输入字号足够大，避免浏览器自动缩放。

## 测试方式

开发者工具适合快速覆盖尺寸，但不能替代真机。真机会暴露浏览器工具栏、刘海安全区、触控延迟和性能限制。响应式不是把桌面缩小，而是让内容在不同条件下仍然清楚、可操作。`,
  },
  {
    title: "给学生项目补上可访问性：一份实测清单",
    slug: "accessibility-checklist-for-student-projects",
    excerpt: "从键盘、语义、颜色、表单和动态效果五个方面，记录一次可访问性整改。",
    category: "frontend-development",
    tags: ["accessibility", "testing", "css"],
    coverImage: "/images/cover-responsive-design.png",
    coverAlt: "高对比界面中的键盘焦点路径",
    featured: false,
    readingMinutes: 8,
    publishedAt: "2026-05-03T08:00:00.000Z",
    content: `## 从键盘开始

拔掉鼠标，用 Tab、Shift + Tab、Enter 和 Escape 完成主要流程，是最快发现问题的方法。我的第一次测试就发现导航顺序混乱、弹窗无法关闭、焦点样式被重置。

## 语义优先

按钮应该使用 button，导航使用 nav，主内容使用 main。语义元素自带键盘和辅助技术行为，比给 div 添加大量角色更可靠。

## 表单不是只有占位符

每个输入都需要可见标签。错误信息与字段建立关联，并用文字说明问题，不能只改变边框颜色。提交失败后，焦点要移动到错误摘要或第一个错误字段。

## 动态效果尊重偏好

\`\`\`css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    scroll-behavior: auto !important;
    animation-duration: 0.01ms !important;
  }
}
\`\`\`

减少动画不是删除所有反馈，而是避免大范围位移、持续视差和无法暂停的运动。

## 我的验收清单

1. 标题层级连续，页面只有一个主要标题。
2. 文字和控件对比度通过检查。
3. 图片替代文本描述用途，不重复文件名。
4. 所有交互可由键盘完成，焦点清晰。
5. 200% 缩放后内容不被裁切。
6. 自动化扫描后仍进行人工测试。

可访问性不是最后加的装饰，它会推动更清楚的结构和更稳定的交互。`,
  },
  {
    title: "第一次为项目写集成测试，我改变了什么",
    slug: "first-integration-test-retrospective",
    excerpt: "记录从只测函数到覆盖数据库、身份验证和真实用户路径的过程。",
    category: "learning-notes",
    tags: ["testing", "database", "engineering"],
    coverImage: "/images/r7-about-study.png",
    coverAlt: "书桌上的代码测试与学习笔记",
    featured: false,
    readingMinutes: 9,
    publishedAt: "2026-05-21T08:00:00.000Z",
    content: `## 为什么单元测试不够

单元测试能快速验证纯函数，但我的项目故障常出现在连接处：请求校验通过后写错字段、事务没有覆盖完整操作、身份验证中间件漏掉某个路由。

## 选择一条关键路径

我没有一开始覆盖所有页面，而是选择“管理员登录后创建文章，公开页面可以搜索到它”这条路径。它同时经过会话、数据库、表单校验和搜索。

## 隔离测试数据

每次测试使用独立数据库，运行迁移后写入最小 seed。测试完成就销毁，不依赖开发数据库中的偶然数据。这样失败可以重复，测试之间也不会互相污染。

## 测试让我修改的设计

- 把时间和随机标识封装，便于控制。
- 把数据库操作集中到服务层。
- 让错误返回稳定代码，而不是匹配完整提示文字。
- 为写请求加入幂等和来源校验。

## 速度与信心

测试金字塔仍然重要。大量快速单元测试负责边界，少量集成测试验证连接，更少的端到端测试保护最关键流程。目标不是数字好看，而是让修改后敢于发布。`,
  },
  {
    title: "我的 2026 上半年学习系统：输入、练习与复盘",
    slug: "learning-system-2026-first-half",
    excerpt: "一份不美化过程的阶段总结：如何安排基础课、项目练习和公开写作。",
    category: "learning-notes",
    tags: ["learning", "git", "engineering"],
    coverImage: "/images/r7-growth-hero.png",
    coverAlt: "代表持续学习路径的绿色生长轨迹",
    featured: true,
    readingMinutes: 7,
    publishedAt: "2026-06-18T08:00:00.000Z",
    content: `## 系统比意志更可靠

上半年我把学习分成三条线：计算机基础、工程项目和表达。每周只为三条线各设置一个可以验证的结果，避免任务列表无限增长。

## 输入

课程和书籍负责建立地图。我会在开始前写下问题，阅读时只记录能回答问题的内容。笔记尽量使用自己的语言，并链接到已经学过的概念。

## 练习

每个主题至少配一个小实验。学习索引就构造查询并对比执行计划，学习响应式就拿真实内容压测布局。练习代码进入 Git，提交信息记录“为什么改”。

## 复盘

周末只看三个信号：

1. 哪个结果真的完成了。
2. 哪个问题重复卡住。
3. 下周应该减少什么。

复盘不是追加更多任务，而是缩小范围。连续两周无法推进的目标要么太大，要么不是当前优先级。

## 下半年计划

我会继续深化 Java 与数据库，同时完成一个有真实身份验证、内容管理和测试流程的全栈项目。写作保持小而具体，记录可以复现的实验和真实失误。

成长不是一条平滑曲线。这个系统的价值，是让我在状态普通的日子里也能继续前进。`,
  },
] as const;

const projects = [
  {
    title: "R7 数字花园",
    slug: "r7-digital-garden",
    summary: "一个具备真实数据库、内容管理、搜索、评论审核与媒体处理的全栈个人博客。",
    body: `## 背景

我希望把分散的课程笔记、项目复盘和阶段目标放进一个可以长期维护的系统。

## 实现

项目使用 Next.js、TypeScript 与 Prisma。公开站点负责阅读体验和搜索，后台负责文章、项目、分类、标签、媒体与评论审核。身份会话只保存哈希令牌，上传图片会校验真实格式并重新编码。

## 结果

这个项目把视觉设计、数据库建模、安全边界和自动化测试放在同一条交付链上，也成为我持续学习的基础设施。`,
    technologies: ["Next.js", "TypeScript", "Prisma", "SQLite", "MySQL", "Tailwind CSS"],
    tags: ["nextjs", "typescript", "database", "design-system"],
    coverImage: "/images/r7-growth-hero.png",
    coverAlt: "R7 数字花园的绿色生长回路视觉",
    featured: true,
    publishedAt: "2026-07-20T08:00:00.000Z",
  },
  {
    title: "课程任务调度器",
    slug: "course-task-scheduler",
    summary: "用队列、优先级与明确状态机组织课程任务的 TypeScript 练习。",
    body: `## 目标

把数据结构课程中的队列概念放进可交互的任务工具，并练习失败重试与状态转换。

## 技术实现

核心调度器是无框架 TypeScript 模块，界面使用 React。单元测试覆盖入队、取消、失败和并发限制，浏览器测试覆盖键盘操作。

## 复盘

最重要的收获不是拖拽界面，而是把状态变化设计成可预测、可测试的事件。`,
    technologies: ["TypeScript", "React", "Vitest"],
    tags: ["typescript", "data-structures", "testing"],
    coverImage: "/images/cover-data-structures.png",
    coverAlt: "任务节点按照优先级排列",
    featured: true,
    publishedAt: "2026-06-28T08:00:00.000Z",
  },
  {
    title: "校园失物招领 API",
    slug: "campus-lost-and-found-api",
    summary: "围绕发布、检索、认领和审核流程设计的 Java REST API。",
    body: `## 问题

校园群里的失物信息很快被新消息淹没，认领状态也不清楚。

## 方案

服务提供物品发布、条件检索、认领申请和管理员审核。数据库迁移包含状态约束与组合索引，接口使用统一错误模型并记录审计时间。

## 工程实践

项目通过集成测试启动临时数据库，验证从发布到认领完成的关键路径。`,
    technologies: ["Java", "Spring Boot", "MySQL", "JUnit"],
    tags: ["java", "mysql", "testing"],
    coverImage: "/images/cover-java-collections.png",
    coverAlt: "校园物品信息服务的抽象界面",
    featured: true,
    publishedAt: "2026-06-05T08:00:00.000Z",
  },
  {
    title: "SQL 执行计划实验室",
    slug: "sql-explain-lab",
    summary: "可重复生成样本数据并对比索引前后执行计划的数据库学习工具。",
    body: `## 动机

只阅读 EXPLAIN 字段说明很难建立直觉，所以我写了可重复的实验脚本。

## 内容

脚本生成不同分布的数据，运行一组固定查询，记录扫描行数与耗时。每个实验都包含建表、数据生成、候选索引和清理步骤。

## 收获

结果让我看到数据分布、选择性和联合索引顺序如何共同影响查询计划。`,
    technologies: ["MySQL", "SQL", "Node.js"],
    tags: ["mysql", "database", "engineering"],
    coverImage: "/images/cover-mysql-indexes.png",
    coverAlt: "SQL 执行计划与索引路径",
    featured: false,
    publishedAt: "2026-05-14T08:00:00.000Z",
  },
  {
    title: "无障碍组件练习册",
    slug: "accessible-component-workbook",
    summary: "用原生语义、键盘测试和自动化扫描实现的一组基础交互组件。",
    body: `## 范围

练习包含菜单、对话框、标签页、表单错误摘要和可暂停轮播。

## 原则

优先使用原生元素，在确实缺少语义时再补充 ARIA。每个组件都记录键盘映射、焦点策略和减少动态效果模式。

## 验证

除了自动化扫描，我还用键盘、屏幕阅读器和 200% 缩放完成手工检查。`,
    technologies: ["React", "TypeScript", "Playwright", "axe-core"],
    tags: ["react", "accessibility", "testing"],
    coverImage: "/images/cover-responsive-design.png",
    coverAlt: "带清晰焦点状态的组件界面",
    featured: false,
    publishedAt: "2026-04-22T08:00:00.000Z",
  },
  {
    title: "学习日志 CLI",
    slug: "learning-log-cli",
    summary: "在终端快速记录学习片段，并生成每周复盘 Markdown 的轻量工具。",
    body: `## 使用方式

命令可以记录主题、时长、问题和下一步，也能按周聚合为 Markdown。

## 实现

数据保存在本地 SQLite，通过参数化查询写入。导出模板保持稳定，方便提交到 Git 并在博客中继续整理。

## 价值

工具刻意保持简单，让记录动作不打断学习，同时保留足够结构支持复盘。`,
    technologies: ["Node.js", "TypeScript", "SQLite"],
    tags: ["typescript", "database", "learning"],
    coverImage: "/images/r7-about-study.png",
    coverAlt: "终端学习日志与纸质笔记",
    featured: false,
    publishedAt: "2026-03-18T08:00:00.000Z",
  },
] as const;

async function main() {
  const categoryIds = new Map<string, string>();
  for (const category of categories) {
    const record = await prisma.category.upsert({
      where: { slug: category.slug },
      update: {},
      create: category,
    });
    categoryIds.set(category.slug, record.id);
  }

  const tagIds = new Map<string, string>();
  for (const [name, slug] of tags) {
    const record = await prisma.tag.upsert({
      where: { slug },
      update: {},
      create: { name, slug },
    });
    tagIds.set(slug, record.id);
  }

  const adminEmail = (process.env.ADMIN_EMAIL ?? "admin@r7.local").trim().toLocaleLowerCase("en-US");
  const adminPassword = process.env.ADMIN_PASSWORD ?? "R7-Local-2026-Change-Me";
  const passwordHash = await hash(adminPassword, 12);
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { name: "R7", passwordHash, role: UserRole.ADMIN },
    create: { email: adminEmail, name: "R7", passwordHash, role: UserRole.ADMIN },
  });

  for (const post of posts) {
    const categoryId = categoryIds.get(post.category);
    if (!categoryId) throw new Error(`缺少文章分类：${post.category}`);
    const links = post.tags.map((slug) => {
      const tagId = tagIds.get(slug);
      if (!tagId) throw new Error(`缺少文章标签：${slug}`);
      return { tagId };
    });
    const data = {
      title: post.title,
      excerpt: post.excerpt,
      content: post.content,
      coverImage: post.coverImage,
      coverAlt: post.coverAlt,
      status: ContentStatus.PUBLISHED,
      featured: post.featured,
      readingMinutes: post.readingMinutes,
      seoTitle: post.title,
      seoDescription: post.excerpt,
      categoryId,
      publishedAt: new Date(post.publishedAt),
    };
    await prisma.post.upsert({
      where: { slug: post.slug },
      update: {},
      create: { ...data, slug: post.slug, tags: { create: links } },
    });
  }

  for (const project of projects) {
    const links = project.tags.map((slug) => {
      const tagId = tagIds.get(slug);
      if (!tagId) throw new Error(`缺少项目标签：${slug}`);
      return { tagId };
    });
    const data = {
      title: project.title,
      summary: project.summary,
      body: project.body,
      coverImage: project.coverImage,
      coverAlt: project.coverAlt,
      galleryJson: JSON.stringify([project.coverImage]),
      technologyJson: JSON.stringify(project.technologies),
      status: ContentStatus.PUBLISHED,
      featured: project.featured,
      seoTitle: project.title,
      seoDescription: project.summary,
      publishedAt: new Date(project.publishedAt),
    };
    await prisma.project.upsert({
      where: { slug: project.slug },
      update: {},
      create: { ...data, slug: project.slug, tags: { create: links } },
    });
  }

  const settings = [
    ["site.title", "R7 的数字花园", "site"],
    ["site.description", "软件技术学生的学习记录、工程实践与作品。", "site"],
    ["site.url", process.env.APP_URL ?? "http://localhost:3000", "site"],
    ["profile.name", "R7", "profile"],
    ["profile.role", "软件技术专业学生 / 开发者", "profile"],
    ["profile.location", "中国", "profile"],
    ["profile.bio", "在代码、设计与持续学习之间搭建自己的生长回路。", "profile"],
    ["profile.now", "正在深入 Java、数据库系统与现代 Web 工程，完成一个可长期维护的全栈数字花园。", "profile"],
    ["social.github", "", "social"],
    ["contact.email", "", "contact"],
    ["seo.keywords", "R7,软件技术,编程学习,Java,MySQL,TypeScript,个人博客", "seo"],
    ["siteTitle", "R7 的数字花园", "general"],
    ["siteDescription", "软件技术学生的学习记录、工程实践与作品。", "general"],
    ["siteUrl", process.env.APP_URL ?? "http://localhost:3000", "general"],
    ["authorName", "R7", "profile"],
    ["authorBio", "在代码、设计与持续学习之间搭建自己的生长回路。", "profile"],
    ["contactEmail", "", "contact"],
    ["githubUrl", "", "social"],
    ["nowText", "正在深入 Java、数据库系统与现代 Web 工程，完成一个可长期维护的全栈数字花园。", "profile"],
    ["footerNote", "持续学习，持续构建。", "site"],
    ["commentsEnabled", "true", "features"],
    ["newsletterEnabled", "true", "features"],
  ] as const;
  for (const [key, value, group] of settings) {
    await prisma.siteSetting.upsert({
      where: { key },
      update: {},
      create: { key, value, group },
    });
  }

  const gardenSettings = [
    ["siteName", "R7 Digital Garden", "garden"],
    ["siteSubtitle", "一个软件技术专业学生的个人数字花园", "garden"],
    ["profileName", "R7", "profile"],
    ["profileBio", "软件技术专业学生，正在学习 Java、数据库与现代 Web 工程。", "profile"],
    ["profileAvatar", "", "profile"],
    ["siteLaunchDate", "", "garden"],
    ["nowText", "正在系统学习 Java 与数据库，并持续整理练习与问题。", "garden"],
    ["noticeText", "正在系统学习 Java 与数据库，把练习和问题持续记录在这里。", "garden"],
    ["locationName", "", "garden"],
    ["latitude", "", "garden"],
    ["longitude", "", "garden"],
    ["timezone", "Asia/Shanghai", "garden"],
    ["weatherEnabled", "false", "features"],
    ["weatherMode", "auto", "location"],
    ["manualWeatherCondition", "晴天", "location"],
    ["manualWeatherTemperature", "", "location"],
    ["manualWeatherDescription", "", "location"],
    ["petalsEnabled", "true", "features"],
    ["petalsDensity", "low", "features"],
    ["githubUrl", "", "social"],
    ["email", "", "contact"],
    ["musicEnabled", "true", "features"],
    ["guestbookEnabled", "true", "features"],
    ["friendsEnabled", "true", "features"],
  ] as const;
  for (const [key, value, group] of gardenSettings) {
    await prisma.siteSetting.upsert({
      where: { key },
      update: {},
      create: { key, value, group },
    });
  }

  const timeline = [
    ["timeline-01", "写下第一行代码", "从课堂练习开始理解变量、条件与循环。", "2024", "起点", 1],
    ["timeline-02", "建立计算机基础地图", "把数据结构、网络、操作系统与数据库连接起来。", "2025", "基础", 2],
    ["timeline-03", "完成第一个后端项目", "用 Java 与 MySQL 实现从接口到数据的完整路径。", "2025", "实践", 3],
    ["timeline-04", "学习现代 Web 工程", "用 TypeScript、React 和测试工具改善交付质量。", "2026", "拓展", 4],
    ["timeline-05", "启动数字花园", "让学习记录、项目和复盘成为可以持续维护的系统。", "现在", "生长", 5],
  ] as const;
  for (const [id, title, description, dateLabel, phase, position] of timeline) {
    await prisma.timelineEvent.upsert({
      where: { id },
      update: {},
      create: { id, title, description, dateLabel, phase, position, visible: true },
    });
  }

  const existingMomentCount = await prisma.moment.count();
  if (existingMomentCount === 0) {
    const seedMomentContents = [
      "最近在重新整理 Java 集合框架的笔记。先把接口语义和使用场景分清，再去记具体实现。",
      "今天给博客补了一轮数据库迁移测试。能重复跑通，比只在开发库里看起来正常更让人安心。",
      "把学习计划缩成一件可完成的小事：读一节、写一个例子、留下一个还没想明白的问题。",
      "这座花园会慢慢长出照片、音乐和更短的日常记录。先保持真实，再追求丰富。",
    ];
    for (const content of seedMomentContents) {
      const seedTime = new Date();
      await prisma.moment.create({
        data: {
          content,
          status: ContentStatus.PUBLISHED,
          publishedAt: seedTime,
          createdAt: seedTime,
        },
      });
    }
  }

  const momentCount = await prisma.moment.count();
  console.log(`Seed complete: ${posts.length} posts, ${projects.length} projects, ${tags.length} tags, ${momentCount} moments.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
