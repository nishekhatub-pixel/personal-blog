import { Mail, MessageSquareText } from "lucide-react";
import type { Metadata } from "next";
import { getSiteSettings } from "@/lib/data";
import { ContactForm } from "@/components/site/public-forms";
import { PageIntro } from "@/components/site/page-intro";

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
    <main id="main-content">
      <PageIntro
        eyebrow={<><MessageSquareText aria-hidden size={17} /> 联系 R7</>}
        title="从一个具体问题开始交流"
        description="项目细节、学习方法、网站反馈，或者一次真诚的同学交流，都欢迎。"
        actions={
          <>
            {email ? (
              <a href={`mailto:${email}`} className="inline-flex min-h-11 items-center gap-2 font-semibold text-[var(--accent)]">
                <Mail aria-hidden size={18} /> {email}
              </a>
            ) : (
              <p className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold">
                <Mail aria-hidden size={18} /> 站内留言会安全存入后台
              </p>
            )}
          </>
        }
      />

      <div className="mx-auto max-w-[1180px] px-[var(--page-gutter)] pb-[clamp(5rem,10vw,9rem)]">
        <section className="garden-panel grid gap-10 p-6 lg:grid-cols-12 lg:p-10" aria-labelledby="contact-form-heading">
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
