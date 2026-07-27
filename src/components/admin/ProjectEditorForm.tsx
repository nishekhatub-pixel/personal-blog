import {
  createProject,
  updateProject,
} from "@/actions/admin";
import { SubmitButton } from "@/components/admin/AdminControls";
import { MarkdownEditor } from "@/components/admin/MarkdownEditor";

type ProjectRecord = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  body: string;
  coverImage: string | null;
  coverAlt: string | null;
  galleryJson: string;
  technologyJson: string;
  demoUrl: string | null;
  sourceUrl: string | null;
  status: string;
  featured: boolean;
  seoTitle: string | null;
  seoDescription: string | null;
  tags: { tagId: string }[];
};

function toLines(raw: string) {
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.join("\n") : "";
  } catch {
    return "";
  }
}

export function ProjectEditorForm({
  project,
  tags,
}: {
  project?: ProjectRecord;
  tags: { id: string; name: string }[];
}) {
  const selectedTags = new Set(project?.tags.map((entry) => entry.tagId) ?? []);

  return (
    <form action={project ? updateProject : createProject} className="grid gap-8">
      {project ? <input name="id" type="hidden" value={project.id} /> : null}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <div className="grid gap-5">
          <label className="grid gap-2 text-sm">
            <span>项目名称</span>
            <input
              className="min-h-13 border-b border-[var(--line)] bg-transparent text-2xl font-semibold tracking-[-0.03em] outline-none focus:border-[var(--accent)]"
              defaultValue={project?.title}
              maxLength={100}
              name="title"
              required
            />
          </label>
          <label className="grid gap-2 text-sm">
            <span>Slug</span>
            <input
              className="min-h-11 border border-[var(--line)] bg-transparent px-3 font-mono outline-none focus:border-[var(--accent)]"
              defaultValue={project?.slug}
              name="slug"
              pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
              required
            />
          </label>
          <label className="grid gap-2 text-sm">
            <span>一句话摘要</span>
            <textarea
              className="min-h-28 border border-[var(--line)] bg-transparent p-3 leading-6 outline-none focus:border-[var(--accent)]"
              defaultValue={project?.summary}
              maxLength={260}
              name="summary"
              required
            />
          </label>
        </div>
        <aside className="grid content-start gap-5 border-t border-[var(--line)] pt-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
          <label className="grid gap-2 text-sm">
            <span>状态</span>
            <select
              className="min-h-11 border border-[var(--line)] bg-[var(--canvas)] px-3"
              defaultValue={project?.status ?? "DRAFT"}
              name="status"
            >
              <option value="DRAFT">草稿</option>
              <option value="PUBLISHED">发布</option>
              <option value="ARCHIVED">归档</option>
            </select>
          </label>
          <fieldset>
            <legend className="mb-2 text-sm">标签</legend>
            <div className="grid max-h-40 gap-1 overflow-y-auto border border-[var(--line)] p-2">
              {tags.map((tag) => (
                <label className="flex min-h-9 items-center gap-3 px-2 text-sm" key={tag.id}>
                  <input
                    className="size-4 accent-[var(--accent)]"
                    defaultChecked={selectedTags.has(tag.id)}
                    name="tagIds"
                    type="checkbox"
                    value={tag.id}
                  />
                  {tag.name}
                </label>
              ))}
            </div>
          </fieldset>
          <label className="flex min-h-11 items-center gap-3 text-sm">
            <input
              className="size-4 accent-[var(--accent)]"
              defaultChecked={project?.featured}
              name="featured"
              type="checkbox"
              value="true"
            />
            首页推荐
          </label>
        </aside>
      </div>

      <MarkdownEditor
        defaultValue={project?.body}
        label="案例正文"
        name="body"
      />

      <section className="grid gap-5 border-t border-[var(--line)] pt-7 md:grid-cols-2">
        <label className="grid gap-2 text-sm">
          <span>技术栈（每行一项）</span>
          <textarea
            className="min-h-36 border border-[var(--line)] bg-transparent p-3 font-mono text-sm leading-6 outline-none focus:border-[var(--accent)]"
            defaultValue={project ? toLines(project.technologyJson) : ""}
            name="technology"
            placeholder={"Next.js\nTypeScript\nPrisma"}
          />
        </label>
        <label className="grid gap-2 text-sm">
          <span>画廊图片地址（每行一项）</span>
          <textarea
            className="min-h-36 border border-[var(--line)] bg-transparent p-3 font-mono text-sm leading-6 outline-none focus:border-[var(--accent)]"
            defaultValue={project ? toLines(project.galleryJson) : ""}
            name="gallery"
            placeholder={"/uploads/project-01.webp\n/uploads/project-02.webp"}
          />
        </label>
        <label className="grid gap-2 text-sm">
          <span>封面地址</span>
          <input
            className="min-h-11 border border-[var(--line)] bg-transparent px-3 outline-none focus:border-[var(--accent)]"
            defaultValue={project?.coverImage ?? ""}
            name="coverImage"
          />
        </label>
        <label className="grid gap-2 text-sm">
          <span>封面替代文本</span>
          <input
            className="min-h-11 border border-[var(--line)] bg-transparent px-3 outline-none focus:border-[var(--accent)]"
            defaultValue={project?.coverAlt ?? ""}
            name="coverAlt"
          />
        </label>
        <label className="grid gap-2 text-sm">
          <span>在线演示</span>
          <input
            className="min-h-11 border border-[var(--line)] bg-transparent px-3 outline-none focus:border-[var(--accent)]"
            defaultValue={project?.demoUrl ?? ""}
            name="demoUrl"
            placeholder="https://"
            type="url"
          />
        </label>
        <label className="grid gap-2 text-sm">
          <span>源代码</span>
          <input
            className="min-h-11 border border-[var(--line)] bg-transparent px-3 outline-none focus:border-[var(--accent)]"
            defaultValue={project?.sourceUrl ?? ""}
            name="sourceUrl"
            placeholder="https://github.com/"
            type="url"
          />
        </label>
      </section>

      <details className="border-y border-[var(--line)] py-5">
        <summary className="cursor-pointer text-sm font-medium">搜索引擎信息</summary>
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <label className="grid gap-2 text-sm">
            <span>SEO 标题</span>
            <input
              className="min-h-11 border border-[var(--line)] bg-transparent px-3"
              defaultValue={project?.seoTitle ?? ""}
              name="seoTitle"
            />
          </label>
          <label className="grid gap-2 text-sm">
            <span>SEO 描述</span>
            <textarea
              className="min-h-24 border border-[var(--line)] bg-transparent p-3"
              defaultValue={project?.seoDescription ?? ""}
              name="seoDescription"
            />
          </label>
        </div>
      </details>

      <div className="sticky bottom-20 z-20 flex justify-end border border-[var(--line)] bg-[color-mix(in_srgb,var(--canvas)_94%,transparent)] p-4 backdrop-blur-md lg:bottom-4">
        <SubmitButton pendingLabel="正在保存项目…">
          {project ? "保存修改" : "创建项目"}
        </SubmitButton>
      </div>
    </form>
  );
}
