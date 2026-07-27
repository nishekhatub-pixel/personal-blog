import { Prisma, PrismaClient } from "@prisma/client";
import { deleteMediaAndFiles } from "@/lib/uploads";

const prisma = new PrismaClient();
const cleanupRequested = process.argv.includes("--cleanup-test-data");

const testPostWhere: Prisma.PostWhereInput = {
  slug: { startsWith: "playwright-crud-" },
};

const testCommentWhere: Prisma.CommentWhereInput = {
  OR: [
    {
      authorName: "自动化测试读者",
      email: "qa-reader@example.com",
    },
    {
      content: {
        contains: "由端到端测试提交",
      },
    },
  ],
};

async function snapshot() {
  const [
    posts,
    projects,
    categories,
    tags,
    users,
    settings,
    comments,
    testPosts,
    testComments,
    albums,
    photos,
    moments,
    momentComments,
    musicTracks,
    playlists,
    guestbookMessages,
    friendLinks,
    media,
    testMoments,
    testGuestbookMessages,
    testFriendLinks,
    testAlbums,
    testMedia,
  ] = await Promise.all([
    prisma.post.count(),
    prisma.project.count(),
    prisma.category.count(),
    prisma.tag.count(),
    prisma.user.count(),
    prisma.siteSetting.count(),
    prisma.comment.count(),
    prisma.post.count({ where: testPostWhere }),
    prisma.comment.count({ where: testCommentWhere }),
    prisma.photoAlbum.count(),
    prisma.photo.count(),
    prisma.moment.count(),
    prisma.momentComment.count(),
    prisma.musicTrack.count(),
    prisma.playlist.count(),
    prisma.guestbookMessage.count(),
    prisma.friendLink.count(),
    prisma.media.count(),
    prisma.moment.count({ where: { content: { contains: "e2e-moment-" } } }),
    prisma.guestbookMessage.count({
      where: { content: { contains: "e2e-guestbook-" } },
    }),
    prisma.friendLink.count({
      where: {
        OR: [
          { name: { contains: "e2e-friend-" } },
          { url: { contains: "e2e-friend-" } },
        ],
      },
    }),
    prisma.photoAlbum.count({ where: { slug: { startsWith: "e2e-album-" } } }),
    prisma.media.count({
      where: { originalName: { startsWith: "e2e-album-" } },
    }),
  ]);

  return {
    posts,
    projects,
    categories,
    tags,
    users,
    settings,
    comments,
    testPosts,
    testComments,
    albums,
    photos,
    moments,
    momentComments,
    musicTracks,
    playlists,
    guestbookMessages,
    friendLinks,
    media,
    testMoments,
    testGuestbookMessages,
    testFriendLinks,
    testAlbums,
    testMedia,
  };
}

async function main() {
  const before = await snapshot();
  const testMediaRows = cleanupRequested
    ? await prisma.media.findMany({
        select: { id: true },
        where: { originalName: { startsWith: "e2e-album-" } },
      })
    : [];
  const hasTestData =
    before.testPosts +
      before.testComments +
      before.testMoments +
      before.testGuestbookMessages +
      before.testFriendLinks +
      before.testAlbums +
      before.testMedia >
    0;

  if (cleanupRequested && hasTestData) {
    const [
      deletedComments,
      deletedPosts,
      deletedMoments,
      deletedGuestbookMessages,
      deletedFriendLinks,
      deletedAlbums,
    ] = await prisma.$transaction([
      prisma.comment.deleteMany({ where: testCommentWhere }),
      prisma.post.deleteMany({ where: testPostWhere }),
      prisma.moment.deleteMany({
        where: { content: { contains: "e2e-moment-" } },
      }),
      prisma.guestbookMessage.deleteMany({
        where: { content: { contains: "e2e-guestbook-" } },
      }),
      prisma.friendLink.deleteMany({
        where: {
          OR: [
            { name: { contains: "e2e-friend-" } },
            { url: { contains: "e2e-friend-" } },
          ],
        },
      }),
      prisma.photoAlbum.deleteMany({
        where: { slug: { startsWith: "e2e-album-" } },
      }),
    ]);
    for (const row of testMediaRows) {
      await deleteMediaAndFiles(row.id);
    }

    console.log(
      `已清理测试数据：${deletedPosts.count} 篇文章，${deletedComments.count} 条评论，${deletedMoments.count} 条说说，${deletedGuestbookMessages.count} 条留言，${deletedFriendLinks.count} 条友链，${deletedAlbums.count} 本相册，${testMediaRows.length} 个媒体文件。`,
    );
  }

  const current = cleanupRequested ? await snapshot() : before;
  console.log(JSON.stringify(current, null, 2));

  if (current.posts < 10 || current.projects < 6 || current.users < 1) {
    throw new Error("数据库演示数据不完整，请先执行 pnpm db:seed。");
  }
  if (
    current.testPosts +
      current.testComments +
      current.testMoments +
      current.testGuestbookMessages +
      current.testFriendLinks +
      current.testAlbums +
      current.testMedia >
    0
  ) {
    throw new Error("数据库仍包含自动化测试记录，请执行 pnpm test:cleanup。");
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
