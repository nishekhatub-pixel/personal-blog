import { z } from "zod";

const environmentSchema = z.object({
  APP_URL: z.string().url().default("http://localhost:3000"),
  SESSION_SECRET: z.string().min(24).default("r7-local-session-secret-2026-change-before-production"),
  IP_HASH_SECRET: z.string().min(24).default("r7-local-ip-hash-secret-2026-change-before-production"),
  UPLOAD_MAX_BYTES: z.coerce.number().int().positive().max(16 * 1024 * 1024).default(8 * 1024 * 1024),
  AUDIO_UPLOAD_MAX_BYTES: z.coerce
    .number()
    .int()
    .min(1024 * 1024)
    .max(200 * 1024 * 1024)
    .default(25 * 1024 * 1024),
});

const parsed = environmentSchema.safeParse({
  APP_URL: process.env.APP_URL,
  SESSION_SECRET: process.env.SESSION_SECRET,
  IP_HASH_SECRET: process.env.IP_HASH_SECRET,
  UPLOAD_MAX_BYTES: process.env.UPLOAD_MAX_BYTES,
  AUDIO_UPLOAD_MAX_BYTES: process.env.AUDIO_UPLOAD_MAX_BYTES,
});

if (!parsed.success) {
  throw new Error(`环境变量配置无效：${parsed.error.issues.map((issue) => issue.path.join(".")).join("、")}`);
}

export const env = parsed.data;
