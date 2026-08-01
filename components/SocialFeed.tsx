import { prisma } from "@/lib/db";
import type { SocialPost } from "@/lib/types/SocialPost";

export default async function SocialFeed() {
  const posts = await prisma.socialPost.findMany({
    where: { isVisible: true },
    orderBy: { createdAt: "desc" },
  });

  if (posts.length === 0) {
    return (
      <p className="text-center text-gray-400 py-12">No social posts to show yet.</p>
    );
  }

  return (
    <section className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 py-8 w-full max-w-7xl mx-auto px-4">
      {posts.map((post) => (
        <div key={post.id} className="flex flex-col gap-3">
          {post.platform === "instagram" ? (
            <iframe
              src={post.embedUrl}
              className="w-full rounded-xl border border-zinc-800"
              style={{ minHeight: "540px" }}
              scrolling="no"
              allow="encrypted-media"
              title={`Instagram post${post.caption ? ": " + post.caption : ""}`}
            />
          ) : post.platform === "linkedin" ? (
            <iframe
              src={post.embedUrl}
              className="w-full rounded-xl border border-zinc-800 bg-white"
              style={{ minHeight: "400px" }}
              scrolling="no"
              allow="encrypted-media"
              title={`LinkedIn post${post.caption ? ": " + post.caption : ""}`}
            />
          ) : null}
          {post.caption && (
            <p className="text-sm text-gray-400 px-1">{post.caption}</p>
          )}
        </div>
      ))}
    </section>
  );
}
