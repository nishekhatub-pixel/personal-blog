import { ArrowUpRight, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/LoginForm";
import { ThemeToggle } from "@/components/site/theme-toggle";
import { getCurrentUser } from "@/lib/auth";

export default async function AdminLoginPage() {
  const user = await getCurrentUser();
  if (user?.role === "ADMIN") redirect("/admin");

  return (
    <main className="relative grid min-h-[100dvh] bg-[var(--canvas)] text-[var(--ink)] lg:grid-cols-[minmax(20rem,0.8fr)_minmax(34rem,1.2fr)]" id="main-content">
      <div className="absolute right-5 top-5 z-10">
        <ThemeToggle />
      </div>
      <section className="relative hidden overflow-hidden border-r border-[var(--line)] p-10 lg:flex lg:flex-col lg:justify-between">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--success)]">
          R7 / PRIVATE
        </p>
        <div>
          <p className="mb-7 max-w-sm text-sm leading-7 text-[var(--muted)]">
            写作不是一次发布，而是一套持续校准、复盘与生长的系统。
          </p>
          <div
            aria-hidden="true"
            className="select-none font-mono text-[clamp(13rem,28vw,29rem)] font-semibold leading-[0.68] tracking-[-0.12em] text-[color-mix(in_srgb,var(--ink)_6%,transparent)]"
          >
            7
          </div>
        </div>
        <p className="font-mono text-xs text-[var(--muted)]">
          GROWTH LOOP · 2026
        </p>
      </section>

      <section className="grid place-items-center px-5 py-12 sm:px-10">
        <div className="w-full max-w-md">
          <Link
            className="mb-14 inline-flex min-h-11 items-center gap-2 text-sm text-[var(--muted)] underline-offset-4 hover:text-[var(--ink)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            href="/"
          >
            返回公开网站
            <ArrowUpRight aria-hidden="true" size={15} />
          </Link>
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-[var(--success)]">
            Secure entrance
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">
            进入编辑室
          </h1>
          <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
            管理文章、项目、媒体与读者评论。连续失败会触发限流保护。
          </p>
          <LoginForm />
          <p className="mt-8 flex items-start gap-2 border-t border-[var(--line)] pt-5 text-xs leading-5 text-[var(--muted)]">
            <ShieldCheck
              aria-hidden="true"
              className="mt-0.5 shrink-0 text-[var(--accent)]"
              size={15}
            />
            会话 Cookie 仅限 HTTP 访问，并采用 SameSite 防护。
          </p>
        </div>
      </section>
    </main>
  );
}
