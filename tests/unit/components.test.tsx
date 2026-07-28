import type { AnchorHTMLAttributes, ReactNode } from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const navigationMocks = vi.hoisted(() => ({
  pathname: "/blog" as string,
  refresh: vi.fn(),
}));
const themeMocks = vi.hoisted(() => ({
  resolvedTheme: "light" as string,
  setTheme: vi.fn(),
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
    children: ReactNode;
    href: string | { pathname?: string };
  }) => (
    <a
      href={typeof href === "string" ? href : (href.pathname ?? "")}
      {...props}
    >
      {children}
    </a>
  ),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => navigationMocks.pathname,
  useRouter: () => ({ refresh: navigationMocks.refresh }),
}));

vi.mock("next-themes", () => ({
  useTheme: () => ({
    resolvedTheme: themeMocks.resolvedTheme,
    setTheme: themeMocks.setTheme,
  }),
}));

vi.mock("@/lib/actions/public", () => ({
  contact: vi.fn(),
  createComment: vi.fn(),
  subscribe: vi.fn(),
}));

import { MarkdownEditor } from "@/components/admin/MarkdownEditor";
import { MediaUploader } from "@/components/admin/MediaUploader";
import { CommentThread } from "@/components/content/comment-thread";
import { Pagination } from "@/components/content/pagination";
import { AtmosphereProvider } from "@/components/site/atmosphere/atmosphere-provider";
import { SiteHeader } from "@/components/site/site-header";
import { ThemeToggle } from "@/components/site/theme-toggle";

describe("Pagination", () => {
  it("keeps search filters and marks the current page", () => {
    render(
      <Pagination
        page={3}
        totalPages={8}
        searchParams={{ category: "backend", q: "mysql" }}
      />,
    );

    expect(screen.getByRole("navigation", { name: "分页" })).toBeInTheDocument();
    expect(screen.getByRole("link", { current: "page" })).toHaveTextContent("3");
    expect(screen.getByRole("link", { name: /上一页/ })).toHaveAttribute(
      "href",
      "?category=backend&q=mysql&page=2",
    );
    expect(screen.getByRole("link", { name: /下一页/ })).toHaveAttribute(
      "href",
      "?category=backend&q=mysql&page=4",
    );
    expect(screen.getAllByText("…")).toHaveLength(1);
  });

  it("does not render pagination for a single page", () => {
    const { container } = render(<Pagination page={1} totalPages={1} />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe("theme and navigation controls", () => {
  beforeEach(() => {
    themeMocks.resolvedTheme = "light";
    themeMocks.setTheme.mockReset();
    navigationMocks.pathname = "/blog";
  });

  it("switches from the resolved light theme to dark", () => {
    render(<ThemeToggle />);

    fireEvent.click(
      screen.getByRole("button", { name: "切换到深色主题" }),
    );

    expect(themeMocks.setTheme).toHaveBeenCalledWith("dark");
  });

  it("marks the active navigation link and supports an Escape-close menu", () => {
    render(
      <AtmosphereProvider adminEnabled density="medium">
        <SiteHeader />
      </AtmosphereProvider>,
    );

    const articleLinks = screen.getAllByRole("link", { name: "文章" });
    expect(articleLinks[0]).toHaveAttribute("aria-current", "page");

    const primaryNavigation = screen.getByRole("navigation", {
      name: "主导航",
    });
    expect(within(primaryNavigation).getAllByRole("link")).toHaveLength(10);
    expect(
      within(primaryNavigation).getByRole("link", { name: "照片墙" }),
    ).toHaveAttribute("href", "/photos");
    expect(
      within(primaryNavigation).getByRole("link", { name: "留言墙" }),
    ).toHaveAttribute("href", "/guestbook");

    const trigger = screen.getByRole("button", { name: "打开导航" });
    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(
      screen.getByRole("navigation", { name: "移动端导航" }),
    ).toBeInTheDocument();

    fireEvent.keyDown(window, { key: "Escape" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(document.body.style.overflow).toBe("");
  });
});

describe("editor and media controls", () => {
  beforeEach(() => {
    navigationMocks.refresh.mockReset();
  });

  it("shows an immediate client-side error for unsupported media", () => {
    const { container } = render(<MediaUploader />);
    const input = container.querySelector('input[type="file"]');
    expect(input).not.toBeNull();

    fireEvent.change(input!, {
      target: {
        files: [
          new File(["plain text"], "payload.txt", { type: "text/plain" }),
        ],
      },
    });

    expect(
      screen.getByText(
        "支持 JPEG、PNG、WebP、AVIF、GIF、TIFF、HEIC 和 HEIF 图片。",
      ),
    ).toHaveAttribute("class", expect.stringContaining("danger"));
    expect(navigationMocks.refresh).not.toHaveBeenCalled();
  });

  it("marks edited Markdown as dirty and never injects raw script nodes", () => {
    const { container } = render(<MarkdownEditor />);
    const editor = screen.getByLabelText("正文");

    fireEvent.change(editor, {
      target: {
        value:
          "## 安全预览\n\n<script>window.compromised = true</script>\n\n这是预览正文。",
      },
    });
    fireEvent.click(screen.getByRole("button", { name: "预览" }));

    expect(screen.getByText("尚未保存")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "安全预览" }),
    ).toBeInTheDocument();
    expect(container.querySelector("script")).toBeNull();
  });
});

describe("comment thread", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders root comments, nested replies and the moderation notice", () => {
    render(
      <CommentThread
        postId="post-id"
        comments={[
          {
            id: "comment-one",
            authorName: "读者甲",
            content: "这条解释很清楚。",
            createdAt: "2026-07-27T08:00:00.000Z",
            parentId: null,
            replies: [
              {
                id: "reply",
                authorName: "R7",
                content: "谢谢你的认真阅读。",
                createdAt: "2026-07-27T09:00:00.000Z",
                parentId: "comment-one",
              },
            ],
          },
        ]}
      />,
    );

    const comments = screen.getByRole("region", { name: "评论" });
    expect(within(comments).getByText("读者甲")).toBeInTheDocument();
    expect(within(comments).getByText("R7")).toBeInTheDocument();
    expect(within(comments).getByText("1 条")).toBeInTheDocument();
    expect(
      within(comments).getAllByText("首次评论会进入审核队列。"),
    ).toHaveLength(2);
  });
});
