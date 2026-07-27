import { Mail, MessageSquareText } from "lucide-react";
import type { Metadata } from "next";
import { getSiteSettings } from "@/lib/data";
import { ContactForm } from "@/components/site/public-forms";

export const metadata: Metadata = {
  title: "联系",
  description: "通过站内留言或邮件联系 R7，交流项目、学习与合作想法。",
  alternates: { canonical: "/contact" },
};
export const dynamic = "force-dynamic";

export default async function ContactPage() {
  const settings = await getSiteSettings();
  const email = settings.contactEmail && !settings.contactEmail.endsWith("@example.com") ? settings.contactEmail : "";

  return (
    <main id="main-content" className="px-[clamp(1rem,4vw,4rem)] py-[clamp(4rem,10vw,9rem)]">
      <div className="mx-auto max-w-[1180px]">
        <header className="grid gap-9 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <p className="flex items-center gap-2 text-sm font-semibold text-[var(--success)]"><MessageSquareText aria-hidden size={18} /> 联系 R7</p>
            <h1 className="mt-5 text-[clamp(3.5rem,9vw,8rem)] font-black leading-[.87] tracking-[-.08em]">
              从一个具体问题
              <br />
              开始交流。
            </h1>
          </div>
          <div className="lg:col-span-4 lg:pt-12">
            <p className="text-lg leading-8 text-[var(--muted)]">项目细节、学习方法、网站反馈，或者一次真诚的同学交流，都欢迎。</p>
            {email ? (
              <a href={`mailto:${email}`} className="mt-7 inline-flex items-center gap-2 font-semibold text-[var(--success)]">
                <Mail aria-hidden size={18} /> {email}
              </a>
            ) : (
              <p className="mt-7 inline-flex items-center gap-2 text-sm font-semibold">
                <Mail aria-hidden size={18} /> 站内留言会安全存入后台
              </p>
            )}
          </div>
        </header>

        <section className="mt-20 grid gap-12 border-t border-[var(--line)] pt-12 lg:grid-cols-12" aria-labelledby="contact-form-heading">
          <div className="lg:col-span-3">
            <h2 id="contact-form-heading" className="text-3xl font-semibold tracking-[-.05em]">写下你的想法</h2>
            <p className="mt-4 leading-7 text-[var(--muted)]">我会阅读每一条有效留言。请提供可回复的邮箱，不会公开或用于订阅。</p>
          </div>
          <div className="lg:col-span-8 lg:col-start-5">
            <ContactForm />
          </div>
        </section>
      </div>
    </main>
  );
}
