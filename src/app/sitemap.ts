import type { MetadataRoute } from "next";
import {
  getCategories,
  getPublishedPosts,
  getPublishedProjects,
  getTags,
} from "@/lib/data";
import { getPublishedPhotoAlbums } from "@/lib/garden-data";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (process.env.APP_URL ?? "http://localhost:3000").replace(
    /\/+$/,
    "",
  );
  const [posts, projects, categories, tags, albums] = await Promise.all([
    getPublishedPosts({ pageSize: 50 }),
    getPublishedProjects({ pageSize: 50 }),
    getCategories(),
    getTags(),
    getPublishedPhotoAlbums({ pageSize: 50 }),
  ]);

  const staticRoutes = [
    "",
    "/blog",
    "/archive",
    "/categories",
    "/tags",
    "/projects",
    "/photos",
    "/music",
    "/moments",
    "/guestbook",
    "/friends",
    "/about",
    "/calendar",
    "/now",
    "/contact",
    "/search",
  ].map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    changeFrequency: path === "" ? ("weekly" as const) : ("monthly" as const),
    priority:
      path === ""
        ? 1
        : ["/blog", "/projects", "/photos", "/moments"].includes(path)
          ? 0.9
          : 0.7,
  }));

  return [
    ...staticRoutes,
    ...posts.items.map((post) => ({
      url: `${base}/blog/${post.slug}`,
      lastModified: post.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    ...projects.items.map((project) => ({
      url: `${base}/projects/${project.slug}`,
      lastModified: project.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    ...albums.items.map((album) => ({
      url: `${base}/photos/${album.slug}`,
      lastModified: album.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.75,
    })),
    ...categories.map((category) => ({
      url: `${base}/blog?category=${encodeURIComponent(category.slug)}`,
      lastModified: category.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.55,
    })),
    ...tags.map((tag) => ({
      url: `${base}/blog?tag=${encodeURIComponent(tag.slug)}`,
      lastModified: tag.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.5,
    })),
  ];
}
