import { db } from "@/lib/db";
import { env } from "@/lib/env";

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export async function GET() {
  const posts = await db.post.findMany({
    where: { status: "PUBLISHED", publishedAt: { lte: new Date() } },
    include: { category: true },
    orderBy: { publishedAt: "desc" },
    take: 30,
  });
  const settings = await db.siteSetting.findMany({
    where: { key: { in: ["site.title", "site.description"] } },
  });
  const mapped = Object.fromEntries(settings.map((setting) => [setting.key, setting.value]));
  const title = mapped["site.title"] ?? "R7 的数字花园";
  const description = mapped["site.description"] ?? "软件技术学生的学习记录、工程实践与作品。";

  const items = posts
    .map((post) => {
      const link = new URL(`/blog/${post.slug}`, env.APP_URL).toString();
      return `<item>
        <title>${escapeXml(post.title)}</title>
        <link>${escapeXml(link)}</link>
        <guid isPermaLink="true">${escapeXml(link)}</guid>
        <description>${escapeXml(post.excerpt)}</description>
        <category>${escapeXml(post.category.name)}</category>
        <pubDate>${(post.publishedAt ?? post.createdAt).toUTCString()}</pubDate>
      </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeXml(title)}</title>
    <link>${escapeXml(env.APP_URL)}</link>
    <description>${escapeXml(description)}</description>
    <language>zh-CN</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    ${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
