import Image from "next/image";
import { Children, isValidElement, type ReactNode } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import { CodeBlock } from "./code-block";
import type { TocHeading } from "./reading-tools";

function slugHeading(text: string) {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}\s-]/gu, "")
    .replace(/\s+/g, "-");
}

function flattenText(node: ReactNode): string {
  return Children.toArray(node)
    .map((child) => {
      if (typeof child === "string" || typeof child === "number") return String(child);
      if (isValidElement<{ children?: ReactNode }>(child)) return flattenText(child.props.children);
      return "";
    })
    .join("");
}

export function extractHeadings(markdown: string): TocHeading[] {
  return markdown
    .split("\n")
    .flatMap((line) => {
      const match = /^(##|###)\s+(.+)$/.exec(line.trim());
      if (!match) return [];
      const text = match[2].replace(/[*_`[\]]/g, "").trim();
      return [{ id: slugHeading(text), text, level: match[1].length as 2 | 3 }];
    });
}

const components: Components = {
  h2: ({ children, ...props }) => {
    const text = flattenText(children);
    return <h2 id={slugHeading(text)} {...props}>{children}</h2>;
  },
  h3: ({ children, ...props }) => {
    const text = flattenText(children);
    return <h3 id={slugHeading(text)} {...props}>{children}</h3>;
  },
  a: ({ href, children, ...props }) => {
    const external = href?.startsWith("http");
    return (
      <a href={href} target={external ? "_blank" : undefined} rel={external ? "noreferrer" : undefined} {...props}>
        {children}
      </a>
    );
  },
  img: ({ src, alt }) =>
    typeof src === "string" ? (
      <figure>
        <Image
          src={src}
          alt={alt || ""}
          width={1440}
          height={900}
          sizes="(max-width: 900px) 100vw, 760px"
          className="h-auto w-full rounded-xl object-contain"
        />
        {alt ? <figcaption>{alt}</figcaption> : null}
      </figure>
    ) : null,
  pre: ({ children }) => {
    const child = Children.only(children);
    if (isValidElement<{ className?: string; children?: ReactNode }>(child)) {
      const language = child.props.className?.match(/language-([\w-]+)/)?.[1];
      return (
        <CodeBlock code={flattenText(child.props.children).replace(/\n$/, "")} language={language}>
          {child}
        </CodeBlock>
      );
    }
    return <pre>{children}</pre>;
  },
  table: ({ children, ...props }) => (
    <div className="my-8 max-w-full overflow-x-auto">
      <table {...props}>{children}</table>
    </div>
  ),
};

export function MarkdownArticle({ markdown }: { markdown: string }) {
  return (
    <div className="prose min-w-0 max-w-[760px]">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize, rehypeHighlight]}
        components={components}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
