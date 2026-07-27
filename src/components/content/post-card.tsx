import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { formatDate, type PublicPost } from "./content-types";
import { MediaFrame } from "./media-frame";

export function PostCard({
  post,
  featured = false,
  priority = false,
}: {
  post: PublicPost;
  featured?: boolean;
  priority?: boolean;
}) {
  return (
    <article className="group">
      <Link href={`/blog/${post.slug}`} className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-4">
        <MediaFrame
          src={post.coverImage}
          alt={post.coverAlt}
          title={post.title}
          priority={priority}
          ratio={featured ? "wide" : "landscape"}
        />
        <div className="mt-5">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--muted)]">
            <time dateTime={post.publishedAt ? new Date(post.publishedAt).toISOString() : undefined}>{formatDate(post.publishedAt)}</time>
            <span aria-hidden>·</span>
            <span>{post.readingMinutes} 分钟阅读</span>
            <span aria-hidden>·</span>
            <span>{post.category.name}</span>
          </div>
          <h2 className={`${featured ? "text-3xl md:text-5xl" : "text-2xl"} mt-3 font-semibold leading-[1.08] tracking-[-.045em]`}>
            <span className="group-hover:text-[var(--success)]">{post.title}</span>
            <ArrowUpRight className="ml-2 inline-block align-baseline opacity-0 transition-opacity group-hover:opacity-100" aria-hidden size={20} strokeWidth={1.7} />
          </h2>
          <p className="mt-3 max-w-[65ch] text-sm leading-7 text-[var(--muted)]">{post.excerpt}</p>
        </div>
      </Link>
    </article>
  );
}

