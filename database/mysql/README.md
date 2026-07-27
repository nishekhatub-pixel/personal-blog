# MySQL 生产数据库

生产环境使用 `prisma/schema.mysql.prisma`，最低支持 MySQL 8.0，并统一采用 `utf8mb4_unicode_ci`。

## 初始化

1. 创建空数据库和最小权限应用账户。
2. 设置 `MYSQL_DATABASE_URL="mysql://user:password@host:3306/r7_blog"`。
3. 首次初始化可以执行 `prisma/mysql-migrations/202607270001_init/migration.sql`。
4. 构建生产版本前用 MySQL schema 生成标准 `@prisma/client`，再检查差异：

```bash
pnpm db:mysql:generate
pnpm db:mysql:diff
```

`db:mysql:generate` 会让应用导入的 `@prisma/client` 使用 MySQL provider。回到本地 SQLite 开发时运行 `pnpm db:generate` 即可切回。SQLite 的 `prisma/migrations` 用于本地开发和自动化测试。两份 schema 的模型、关系、删除策略与索引保持等价，MySQL 版本额外明确了文本列长度和字符集。

## 权限与备份

运行时账户仅授予目标数据库的 SELECT、INSERT、UPDATE、DELETE 权限。部署迁移使用独立账户，额外授予 CREATE、ALTER、INDEX、REFERENCES 权限。生产备份至少每日执行一次，并定期在隔离环境验证恢复。
