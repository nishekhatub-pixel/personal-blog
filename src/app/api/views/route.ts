import { z } from "zod";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { assertSameOrigin, getRequestMetadata } from "@/lib/security";

const viewSchema = z.object({
  path: z.string().trim().min(1).max(500).regex(/^\/(?!\/)/),
});

export async function POST(request: Request) {
  try {
    await assertSameOrigin(request);
    const parsed = viewSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "页面路径无效。" }, { status: 400 });

    const metadata = await getRequestMetadata();
    const since = new Date(Date.now() - 30 * 60 * 1000);
    const existing = await db.pageView.findFirst({
      where: { path: parsed.data.path, visitorHash: metadata.ipHash, createdAt: { gte: since } },
      select: { id: true },
    });
    if (existing) return new NextResponse(null, { status: 204 });

    const postSlug = parsed.data.path.match(/^\/blog\/([^/?#]+)/)?.[1];
    const projectSlug = parsed.data.path.match(/^\/projects\/([^/?#]+)/)?.[1];
    const [post, project] = await Promise.all([
      postSlug ? db.post.findUnique({ where: { slug: postSlug }, select: { id: true } }) : null,
      projectSlug ? db.project.findUnique({ where: { slug: projectSlug }, select: { id: true } }) : null,
    ]);
    await db.$transaction(async (transaction) => {
      await transaction.pageView.create({
        data: {
          path: parsed.data.path,
          visitorHash: metadata.ipHash,
          postId: post?.id,
          projectId: project?.id,
        },
      });
      if (post) await transaction.post.update({ where: { id: post.id }, data: { viewCount: { increment: 1 } } });
    });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "统计写入失败。" },
      { status: 403 },
    );
  }
}
