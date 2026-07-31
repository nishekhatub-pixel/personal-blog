import { hash } from "bcryptjs";
import { PrismaClient, UserRole } from "@prisma/client";
import { createInterface } from "node:readline/promises";
import { z } from "zod";

const inputSchema = z.object({
  email: z.string().trim().email().max(254).transform((value) =>
    value.toLocaleLowerCase("en-US"),
  ),
  name: z.string().trim().min(1).max(80),
  password: z.string().min(12).max(128),
});

async function readPipedInput() {
  if (process.stdin.isTTY) return {};

  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const [email, password, name] = Buffer.concat(chunks)
    .toString("utf8")
    .split(/\r?\n/);

  return { email, password, name: name || undefined };
}

async function readHiddenPassword(prompt: string) {
  const input = process.stdin;
  const output = process.stdout;

  if (!input.isTTY || typeof input.setRawMode !== "function") {
    throw new Error("密码必须通过交互式终端或标准输入管道提供。");
  }

  return new Promise<string>((resolve, reject) => {
    let value = "";
    const finish = () => {
      input.off("data", onData);
      input.setRawMode(false);
      input.pause();
      output.write("\n");
    };
    const onData = (chunk: Buffer | string) => {
      const text = chunk.toString();
      for (const character of text) {
        if (character === "\r" || character === "\n") {
          finish();
          resolve(value);
          return;
        }
        if (character === "\u0003") {
          finish();
          reject(new Error("管理员创建已取消。"));
          return;
        }
        if (character === "\u007f" || character === "\b") {
          value = value.slice(0, -1);
          continue;
        }
        if (character >= " ") value += character;
      }
    };

    output.write(prompt);
    input.setEncoding("utf8");
    input.setRawMode(true);
    input.resume();
    input.on("data", onData);
  });
}

async function readInteractiveInput() {
  const terminal = createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  const email = await terminal.question("管理员邮箱: ");
  terminal.close();
  const password = await readHiddenPassword("管理员密码（12-128位）: ");
  return { email, password };
}

async function main() {
  const suppliedInput = process.stdin.isTTY
    ? process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD
      ? {}
      : await readInteractiveInput()
    : await readPipedInput();
  const input = inputSchema.parse({
    email: suppliedInput.email ?? process.env.ADMIN_EMAIL,
    name: process.env.ADMIN_NAME ?? "R7",
    password: suppliedInput.password ?? process.env.ADMIN_PASSWORD,
  });
  const prisma = new PrismaClient();

  try {
    const passwordHash = await hash(input.password, 12);
    const user = await prisma.user.upsert({
      where: { email: input.email },
      update: {
        name: input.name,
        passwordHash,
        role: UserRole.ADMIN,
      },
      create: {
        email: input.email,
        name: input.name,
        passwordHash,
        role: UserRole.ADMIN,
      },
      select: {
        email: true,
        name: true,
        role: true,
      },
    });

    console.log(
      JSON.stringify({
        status: "ADMIN_READY",
        email: user.email,
        name: user.name,
        role: user.role,
        passwordPersistedAsHash: passwordHash.startsWith("$2"),
      }),
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  if (error instanceof z.ZodError) {
    console.error("管理员信息校验失败：请使用有效邮箱和 12 至 128 位密码。");
  } else {
    console.error("管理员创建失败。", error);
  }
  process.exitCode = 1;
});
