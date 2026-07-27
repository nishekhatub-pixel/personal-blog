"use client";

import { contact, createComment, subscribe } from "@/lib/actions/public";
import { useActionState } from "react";

type ActionState = {
  ok: boolean;
  message: string;
  fieldErrors?: Record<string, string[]>;
};

const initialState: ActionState = { ok: false, message: "" };

function FieldError({ state, name }: { state: ActionState; name: string }) {
  const message = state.fieldErrors?.[name]?.[0];
  return message ? <p className="mt-2 text-sm text-[var(--danger)]">{message}</p> : null;
}

export function SubscribeForm() {
  const [state, action, pending] = useActionState(
    async (_previous: ActionState, formData: FormData) => subscribe(formData),
    initialState,
  );

  return (
    <form action={action} className="mt-8 max-w-xl" noValidate>
      <div className="sr-only" aria-hidden>
        <label htmlFor="subscribe-company">公司</label>
        <input id="subscribe-company" name="company" tabIndex={-1} autoComplete="off" />
      </div>
      <label htmlFor="subscribe-email" className="mb-2 block text-sm font-semibold">邮箱</label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          id="subscribe-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          aria-describedby={state.message ? "subscribe-result" : undefined}
          className="min-h-12 min-w-0 flex-1 rounded-lg border border-[var(--line)] bg-[var(--canvas)] px-4 text-[var(--ink)] outline-none placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
          placeholder="you@example.com"
        />
        <button
          type="submit"
          disabled={pending}
          className="min-h-12 shrink-0 rounded-full bg-[var(--accent)] px-6 font-semibold text-[var(--accent-ink)] transition-transform active:scale-[.98] disabled:cursor-wait disabled:opacity-70"
        >
          {pending ? "正在提交" : "加入回路"}
        </button>
      </div>
      <FieldError state={state} name="email" />
      {state.message ? (
        <p id="subscribe-result" aria-live="polite" className={`mt-3 text-sm ${state.ok ? "text-[var(--success)]" : "text-[var(--danger)]"}`}>
          {state.message}
        </p>
      ) : null}
    </form>
  );
}

export function ContactForm() {
  const [state, action, pending] = useActionState(
    async (_previous: ActionState, formData: FormData) => contact(formData),
    initialState,
  );
  const fields = [
    { name: "name", label: "怎么称呼你", type: "text", autoComplete: "name", placeholder: "你的名字" },
    { name: "email", label: "回复邮箱", type: "email", autoComplete: "email", placeholder: "you@example.com" },
    { name: "subject", label: "想聊什么", type: "text", autoComplete: "off", placeholder: "项目、学习或一次认真交流" },
  ];

  return (
    <form action={action} className="space-y-6" noValidate>
      <div className="grid gap-6 md:grid-cols-2">
        {fields.map((field, index) => (
          <div key={field.name} className={index === 2 ? "md:col-span-2" : ""}>
            <label htmlFor={`contact-${field.name}`} className="mb-2 block text-sm font-semibold">{field.label}</label>
            <input
              id={`contact-${field.name}`}
              name={field.name}
              type={field.type}
              autoComplete={field.autoComplete}
              required
              className="min-h-12 w-full rounded-lg border border-[var(--line)] bg-[var(--surface)] px-4 outline-none placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
              placeholder={field.placeholder}
            />
            <FieldError state={state} name={field.name} />
          </div>
        ))}
      </div>
      <div>
        <label htmlFor="contact-message" className="mb-2 block text-sm font-semibold">留言</label>
        <textarea
          id="contact-message"
          name="message"
          required
          rows={7}
          className="w-full resize-y rounded-lg border border-[var(--line)] bg-[var(--surface)] px-4 py-3 outline-none placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
          placeholder="写下背景、目标，以及你希望我如何回复。"
        />
        <FieldError state={state} name="message" />
      </div>
      <div className="sr-only" aria-hidden>
        <label htmlFor="contact-website">个人网站</label>
        <input id="contact-website" name="website" tabIndex={-1} autoComplete="off" />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="min-h-12 rounded-full bg-[var(--accent)] px-7 font-semibold text-[var(--accent-ink)] transition-transform active:scale-[.98] disabled:cursor-wait disabled:opacity-70"
      >
        {pending ? "正在发送" : "发送留言"}
      </button>
      {state.message ? (
        <p aria-live="polite" className={state.ok ? "text-[var(--success)]" : "text-[var(--danger)]"}>{state.message}</p>
      ) : null}
    </form>
  );
}

export function CommentForm({ postId, parentId }: { postId: string; parentId?: string }) {
  const [state, action, pending] = useActionState(
    async (_previous: ActionState, formData: FormData) => createComment(formData),
    initialState,
  );

  return (
    <form
      action={action}
      aria-label={parentId ? "提交回复" : "提交评论"}
      className="space-y-5 rounded-xl bg-[var(--surface-strong)] p-5 md:p-7"
      noValidate
    >
      <input type="hidden" name="postId" value={postId} />
      {parentId ? <input type="hidden" name="parentId" value={parentId} /> : null}
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor={`comment-name-${parentId ?? "root"}`} className="mb-2 block text-sm font-semibold">名字</label>
          <input
            id={`comment-name-${parentId ?? "root"}`}
            name="authorName"
            autoComplete="name"
            required
            className="min-h-12 w-full rounded-lg border border-[var(--line)] bg-[var(--canvas)] px-4 outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
          />
          <FieldError state={state} name="authorName" />
        </div>
        <div>
          <label htmlFor={`comment-email-${parentId ?? "root"}`} className="mb-2 block text-sm font-semibold">邮箱，不会公开</label>
          <input
            id={`comment-email-${parentId ?? "root"}`}
            name="email"
            type="email"
            autoComplete="email"
            required
            className="min-h-12 w-full rounded-lg border border-[var(--line)] bg-[var(--canvas)] px-4 outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
          />
          <FieldError state={state} name="email" />
        </div>
      </div>
      <div>
        <label htmlFor={`comment-content-${parentId ?? "root"}`} className="mb-2 block text-sm font-semibold">评论</label>
        <textarea
          id={`comment-content-${parentId ?? "root"}`}
          name="content"
          rows={parentId ? 3 : 5}
          required
          className="w-full resize-y rounded-lg border border-[var(--line)] bg-[var(--canvas)] px-4 py-3 outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
          placeholder="提出问题、补充思路，或者留下不同看法。"
        />
        <FieldError state={state} name="content" />
      </div>
      <div className="sr-only" aria-hidden>
        <label htmlFor={`comment-website-${parentId ?? "root"}`}>个人网站</label>
        <input id={`comment-website-${parentId ?? "root"}`} name="website" tabIndex={-1} autoComplete="off" />
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={pending}
          className="min-h-11 rounded-full bg-[var(--accent)] px-6 font-semibold text-[var(--accent-ink)] active:scale-[.98] disabled:cursor-wait disabled:opacity-70"
        >
          {pending ? "正在提交" : parentId ? "提交回复" : "提交评论"}
        </button>
        <p className="text-sm text-[var(--muted)]">首次评论会进入审核队列。</p>
      </div>
      {state.message ? (
        <p aria-live="polite" className={state.ok ? "text-[var(--success)]" : "text-[var(--danger)]"}>{state.message}</p>
      ) : null}
    </form>
  );
}
