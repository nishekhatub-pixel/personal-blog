import { ArrowLeft, ArrowRight, Eye, Timer } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPostBySlug, getPostNeighbors, getRelatedPosts } from "@/lib/data";
import { CommentThread } from "@/components/content/comment-thread";
import {
  formatDate,
  type PublicComment,
  type PublicPost,
  unwrapTags,
} from "@/components/content/content-types";
import { MarkdownArticle, extractHeadings } from "@/components/content/markdown-article";
import { MediaFrame } from "@/components/content/media-frame";
import { PostCard } from "@/components/content/post-card";
import { ReadingProgress, TableOfContents } from "@/components/content/reading-tools";
import { ShareButton } from "@/components/content/share-button";

type PageProps = { params: Promise<{ slug: string }> };
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const row = await getPostBySlug(slug);
  if (!row) return { title: "文章不存在" };
  const post = row as PublicPost;
  const description = post.seoDescription || post.excerpt;

  return {
    title: post.seoTitle || post.title,
    description,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: "article",
      title: post.seoTitle || post.title,
      description,
      publishedTime: post.publishedAt ? new Date(post.publishedAt).toISOString() : undefined,
      modifiedTime: post.updatedAt ? new Date(post.updatedAt).toISOString() : undefined,
      images: post.coverImage ? [{ url: post.coverImage, alt: post.coverAlt || post.title }] : undefined,
    },
  };
}

export default async function ArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const row = await getPostBySlug(slug);
  if (!row) notFound();
  const post = row as PublicPost & { category: { id?: string; name: string; slug: string } };
  const [neighbors, relatedRows] = await Promise.all([
    getPostNeighbors(slug),
    getRelatedPosts(post.id),
  ]);
  const related = relatedRows as PublicPost[];
  const headings = extractHeadings(post.content || "");
  const tags = unwrapTags(post.tags);
  const comments = (post.comments || []) as PublicComment[];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.publishedAt ? new Date(post.publishedAt).toISOString() : undefined,
    dateModified: post.updatedAt ? new Date(post.updatedAt).toISOString() : undefined,
    image: post.coverImage || undefined,
    author: { "@type": "Person", name: "R7" },
    inLanguage: "zh-CN",
  };

  return (
    <main id="main-content">
      <ReadingProgress />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />

      <article>
        <header className="px-[clamp(1rem,4vw,4rem)] pb-12 pt-[clamp(3rem,8vw,7rem)]">
          <div className="mx-auto max-w-[1280px]">
            <Link href="/blog" className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--muted)] hover:text-[var(--ink)]">
              <ArrowLeft aria-hidden size={17} /> 返回文章
            </Link>
            <div className="mt-10 grid gap-10 lg:grid-cols-12 lg:items-end">
              <div className="lg:col-span-9">
                <Link href={`/blog?category=${post.category.slug}`} className="text-sm font-semibold text-[var(--success)]">{post.category.name}</Link>
                <h1 className="mt-5 text-[clamp(3rem,7vw,6.7rem)] font-black leading-[.94] tracking-[-.065em]">{post.title}</h1>
                <p className="mt-7 max-w-3xl text-[clamp(1.05rem,1.5vw,1.25rem)] leading-8 text-[var(--muted)]">{post.excerpt}</p>
              </div>
              <div className="flex lg:col-span-3 lg:justify-end">
                <ShareButton title={post.title} />
              </div>
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-[var(--line)] pt-5 text-sm text-[var(--muted)]">
              <span className="font-semibold text-[var(--ink)]">R7</span>
              <time dateTime={post.publishedAt ? new Date(post.publishedAt).toISOString() : undefined}>{formatDate(post.publishedAt)}</time>
              <span className="inline-flex items-center gap-1.5"><Timer aria-hidden size={16} /> {post.readingMinutes} 分钟阅读</span>
              <span className="inline-flex items-center gap-1.5"><Eye aria-hidden size={16} /> {post.viewCount || 0} 次浏览</span>
            </div>

            <MediaFrame
              src={post.coverImage}
              alt={post.coverAlt}
              title={post.title}
              ratio="wide"
              priority
              className="mt-10"
            />
          </div>
        </header>

        <div className="mx-auto grid max-w-[1180px] gap-8 px-[clamp(1rem,4vw,4rem)] py-[clamp(3rem,8vw,7rem)] xl:grid-cols-[220px_minmax(0,760px)] xl:justify-center xl:gap-16">
          <TableOfContents headings={headings} />
          <MarkdownArticle markdown={post.content || ""} />
        </div>

        {tags.length ? (
          <div className="mx-auto flex max-w-[760px] flex-wrap gap-2 px-[clamp(1rem,4vw,4rem)] pb-16">
            {tags.map((tag) => (
              <Link key={tag.slug} href={`/blog?tag=${tag.slug}`} className="rounded-full border border-[var(--line)] px-4 py-2 text-sm font-semibold">
                #{tag.name}
              </Link>
            ))}
          </div>
        ) : null}
      </article>

      <nav className="border-y border-[var(--line)]" aria-label="相邻文章">
        <div className="mx-auto grid max-w-[1280px] md:grid-cols-2">
          {neighbors.previous ? (
            <Link href={`/blog/${neighbors.previous.slug}`} className="group p-7 md:border-r md:border-[var(--line)] md:p-10">
              <span className="inline-flex items-center gap-2 text-xs text-[var(--muted)]"><ArrowLeft aria-hidden size={16} /> 上一篇</span>
              <span className="mt-4 block text-2xl font-semibold tracking-[-.04em] group-hover:text-[var(--success)]">{neighbors.previous.title}</span>
            </Link>
          ) : <span className="hidden md:block" />}
          {neighbors.next ? (
            <Link href={`/blog/${neighbors.next.slug}`} className="group border-t border-[var(--line)] p-7 text-right md:border-t-0 md:p-10">
              <span className="inline-flex items-center gap-2 text-xs text-[var(--muted)]">下一篇 <ArrowRight aria-hidden size={16} /></span>
              <span className="mt-4 block text-2xl font-semibold tracking-[-.04em] group-hover:text-[var(--success)]">{neighbors.next.title}</span>
            </Link>
          ) : <span className="hidden md:block" />}
        </div>
      </nav>

      {related.length ? (
        <section className="px-[clamp(1rem,4vw,4rem)] py-[clamp(5rem,10vw,9rem)]" aria-labelledby="related-heading">
          <div className="mx-auto max-w-[1280px]">
            <h2 id="related-heading" className="text-4xl font-semibold tracking-[-.055em]">沿着这个问题继续</h2>
            <div className="mt-10 grid gap-x-6 gap-y-12 md:grid-cols-12">
              {related.slice(0, 3).map((item, index) => (
                <div key={item.id} className={index === 0 ? "md:col-span-7" : "md:col-span-5"}>
                  <PostCard post={item} featured={index === 0} />
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <CommentThread postId={post.id} comments={comments} />
    </main>
  );
}
