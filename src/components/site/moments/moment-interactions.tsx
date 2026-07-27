"use client";

import { Heart, MessageCircle, Send } from "lucide-react";
import { useState, type FormEvent } from "react";

export type PublicMomentComment = {
  id: string;
  authorName: string;
  content: string;
  createdAt: string;
  replies: Array<{
    id: string;
    authorName: string;
    content: string;
    createdAt: string;
  }>;
};

type FormStatus = {
  kind: "idle" | "pending" | "success" | "error";
  message: string;
  fieldErrors?: Record<string, string[]>;
};

const initialStatus: FormStatus = { kind: "idle", message: "" };

function formatDate(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Shanghai",
  }).format(new Date(value));
}

export function MomentInteractions({
  comments,
  commentsEnabled,
  initialCommentCount,
  initialReactionCount,
  momentId,
  reactionsEnabled,
}: {
  comments: PublicMomentComment[];
  commentsEnabled: boolean;
  initialCommentCount: number;
  initialReactionCount: number;
  momentId: string;
  reactionsEnabled: boolean;
}) {
  const [reactionCount, setReactionCount] = useState(initialReactionCount);
  const [reacted, setReacted] = useState(false);
  const [reactionPending, setReactionPending] = useState(false);
  const [reactionMessage, setReactionMessage] = useState("");
  const [status, setStatus] = useState<FormStatus>(initialStatus);

  const toggleReaction = async () => {
    setReactionPending(true);
    setReactionMessage("");
    try {
      const response = await fetch(`/api/moments/${momentId}/reaction`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company: "" }),
      });
      const result = (await response.json()) as {
        ok?: boolean;
        message?: string;
        count?: number;
        reacted?: boolean;
      };
      if (!response.ok || typeof result.count !== "number") {
        setReactionMessage(result.message || "操作失败，请稍后重试。");
        return;
      }
      setReactionCount(result.count);
      setReacted(Boolean(result.reacted));
      setReactionMessage(result.reacted ? "已记下这份喜欢。" : "已取消喜欢。");
    } catch {
      setReactionMessage("网络暂时不可用，请稍后重试。");
    } finally {
      setReactionPending(false);
    }
  };

  const submitComment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    setStatus({ kind: "pending", message: "正在提交评论。" });

    try {
      const response = await fetch(`/api/moments/${momentId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authorName: formData.get("authorName"),
          email: formData.get("email"),
          content: formData.get("content"),
          website: formData.get("website"),
        }),
      });
      const result = (await response.json()) as {
        ok?: boolean;
        message?: string;
        fieldErrors?: Record<string, string[]>;
      };
      if (!response.ok) {
        setStatus({
          kind: "error",
          message: result.message || "评论提交失败，请稍后重试。",
          fieldErrors: result.fieldErrors,
        });
        return;
      }

      form.reset();
      setStatus({
        kind: "success",
        message: result.message || "评论已提交，审核通过后会显示。",
      });
    } catch {
      setStatus({ kind: "error", message: "网络暂时不可用，请稍后重试。" });
    }
  };

  const fieldError = (name: string) => status.fieldErrors?.[name]?.[0];

  return (
    <div className="mt-6 border-t border-[var(--line)] pt-4">
      <div className="flex flex-wrap items-center gap-3">
        {reactionsEnabled ? (
          <button
            type="button"
            aria-label={reacted ? "取消喜欢这条说说" : "喜欢这条说说"}
            aria-pressed={reacted}
            disabled={reactionPending}
            onClick={() => void toggleReaction()}
            className={[
              "inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition-colors disabled:cursor-wait disabled:opacity-65",
              reacted
                ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]"
                : "border-[var(--line)] text-[var(--muted)] hover:border-[var(--line-strong)] hover:text-[var(--ink)]",
            ].join(" ")}
          >
            <Heart
              aria-hidden
              fill={reacted ? "currentColor" : "none"}
              size={17}
            />
            喜欢 {reactionCount}
          </button>
        ) : (
          <span className="inline-flex min-h-11 items-center gap-2 text-sm text-[var(--muted)]">
            <Heart aria-hidden size={17} />
            {reactionCount} 份喜欢
          </span>
        )}

        <span className="inline-flex min-h-11 items-center gap-2 text-sm text-[var(--muted)]">
          <MessageCircle aria-hidden size={17} />
          {initialCommentCount} 条公开评论
        </span>
      </div>

      {reactionMessage ? (
        <p aria-live="polite" className="mt-2 text-xs text-[var(--muted)]">
          {reactionMessage}
        </p>
      ) : null}

      <details className="group mt-3">
        <summary className="inline-flex min-h-11 cursor-pointer list-none items-center text-sm font-semibold text-[var(--accent)] [&::-webkit-details-marker]:hidden">
          阅读评论与回应
        </summary>

        <div className="mt-3 space-y-5 rounded-[var(--radius-control,.625rem)] bg-[var(--surface-strong)] p-4 md:p-5">
          {comments.length ? (
            <ol className="space-y-5" aria-label="已公开评论">
              {comments.map((comment) => (
                <li key={comment.id}>
                  <article>
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <h4 className="font-semibold">{comment.authorName}</h4>
                      <time
                        dateTime={comment.createdAt}
                        className="text-xs text-[var(--muted)]"
                      >
                        {formatDate(comment.createdAt)}
                      </time>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-7">
                      {comment.content}
                    </p>

                    {comment.replies.length ? (
                      <ol className="mt-3 space-y-3 border-l-2 border-[var(--line-strong)] pl-4">
                        {comment.replies.map((reply) => (
                          <li key={reply.id}>
                            <article>
                              <div className="flex flex-wrap items-baseline justify-between gap-2">
                                <h5 className="text-sm font-semibold">
                                  {reply.authorName}
                                </h5>
                                <time
                                  dateTime={reply.createdAt}
                                  className="text-xs text-[var(--muted)]"
                                >
                                  {formatDate(reply.createdAt)}
                                </time>
                              </div>
                              <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-7 text-[var(--muted)]">
                                {reply.content}
                              </p>
                            </article>
                          </li>
                        ))}
                      </ol>
                    ) : null}
                  </article>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-sm leading-7 text-[var(--muted)]">
              还没有通过审核的评论。
            </p>
          )}

          {commentsEnabled ? (
            <form
              aria-label="提交说说评论"
              className="border-t border-[var(--line)] pt-5"
              noValidate
              onSubmit={submitComment}
            >
              <h4 className="font-semibold">留下一句回应</h4>
              <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                只接受纯文本。评论会先进入审核队列，邮箱不会公开。
              </p>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor={`moment-${momentId}-name`}
                    className="mb-2 block text-sm font-semibold"
                  >
                    昵称
                  </label>
                  <input
                    id={`moment-${momentId}-name`}
                    name="authorName"
                    autoComplete="nickname"
                    required
                    maxLength={100}
                    aria-invalid={Boolean(fieldError("authorName"))}
                    aria-describedby={
                      fieldError("authorName")
                        ? `moment-${momentId}-name-error`
                        : undefined
                    }
                    className="min-h-12 w-full rounded-[var(--radius-control,.625rem)] border border-[var(--line-strong)] bg-[var(--canvas)] px-4"
                  />
                  {fieldError("authorName") ? (
                    <p
                      id={`moment-${momentId}-name-error`}
                      className="mt-2 text-sm text-[var(--danger)]"
                    >
                      {fieldError("authorName")}
                    </p>
                  ) : null}
                </div>

                <div>
                  <label
                    htmlFor={`moment-${momentId}-email`}
                    className="mb-2 block text-sm font-semibold"
                  >
                    邮箱
                  </label>
                  <input
                    id={`moment-${momentId}-email`}
                    name="email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    required
                    maxLength={191}
                    aria-invalid={Boolean(fieldError("email"))}
                    aria-describedby={
                      fieldError("email")
                        ? `moment-${momentId}-email-error`
                        : undefined
                    }
                    className="min-h-12 w-full rounded-[var(--radius-control,.625rem)] border border-[var(--line-strong)] bg-[var(--canvas)] px-4"
                  />
                  {fieldError("email") ? (
                    <p
                      id={`moment-${momentId}-email-error`}
                      className="mt-2 text-sm text-[var(--danger)]"
                    >
                      {fieldError("email")}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="mt-4">
                <label
                  htmlFor={`moment-${momentId}-content`}
                  className="mb-2 block text-sm font-semibold"
                >
                  评论
                </label>
                <textarea
                  id={`moment-${momentId}-content`}
                  name="content"
                  rows={4}
                  required
                  maxLength={3000}
                  aria-invalid={Boolean(fieldError("content"))}
                  aria-describedby={
                    fieldError("content")
                      ? `moment-${momentId}-content-error`
                      : undefined
                  }
                  className="w-full resize-y rounded-[var(--radius-control,.625rem)] border border-[var(--line-strong)] bg-[var(--canvas)] px-4 py-3"
                />
                {fieldError("content") ? (
                  <p
                    id={`moment-${momentId}-content-error`}
                    className="mt-2 text-sm text-[var(--danger)]"
                  >
                    {fieldError("content")}
                  </p>
                ) : null}
              </div>

              <div className="sr-only" aria-hidden>
                <label htmlFor={`moment-${momentId}-website`}>个人网站</label>
                <input
                  id={`moment-${momentId}-website`}
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                />
              </div>

              <button
                type="submit"
                disabled={status.kind === "pending"}
                className="mt-4 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-6 font-semibold text-[var(--accent-ink)] transition-transform active:scale-[.985] disabled:cursor-wait disabled:opacity-65"
              >
                <Send aria-hidden size={17} />
                {status.kind === "pending" ? "正在提交" : "提交审核"}
              </button>

              {status.message ? (
                <p
                  aria-live="polite"
                  className={[
                    "mt-3 text-sm",
                    status.kind === "error"
                      ? "text-[var(--danger)]"
                      : status.kind === "success"
                        ? "text-[var(--success)]"
                        : "text-[var(--muted)]",
                  ].join(" ")}
                >
                  {status.message}
                </p>
              ) : null}
            </form>
          ) : (
            <p className="border-t border-[var(--line)] pt-4 text-sm leading-7 text-[var(--muted)]">
              评论提交目前关闭，已经公开的内容仍可阅读。
            </p>
          )}
        </div>
      </details>
    </div>
  );
}
