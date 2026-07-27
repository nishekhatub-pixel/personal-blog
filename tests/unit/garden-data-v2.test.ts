import { beforeEach, describe, expect, it, vi } from "vitest";

const dbMocks = vi.hoisted(() => ({
  transaction: vi.fn(),
  postCount: vi.fn(),
  projectCount: vi.fn(),
  albumCount: vi.fn(),
  photoCount: vi.fn(),
  momentCount: vi.fn(),
  trackCount: vi.fn(),
  playlistCount: vi.fn(),
  guestbookCount: vi.fn(),
  guestbookFindMany: vi.fn(),
  friendCount: vi.fn(),
  friendFindMany: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    $transaction: dbMocks.transaction,
    post: { count: dbMocks.postCount },
    project: { count: dbMocks.projectCount },
    photoAlbum: { count: dbMocks.albumCount },
    photo: { count: dbMocks.photoCount },
    moment: { count: dbMocks.momentCount },
    musicTrack: { count: dbMocks.trackCount },
    playlist: { count: dbMocks.playlistCount },
    guestbookMessage: {
      count: dbMocks.guestbookCount,
      findMany: dbMocks.guestbookFindMany,
    },
    friendLink: {
      count: dbMocks.friendCount,
      findMany: dbMocks.friendFindMany,
    },
  },
}));

import {
  getApprovedGuestbookMessages,
  getGardenHomepageStats,
  getPublishedFriendLinks,
} from "@/lib/garden-data";

describe("V2 garden data reads", () => {
  beforeEach(() => {
    for (const mock of Object.values(dbMocks)) mock.mockReset();
  });

  it("builds homepage statistics from all nine persisted content types", async () => {
    const queryTokens = [
      "posts",
      "projects",
      "albums",
      "photos",
      "moments",
      "tracks",
      "playlists",
      "guestbook",
      "friends",
    ];
    dbMocks.postCount.mockReturnValue(queryTokens[0]);
    dbMocks.projectCount.mockReturnValue(queryTokens[1]);
    dbMocks.albumCount.mockReturnValue(queryTokens[2]);
    dbMocks.photoCount.mockReturnValue(queryTokens[3]);
    dbMocks.momentCount.mockReturnValue(queryTokens[4]);
    dbMocks.trackCount.mockReturnValue(queryTokens[5]);
    dbMocks.playlistCount.mockReturnValue(queryTokens[6]);
    dbMocks.guestbookCount.mockReturnValue(queryTokens[7]);
    dbMocks.friendCount.mockReturnValue(queryTokens[8]);
    dbMocks.transaction.mockResolvedValue([10, 6, 2, 17, 4, 3, 1, 5, 8]);

    await expect(getGardenHomepageStats()).resolves.toEqual({
      posts: 10,
      projects: 6,
      albums: 2,
      photos: 17,
      moments: 4,
      musicTracks: 3,
      playlists: 1,
      guestbookMessages: 5,
      friendLinks: 8,
    });
    expect(dbMocks.transaction).toHaveBeenCalledWith(queryTokens);
    expect(dbMocks.guestbookCount).toHaveBeenCalledWith({
      where: { status: "APPROVED" },
    });
    expect(dbMocks.photoCount).toHaveBeenCalledWith({
      where: expect.objectContaining({
        status: "PUBLISHED",
        album: expect.objectContaining({ status: "PUBLISHED" }),
      }),
    });
  });

  it("never exposes unapproved guestbook records", async () => {
    dbMocks.guestbookFindMany.mockReturnValue("approved-message-query");
    dbMocks.guestbookCount.mockReturnValue("approved-message-count");
    dbMocks.transaction.mockResolvedValue([[], 0]);

    await expect(getApprovedGuestbookMessages()).resolves.toMatchObject({
      items: [],
      total: 0,
    });
    expect(dbMocks.guestbookFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { status: "APPROVED" } }),
    );
  });

  it("publishes only approved friend links whose release time has arrived", async () => {
    dbMocks.friendFindMany.mockResolvedValue([]);

    await expect(getPublishedFriendLinks()).resolves.toEqual([]);
    expect(dbMocks.friendFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          status: "PUBLISHED",
          publishedAt: { lte: expect.any(Date) },
        },
      }),
    );
  });
});
