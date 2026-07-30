import "server-only";

import { unstable_cache } from "next/cache";

import { prisma } from "@/lib/db";

/**
 * Blog reads.
 *
 * Replaces `controllers/blog/getBlogs.js`, which returned *all* blog rows
 * regardless of the `visibility` column — so unpublished drafts were served to
 * the public. Visibility is enforced here.
 *
 * Posts link out to Medium (`blogLink`); the old in-app FullBlog route was
 * disabled in App.jsx, so this keeps the outbound model.
 */

export type BlogPost = {
  id: string;
  title: string;
  description: string;
  summary: string | null;
  image: string;
  category: string | null;
  link: string;
  dateLabel: string;
  date: Date | null;
  authorName: string;
  authorImage: string | null;
};

type AuthorBlob = { name?: string; img?: string; image?: string } | null;

function toPost(row: {
  id: string;
  title: string;
  desc: string;
  summary: string | null;
  image: string;
  category: string | null;
  blogLink: string;
  date: string;
  author: unknown;
}): BlogPost {
  const author = (row.author ?? null) as AuthorBlob;
  const parsed = new Date(row.date);

  return {
    id: row.id,
    title: row.title?.trim() || "Untitled",
    description: row.desc?.trim() || "",
    summary: row.summary?.trim() || null,
    image: row.image,
    category: row.category?.trim() || null,
    link: row.blogLink,
    dateLabel: row.date,
    date: Number.isNaN(parsed.getTime()) ? null : parsed,
    authorName: author?.name?.trim() || "FED KIIT",
    authorImage: author?.img || author?.image || null,
  };
}

/**
 * `visibility` is a free-text column rather than an enum. Existing rows use
 * "public"/"private", so anything that is not explicitly public stays hidden.
 */
const PUBLIC_VISIBILITY = ["public", "Public", "PUBLIC", "visible", "true"];

/**
 * Cached raw rows.
 *
 * Only the query is cached, not the mapped `BlogPost[]`: `unstable_cache`
 * serialises through JSON, which would turn `BlogPost.date` from a `Date` back
 * into a string and break the sort comparator.
 */
const cachedRows = unstable_cache(
  async () =>
    prisma.blog.findMany({
      where: { visibility: { in: PUBLIC_VISIBILITY } },
      select: {
        id: true,
        title: true,
        desc: true,
        summary: true,
        image: true,
        category: true,
        blogLink: true,
        date: true,
        author: true,
      },
    }),
  ["published-blogs"],
  { tags: ["blogs"], revalidate: 600 },
);

/**
 * Degrades to an empty list if the database is unreachable, so a Mongo outage
 * cannot fail `next build`. The catch sits outside `unstable_cache`, so the
 * failure is not cached and the next request retries.
 */
export async function getPublishedPosts(): Promise<BlogPost[]> {
  try {
    const rows = await cachedRows();
    return rows
      .map(toPost)
      .sort((a, b) => (b.date?.getTime() ?? 0) - (a.date?.getTime() ?? 0));
  } catch (error) {
    console.error("[blogs] could not load posts", error);
    return [];
  }
}

export async function getLatestPosts(limit = 3): Promise<BlogPost[]> {
  const posts = await getPublishedPosts();
  return posts.slice(0, limit);
}

export async function getPostCategories(): Promise<string[]> {
  const posts = await getPublishedPosts();
  const seen = new Set<string>();
  for (const post of posts) if (post.category) seen.add(post.category);
  return [...seen].sort();
}
