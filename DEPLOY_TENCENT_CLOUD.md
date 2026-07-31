# R7 Digital Garden 腾讯云轻量应用服务器部署手册

本文适用于当前仓库的 Next.js 16 App Router、React 19、Prisma 6 和
PostgreSQL 版本。目标结构为：

```text
Internet
   |
Nginx :80 / :443
   |-- /uploads/ -> /var/www/r7-blog-storage/
   `-- /          -> 127.0.0.1:3000
                         |
                       PM2
                         |
               Next.js standalone
                         |
                    PostgreSQL
```

默认目录：

```text
/var/www/r7-next-blog/
├── current -> releases/<release-id>
├── releases/
└── shared/
    ├── .env.production
    └── logs/

/var/www/r7-blog-storage/
├── images/
├── photos/
├── music/
├── avatars/
└── temp/
```

应用端口为 `127.0.0.1:3000`，PM2 应用名为 `r7-blog`。3000 和 5432
不应直接暴露到公网。

## 1. 上线前必须准备的内容

- 腾讯云轻量应用服务器公网 IP
- 具有 sudo 权限的 SSH 账号或 SSH 密钥
- 最终域名，例如 `blog.example.com`
- Git 仓库 URL 与服务器使用的只读 deploy key
- 生产 PostgreSQL 选择：
  - 方案 A：先继续使用现有托管 PostgreSQL，推荐
  - 方案 B：迁移到服务器内 PostgreSQL
- 独立生成的 `SESSION_SECRET` 和 `IP_HASH_SECRET`
- 管理员邮箱和强密码

不要把真实数据库 URL、密码、Token 或 SSH 私钥提交到 Git。

## 2. 腾讯云防火墙

在轻量应用服务器控制台中：

- TCP 22：只允许自己的固定公网 IP；若暂时无法固定，尽快收窄
- TCP 80：允许 `0.0.0.0/0` 和需要时的 IPv6
- TCP 443：允许 `0.0.0.0/0` 和需要时的 IPv6
- TCP 3000：不开放
- TCP 5432：本机数据库不开放；远程管理应使用 SSH 隧道

腾讯云说明轻量服务器防火墙控制入站流量，并建议遵循最小授权原则：

https://cloud.tencent.com/document/product/1207/44577

## 3. 第一次连接只做只读检查

```bash
ssh ubuntu@SERVER_IP
```

在安装或修改任何内容前执行：

```bash
uname -a
cat /etc/os-release
node -v
npm -v
nginx -v
pm2 -v
psql --version
df -h
free -h
sudo ss -lntp
sudo nginx -T
ls -la /var/www
pm2 list
```

逐项确认：

- Ubuntu 版本、CPU、内存、磁盘空间
- 22、80、443、3000、5432 的实际占用
- 已有 Nginx server block 和域名
- 已有 PHP 博客目录、数据库与上传目录
- 已有 PM2 应用

旧 PHP 博客必须保留。新站使用独立目录、独立 PM2 名称、独立端口和独立
域名或子域名。

备份当前 Nginx 配置：

```bash
mkdir -p "$HOME/r7-preflight-backup"
sudo nginx -T > "$HOME/r7-preflight-backup/nginx-before-r7.txt"
sudo cp -a /etc/nginx \
  "$HOME/r7-preflight-backup/nginx-$(date +%Y%m%d-%H%M%S)"
```

## 4. 安装基础软件

更新 Ubuntu：

```bash
sudo apt update
sudo apt upgrade
sudo apt install -y git curl ca-certificates build-essential nginx \
  postgresql-client
```

Node.js 官方发布页在 2026 年 7 月将 Node 24 标为 LTS。安装 Node 24 LTS
及自带 npm；若服务器已有受支持 LTS，请先评估再替换：

```bash
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt install -y nodejs
node -v
npm -v
```

Node.js LTS 状态：

https://nodejs.org/en/about/previous-releases

安装 PM2：

```bash
sudo npm install -g pm2@latest
pm2 -v
```

## 5. 创建独立运行用户与目录

如果 `r7` 用户不存在：

```bash
sudo adduser --disabled-password --gecos "" r7
sudo usermod -g www-data r7
```

创建目录。`2750` 的 setgid 位确保新上传文件继承 `www-data` 组，Nginx
能够读取但其他系统用户不能浏览：

```bash
sudo install -d -o r7 -g www-data -m 2750 \
  /var/www/r7-next-blog \
  /var/www/r7-next-blog/releases \
  /var/www/r7-next-blog/shared \
  /var/www/r7-next-blog/shared/logs \
  /var/www/r7-blog-storage \
  /var/www/r7-blog-storage/images \
  /var/www/r7-blog-storage/photos \
  /var/www/r7-blog-storage/music \
  /var/www/r7-blog-storage/avatars \
  /var/www/r7-blog-storage/temp
```

验证权限：

```bash
namei -l /var/www/r7-blog-storage
sudo -u r7 test -w /var/www/r7-blog-storage
sudo -u www-data test -r /var/www/r7-blog-storage
```

## 6. 配置 Git 只读部署密钥

为 `r7` 用户创建专用 SSH deploy key，把公钥作为仓库的只读 Deploy Key。
不要复用个人主密钥：

```bash
sudo -iu r7
ssh-keygen -t ed25519 -C "r7-blog-deploy" \
  -f "$HOME/.ssh/r7_blog_deploy"
cat "$HOME/.ssh/r7_blog_deploy.pub"
```

在 `~/.ssh/config` 中为对应 Git 主机指定该密钥，权限设为 600。验证：

```bash
ssh -T git@github.com
```

如果仓库不在 GitHub，请换成实际 Git 服务域名。

## 7. 生产环境变量

将仓库中的 `.env.production.example` 复制为服务器共享环境文件：

```bash
sudo -u r7 cp /path/to/checkout/.env.production.example \
  /var/www/r7-next-blog/shared/.env.production
sudo chmod 600 /var/www/r7-next-blog/shared/.env.production
sudo -u r7 nano /var/www/r7-next-blog/shared/.env.production
```

关键值：

```env
NODE_ENV=production
PORT=3000
HOSTNAME=127.0.0.1
DATABASE_URL="postgresql://..."
APP_URL="https://blog.example.com"
SESSION_SECRET="至少 32 个随机字符"
IP_HASH_SECRET="另一组至少 32 个随机字符"
STORAGE_DRIVER=local
UPLOAD_ROOT="/var/www/r7-blog-storage"
UPLOAD_MAX_BYTES=104857600
AUDIO_UPLOAD_MAX_BYTES=104857600
```

生成两个不同的 secret：

```bash
openssl rand -base64 48
openssl rand -base64 48
```

项目使用自定义数据库 Session，不使用 NextAuth/Auth.js，因此不要凭空添加
`NEXTAUTH_URL`、`NEXTAUTH_SECRET` 或 `AUTH_SECRET`。`APP_URL` 必须与最终
HTTPS 域名完全一致，否则 Secure Cookie 和同源写操作会失败。

## 8. PostgreSQL 选择

### 方案 A：先继续使用现有托管 PostgreSQL

这是首次从 Vercel 搬到腾讯云时风险最低的选择：

1. 将现有生产 `DATABASE_URL` 安全写入共享 `.env.production`。
2. 只迁移应用运行平台和上传存储。
3. 完整验证后台读写。
4. 稳定后再安排独立数据库迁移窗口。

不要把连接串打印到日志或 shell history。

### 方案 B：服务器内安装 PostgreSQL

```bash
sudo apt install -y postgresql postgresql-contrib
sudo systemctl enable --now postgresql
sudo -u postgres createuser --pwprompt r7_app
sudo -u postgres createdb --owner r7_app r7_blog
sudo -u postgres psql -d r7_blog \
  -c "ALTER DATABASE r7_blog SET timezone TO 'UTC';"
```

保持 PostgreSQL 只监听本机，且不要在腾讯云防火墙开放 5432。测试连接：

```bash
psql "postgresql://r7_app:PASSWORD@127.0.0.1:5432/r7_blog" \
  -c "select current_database(), current_user;"
```

将密码只写入 `.env.production`，不要写进本文或 Git。

## 9. 现有 PostgreSQL 数据迁移

生产数据迁移前必须安排维护窗口，并先备份。以下变量只在当前终端使用：

```bash
read -rsp "Source DATABASE_URL: " SOURCE_DATABASE_URL
echo
read -rsp "Target DATABASE_URL: " TARGET_DATABASE_URL
echo
export SOURCE_DATABASE_URL TARGET_DATABASE_URL
```

导出为 custom format：

```bash
mkdir -p "$HOME/r7-db-backups"
BACKUP_FILE="$HOME/r7-db-backups/r7-$(date +%Y%m%d-%H%M%S).dump"
pg_dump --format=custom --no-owner --no-acl \
  --file="$BACKUP_FILE" "$SOURCE_DATABASE_URL"
pg_restore --list "$BACKUP_FILE" | head -n 30
```

恢复到事先创建的空目标库：

```bash
pg_restore --exit-on-error --no-owner --no-acl \
  --dbname="$TARGET_DATABASE_URL" "$BACKUP_FILE"
```

如果 dump 中包含 `_prisma_migrations`，恢复后由 `prisma migrate deploy`
继续应用待执行 migration。不要对已恢复的业务库执行 `migrate reset`。

验证关键表行数。Prisma 表名区分大小写：

```bash
for table in User Post Project Media PhotoAlbum Photo Moment \
  MusicTrack GuestbookMessage FriendLink; do
  printf "%s source=" "$table"
  psql "$SOURCE_DATABASE_URL" -Atc "select count(*) from \"$table\";"
  printf "%s target=" "$table"
  psql "$TARGET_DATABASE_URL" -Atc "select count(*) from \"$table\";"
done
```

再验证：

- 管理员账号数量
- 已发布文章、项目、说说和相册数量
- 媒体 URL
- 待审核留言和评论
- 最新更新时间
- 后台登录与一条可回滚的写入

只有验证全部通过，才把应用 `DATABASE_URL` 切到目标库。失败时恢复旧
`DATABASE_URL` 并 reload PM2；旧数据库在确认稳定前保持只读备份状态。

PostgreSQL 备份工具文档：

- https://www.postgresql.org/docs/current/app-pgdump.html
- https://www.postgresql.org/docs/current/app-pgrestore.html

## 10. 第一次部署

先用临时目录获取部署脚本：

```bash
sudo -iu r7
git clone --branch main REPOSITORY_URL /tmp/r7-blog-bootstrap
```

执行部署。私有仓库 URL 不要包含明文 Token：

```bash
REPO_URL="git@github.com:OWNER/REPOSITORY.git" \
BRANCH="main" \
bash /tmp/r7-blog-bootstrap/deploy/deploy.sh
```

脚本会：

1. 创建新的 release，不覆盖旧 release。
2. 在 Linux 上执行 `npm ci --include=optional`。
3. 执行 `./node_modules/.bin/prisma generate`。
4. 执行 `./node_modules/.bin/prisma migrate deploy`。
5. 执行 `npm run build`。
6. 补齐 standalone 的 `public` 和 `.next/static`。
7. 原子切换 `current` symlink。
8. 由 PM2 reload `r7-blog`。
9. 检查 `127.0.0.1:3000`。
10. 健康检查失败时恢复上一个应用 release。

生产 migration 只使用：

```bash
./node_modules/.bin/prisma generate
./node_modules/.bin/prisma migrate deploy
```

Prisma 官方说明 `migrate deploy` 用于生产或预发布环境应用待执行 migration：

https://www.prisma.io/docs/cli/migrate/deploy

检查：

```bash
pm2 status r7-blog
pm2 logs r7-blog --lines 100
curl -I http://127.0.0.1:3000/
```

## 11. PM2 开机启动

以 `r7` 用户执行：

```bash
pm2 startup
```

复制 PM2 输出的那条 sudo 命令执行，然后：

```bash
pm2 save
systemctl status "pm2-r7"
```

PM2 官方要求先生成 startup script，再用 `pm2 save` 保存进程列表：

https://pm2.keymetrics.io/docs/usage/startup/

## 12. 配置 Nginx

先再次检查现有站点，不能覆盖旧 PHP 博客：

```bash
sudo nginx -T
ls -la /etc/nginx/sites-available
ls -la /etc/nginx/sites-enabled
```

复制新配置：

```bash
sudo cp /var/www/r7-next-blog/current/deploy/nginx/r7-blog.conf \
  /etc/nginx/sites-available/r7-blog
sudo nano /etc/nginx/sites-available/r7-blog
```

至少替换：

- `blog.example.com`
- 如有变化，持久化目录
- 如 3000 已被占用，应用端口与反代端口必须同时调整

启用新站点，不删除旧链接：

```bash
sudo ln -s /etc/nginx/sites-available/r7-blog \
  /etc/nginx/sites-enabled/r7-blog
sudo nginx -t
sudo systemctl reload nginx
```

配置将 100 MB 上传上限设为 105 MB，为 multipart 边界预留空间；上传文件
从 `/var/www/r7-blog-storage` 直接读取，应用请求反代到
`127.0.0.1:3000`。Nginx 官方反向代理文档：

https://nginx.org/en/docs/http/ngx_http_proxy_module.html

## 13. 域名与 HTTPS

将域名 A/AAAA 记录指向服务器。DNS 生效且 HTTP 可访问后：

```bash
sudo snap install --classic certbot
sudo ln -s /snap/bin/certbot /usr/local/bin/certbot
sudo certbot --nginx -d blog.example.com
sudo certbot renew --dry-run
```

Certbot 官方 Ubuntu + Nginx 指南：

https://certbot.eff.org/instructions?os=ubuntufocal&ws=nginx

证书完成后，把 `.env.production` 中 `APP_URL` 更新为完全一致的
`https://...`，再执行：

```bash
R7_APP_ROOT=/var/www/r7-next-blog/current \
R7_ENV_FILE=/var/www/r7-next-blog/shared/.env.production \
R7_LOG_ROOT=/var/www/r7-next-blog/shared/logs \
pm2 startOrReload /var/www/r7-next-blog/current/ecosystem.config.cjs \
  --only r7-blog --env production --update-env
pm2 save
```

## 14. 每次更新部署

先备份数据库和上传目录，再运行：

```bash
REPO_URL="git@github.com:OWNER/REPOSITORY.git" \
BRANCH="main" \
bash /var/www/r7-next-blog/current/deploy/deploy.sh
```

查看最新 release：

```bash
readlink -f /var/www/r7-next-blog/current
ls -1dt /var/www/r7-next-blog/releases/* | head
```

部署脚本不会删除旧 release，也不会删除上传目录或 `.env.production`。

## 15. 回滚

部署脚本健康检查失败时会自动恢复上一个应用 release。手动回滚：

```bash
PREVIOUS_RELEASE="/var/www/r7-next-blog/releases/RELEASE_ID"
test -d "$PREVIOUS_RELEASE"
ln -sfn "$PREVIOUS_RELEASE" /var/www/r7-next-blog/current

R7_APP_ROOT=/var/www/r7-next-blog/current \
R7_ENV_FILE=/var/www/r7-next-blog/shared/.env.production \
R7_LOG_ROOT=/var/www/r7-next-blog/shared/logs \
pm2 startOrReload /var/www/r7-next-blog/current/ecosystem.config.cjs \
  --only r7-blog --env production --update-env
```

注意：应用回滚不等于数据库回滚。migration 必须尽量向后兼容；需要数据库
回滚时，用上线前 `pg_dump` 恢复到新建数据库，验证后再切连接串，不能直接
覆盖仍在使用的数据库。

## 16. 日志与日常检查

```bash
pm2 status r7-blog
pm2 describe r7-blog
pm2 logs r7-blog --lines 200
tail -n 200 /var/log/nginx/error.log
sudo journalctl -u nginx --since "30 minutes ago"
df -h
du -sh /var/www/r7-blog-storage
```

验证后台：

- 登录、退出和 Session 刷新
- 新建、编辑、删除文章
- PNG/JPEG/WebP/AVIF/GIF/TIFF/HEIC/HEIF 图片上传
- 单文件 100 MB 限制
- 相册批量上传与照片排序
- MP3/M4A/AAC/OGG 本地音频上传
- 本地封面、内嵌封面、内嵌歌词和 LRC 当前行
- 媒体删除时的引用保护
- 设置保存
- 评论、留言和友链审核

## 17. 数据与上传备份

PostgreSQL：

```bash
mkdir -p "$HOME/r7-db-backups"
pg_dump --format=custom --no-owner --no-acl \
  --file="$HOME/r7-db-backups/r7-$(date +%Y%m%d-%H%M%S).dump" \
  "$DATABASE_URL"
```

上传目录：

```bash
mkdir -p "$HOME/r7-upload-backups"
tar --create --gzip \
  --file="$HOME/r7-upload-backups/uploads-$(date +%Y%m%d-%H%M%S).tar.gz" \
  --directory=/var/www r7-blog-storage
```

至少把数据库 dump 和上传归档复制到服务器之外，并定期做恢复演练。数据库
和上传目录必须位于同一恢复时间点，否则会出现失效 URL 或孤立文件。

## 18. 故障定位

### 502 Bad Gateway

```bash
pm2 status r7-blog
pm2 logs r7-blog --lines 200
curl -v http://127.0.0.1:3000/
sudo ss -lntp | grep 3000
sudo nginx -t
```

### 后台登录循环

- `APP_URL` 是否为最终 HTTPS 域名
- Nginx 是否转发 `Host`、`X-Forwarded-Host` 和 `X-Forwarded-Proto`
- 浏览器 Cookie 是否带 Secure
- 服务器时间是否正确

### 413 Request Entity Too Large

- Nginx `client_max_body_size 105m`
- `UPLOAD_MAX_BYTES=104857600`
- `AUDIO_UPLOAD_MAX_BYTES=104857600`
- 修改后是否 `nginx -t` 并 reload

### Sharp / libvips 加载失败

- 不要复制 Windows `node_modules`
- 在 Ubuntu release 内重新执行 `npm ci --include=optional`
- 检查 `node -p "process.platform + ' ' + process.arch"`
- 检查 `node -e "require('sharp'); console.log(require('sharp').versions)"`
- 确认 Node 版本为受支持 LTS

### 上传成功但图片 404

- `UPLOAD_ROOT` 与 Nginx alias 是否都指向
  `/var/www/r7-blog-storage`
- `r7` 用户是否可写
- `www-data` 是否可读
- 数据库 URL 是否仍是 `/uploads/...` 相对路径

## 19. 当前交付状态

仓库已经具备：

- `output: "standalone"`
- 外部持久化上传根目录
- 旧上传 URL 兼容
- PM2 单实例配置
- Nginx 反向代理与上传 alias 示例
- release + symlink 部署脚本
- PostgreSQL production migration
- HTTPS 与备份操作手册

尚未执行真实服务器操作，因为当前没有服务器 IP、SSH 凭据、真实域名和目标
数据库选择。拿到这些信息后，第一步仍然是第 3 节的只读检查，不会直接安装
或覆盖旧站。
