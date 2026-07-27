# Personal Garden V2 数据库迁移

## 迁移标识

- SQLite：`prisma/migrations/202607270002_personal_garden_v2/migration.sql`
- SQLite 回滚参考：`prisma/migrations/202607270002_personal_garden_v2/rollback.sql`
- MySQL 8：`prisma/mysql-migrations/202607270002_personal_garden_v2/migration.sql`
- MySQL 8 回滚参考：`prisma/mysql-migrations/202607270002_personal_garden_v2/rollback.sql`

迁移为增量迁移，不删除、不改名现有文章、项目、评论、媒体和设置核心字段。

## 新增业务模型

| 模型 | 用途 |
| --- | --- |
| `PhotoAlbum` | 相册元数据、封面、日期、城市、发布和排序 |
| `Photo` | 相册中的 Media 引用、Alt、说明、地点、日期和排序 |
| `Moment` | 说说正文、心情、天气、置顶和发布状态 |
| `MomentMedia` | 说说与 Media 的有序关系 |
| `MomentComment` | 待审核说说评论与管理员回复 |
| `MomentReaction` | 每个访客标识对一条说说的点赞状态 |
| `MusicTrack` | 上传或 HTTPS 音频、封面、歌词、随记和发布状态 |
| `Playlist` | 歌单元数据与发布状态 |
| `PlaylistTrack` | 歌单曲目顺序和备注 |
| `GuestbookMessage` | 待审核留言、固定色键、置顶和管理员回复 |
| `FriendLink` | 已发布友链或待审核申请，联系方式仅后台可见 |

SQLite 与 MySQL schema 保持相同业务关系、唯一约束和查询索引；数据库类型细节分别使用各自 provider 的合法表达。

## SiteSetting

V2 继续使用现有 `SiteSetting` 表，Seed 以幂等 upsert 补充以下键：

```text
siteName
siteSubtitle
profileName
profileBio
profileAvatar
siteLaunchDate
nowText
noticeText
locationName
latitude
longitude
timezone
weatherEnabled
petalsEnabled
petalsDensity
githubUrl
email
musicEnabled
guestbookEnabled
friendsEnabled
```

再次 Seed 不会清空用户创建的相册、照片、音乐、留言或友链。内置说说只在数据库完全没有说说时创建，并且仅使用任务已经确认的学习主题。

## SQLite 升级

先停止正在使用数据库文件的开发服务器，然后备份：

```powershell
Copy-Item prisma\dev.db .backups\dev-before-v2.db
```

应用并核验：

```bash
pnpm db:generate
pnpm db:deploy
pnpm db:seed
pnpm db:verify
```

检查迁移状态：

```bash
pnpm exec prisma migrate status
pnpm exec prisma migrate diff --from-migrations prisma/migrations --to-schema prisma/schema.prisma --shadow-database-url "file:./shadow.db"
```

不要在已有数据库上运行 `prisma migrate reset`。

## MySQL 8 升级

1. 对数据库和上传目录创建同一时间点备份。
2. 在预发布副本执行增量 SQL。
3. 使用 MySQL schema 重新生成 Client。
4. 运行应用构建与只读检查。
5. 再切换生产流量。

示例：

```bash
pnpm db:mysql:generate
pnpm exec prisma db execute \
  --schema prisma/schema.mysql.prisma \
  --file prisma/mysql-migrations/202607270002_personal_garden_v2/migration.sql
pnpm build:mysql
```

`pnpm db:deploy` 只处理默认 SQLite migrations，不能替代 MySQL 增量 SQL。

## 回滚

回滚 SQL 会删除 V2 新表，因此只适用于：

- 已经确认不需要 V2 新数据；
- 或已完整导出 V2 数据和上传对象；
- 并且应用代码也回退到迁移前版本。

在任何正式环境执行回滚前，先验证备份可恢复。只回滚数据库而保留 V2 应用会导致运行时错误；只恢复数据库而不恢复 `public/uploads` 会产生失效媒体地址。

## 本次本地迁移记录

迁移前数据库已备份到：

```text
.backups/dev-before-v2-20260727-095040.db
```

本地 SQLite 已实际应用 V2 增量迁移并重复运行 Seed 验证幂等。由于当前工作区没有可用 MySQL 8 服务，MySQL schema 与 SQL 已做静态格式/差异检查，但未声称在真实 MySQL 实例执行。
