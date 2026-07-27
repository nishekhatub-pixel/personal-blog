import {
  createPost,
  updatePost,
} from "@/actions/admin";
import { MarkdownEditor } from "@/components/admin/MarkdownEditor";
import { SubmitButton } from "@/components/admin/AdminControls";

type TaxonomyOption = {
  id: string;
  name: string;
};

type EditablePost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string | null;
  coverAlt: string | null;
  status: string;
  featured: boolean;
  readingMinutes: number;
  categoryId: string;
  seoTitle: string | null;
  seoDescription: string | null;
  tags: { tagId: string }[];
};

export function PostEditorForm({
  categories,
  post,
  tags,
}: {
  categories: TaxonomyOption[];
  post?: EditablePost;
  tags: TaxonomyOption[];
}) {
  const selectedTags = new Set(post?.tags.map((entry) => entry.tagId) ?? []);

  return (
    <form action={post ? updatePost : createPost} className="grid gap-8">
      {post ? <input name="id" type="hidden" value={post.id} /> : null}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <div className="grid gap-5">
          <label className="grid gap-2 text-sm">
            <span>标题</span>
            <input
              className="min-h-13 border-b border-[var(--line)] bg-transparent px-0 text-2xl font-semibold tracking-[-0.03em] outline-none transition-colors placeholder:text-[var(--muted)] focus:border-[var(--accent)]"
              defaultValue={post?.title}
              maxLength={120}
              name="title"
              placeholder="这篇文章要留下什么？"
              required
            />
          </label>
          <label className="grid gap-2 text-sm">
            <span>Slug</span>
            <input
              className="min-h-11 border border-[var(--line)] bg-transparent px-3 font-mono text-sm outline-none focus:border-[var(--accent)]"
              defaultValue={post?.slug}
              name="slug"
              pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
              placeholder="my-article-slug"
              required
            />
            <span className="text-xs text-[var(--muted)]">
              使用小写字母、数字和连字符，发布后尽量不要更改。
            </span>
          </label>
          <label className="grid gap-2 text-sm">
            <span>摘要</span>
            <textarea
              className="min-h-28 resize-y border border-[var(--line)] bg-transparent p-3 leading-6 outline-none focus:border-[var(--accent)]"
              defaultValue={post?.excerpt}
              maxLength={240}
              name="excerpt"
              required
            />
          </label>
        </div>

        <aside className="grid content-start gap-5 border-t border-[var(--line)] pt-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
          <label className="grid gap-2 text-sm">
            <span>状态</span>
            <select
              className="min-h-11 border border-[var(--line)] bg-[var(--canvas)] px-3 outline-none focus:border-[var(--accent)]"
              defaultValue={post?.status ?? "DRAFT"}
              name="status"
            >
              <option value="DRAFT">草稿</option>
              <option value="PUBLISHED">发布</option>
              <option value="ARCHIVED">归档</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm">
            <span>分类</span>
            <select
              className="min-h-11 border border-[var(--line)] bg-[var(--canvas)] px-3 outline-none focus:border-[var(--accent)]"
              defaultValue={post?.categoryId}
              name="categoryId"
              required
            >
              <option disabled value="">
                选择分类
              </option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
          <fieldset className="grid gap-2">
            <legend className="mb-2 text-sm">标签</legend>
            <div className="grid max-h-40 gap-1 overflow-y-auto border border-[var(--line)] p-2">
              {tags.length ? (
                tags.map((tag) => (
                  <label
                    className="flex min-h-9 items-center gap-3 px-2 text-sm hover:bg-[color-mix(in_srgb,var(--ink)_4%,transparent)]"
                    key={tag.id}
                  >
                    <input
                      className="size-4 accent-[var(--accent)]"
                      defaultChecked={selectedTags.has(tag.id)}
                      name="tagIds"
                      type="checkbox"
                      value={tag.id}
                    />
                    {tag.name}
                  </label>
                ))
              ) : (
                <p className="p-2 text-xs text-[var(--muted)]">
                  先在标签页创建标签。
                </p>
              )}
            </div>
          </fieldset>
          <label className="flex min-h-11 items-center gap-3 text-sm">
            <input
              className="size-4 accent-[var(--accent)]"
              defaultChecked={post?.featured}
              name="featured"
              type="checkbox"
              value="true"
            />
            在首页推荐
          </label>
          <label className="grid gap-2 text-sm">
            <span>预计阅读时长（分钟）</span>
            <input
              className="min-h-11 border border-[var(--line)] bg-transparent px-3 font-mono outline-none focus:border-[var(--accent)]"
              defaultValue={post?.readingMinutes ?? 5}
              max={120}
              min={1}
              name="readingMinutes"
              required
              type="number"
            />
          </label>
        </aside>
      </div>

      <MarkdownEditor defaultValue={post?.content} />

      <section className="grid gap-5 border-t border-[var(--line)] pt-7 md:grid-cols-2">
        <label className="grid gap-2 text-sm">
          <span>封面地址</span>
          <input
            className="min-h-11 border border-[var(--line)] bg-transparent px-3 outline-none focus:border-[var(--accent)]"
            defaultValue={post?.coverImage ?? ""}
            name="coverImage"
            placeholder="/uploads/..."
            type="text"
          />
        </label>
        <label className="grid gap-2 text-sm">
          <span>封面替代文本</span>
          <input
            className="min-h-11 border border-[var(--line)] bg-transparent px-3 outline-none focus:border-[var(--accent)]"
            defaultValue={post?.coverAlt ?? ""}
            name="coverAlt"
            placeholder="描述画面，而非重复标题"
          />
        </label>
      </section>

      <details className="border-y border-[var(--line)] py-5">
        <summary className="cursor-pointer text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]">
          搜索引擎信息
        </summary>
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <label className="grid gap-2 text-sm">
            <span>SEO 标题</span>
            <input
              className="min-h-11 border border-[var(--line)] bg-transparent px-3 outline-none focus:border-[var(--accent)]"
              defaultValue={post?.seoTitle ?? ""}
              maxLength={70}
              name="seoTitle"
            />
          </label>
          <label className="grid gap-2 text-sm">
            <span>SEO 描述</span>
            <textarea
              className="min-h-24 border border-[var(--line)] bg-transparent p-3 outline-none focus:border-[var(--accent)]"
              defaultValue={post?.seoDescription ?? ""}
              maxLength={180}
              name="seoDescription"
            />
          </label>
        </div>
      </details>

      <div className="sticky bottom-20 z-20 flex flex-wrap items-center justify-between gap-4 border border-[var(--line)] bg-[color-mix(in_srgb,var(--canvas)_94%,transparent)] p-4 backdrop-blur-md lg:bottom-4">
        <p className="text-xs leading-5 text-[var(--muted)]">
          保存前请检查封面替代文本、摘要与文章状态。
        </p>
        <SubmitButton pendingLabel="正在保存文章…">
          {post ? "保存修改" : "创建文章"}
        </SubmitButton>
      </div>
    </form>
  );
}
