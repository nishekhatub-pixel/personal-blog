const appRoot =
  process.env.R7_APP_ROOT || "/var/www/r7-next-blog/current";
const envFile =
  process.env.R7_ENV_FILE ||
  "/var/www/r7-next-blog/shared/.env.production";
const logRoot =
  process.env.R7_LOG_ROOT || "/var/www/r7-next-blog/shared/logs";

module.exports = {
  apps: [
    {
      name: "r7-blog",
      cwd: appRoot,
      script: `${appRoot}/.next/standalone/server.js`,
      interpreter: "node",
      node_args: [`--env-file=${envFile}`],
      instances: 1,
      exec_mode: "fork",
      watch: false,
      autorestart: true,
      restart_delay: 3000,
      max_memory_restart: "750M",
      min_uptime: "10s",
      max_restarts: 10,
      kill_timeout: 10000,
      listen_timeout: 15000,
      merge_logs: true,
      time: true,
      error_file: `${logRoot}/r7-blog-error.log`,
      out_file: `${logRoot}/r7-blog-out.log`,
      env_production: {
        NODE_ENV: "production",
        HOSTNAME: "127.0.0.1",
        PORT: "3000",
      },
    },
  ],
};
