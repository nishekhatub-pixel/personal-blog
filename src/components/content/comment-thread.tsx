import { MessageCircle } from "lucide-react";
import { CommentForm } from "@/components/site/public-forms";
import { formatDate, type PublicComment } from "./content-types";

function CommentItem({ comment, postId, allowReply = true }: { comment: PublicComment; postId: string; allowReply?: boolean }) {
  return (
    <li>
      <article className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-5 md:p-6">
        <header className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-semibold">{comment.authorName}</p>
          <time className="text-xs text-[var(--muted)]" dateTime={new Date(comment.createdAt).toISOString()}>
            {formatDate(comment.createdAt)}
          </time>
        </header>
        <p className="mt-4 whitespace-pre-wrap leading-7 text-[var(--muted)]">{comment.content}</p>
        {allowReply ? (
          <details className="mt-5">
            <summary className="cursor-pointer text-sm font-semibold text-[var(--success)]">回复这条评论</summary>
            <div className="mt-4">
              <CommentForm postId={postId} parentId={comment.id} />
            </div>
          </details>
        ) : null}
      </article>
      {comment.replies?.length ? (
        <ol className="mt-3 space-y-3 border-l-2 border-[var(--accent-soft)] pl-4 md:ml-8">
          {comment.replies.map((reply) => <CommentItem key={reply.id} comment={reply} postId={postId} allowReply={false} />)}
        </ol>
      ) : null}
    </li>
  );
}

export function CommentThread({ postId, comments }: { postId: string; comments: PublicComment[] }) {
  const roots = comments.filter((comment) => !comment.parentId);

  return (
    <section id="comments" className="mx-auto max-w-4xl px-[clamp(1rem,4vw,4rem)] py-[clamp(5rem,10vw,9rem)]" aria-labelledby="comments-heading">
      <div className="mb-10 flex items-end justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 text-sm text-[var(--muted)]">
            <MessageCircle aria-hidden size={17} /> 公开讨论
          </p>
          <h2 id="comments-heading" className="mt-3 text-4xl font-semibold tracking-[-.055em]">评论</h2>
        </div>
        <p className="font-mono text-sm text-[var(--muted)]">{roots.length} 条</p>
      </div>
      {roots.length ? (
        <ol className="space-y-5">
          {roots.map((comment) => <CommentItem key={comment.id} comment={comment} postId={postId} />)}
        </ol>
      ) : (
        <div className="rounded-xl border border-dashed border-[var(--line)] p-8 text-center text-[var(--muted)]">
          这里还很安静。欢迎留下第一个认真问题。
        </div>
      )}
      <div className="mt-10">
        <h3 className="mb-5 text-2xl font-semibold tracking-[-.04em]">加入讨论</h3>
        <CommentForm postId={postId} />
      </div>
    </section>
  );
}
