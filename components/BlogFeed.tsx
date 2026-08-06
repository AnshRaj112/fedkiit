import { prisma } from "@/lib/db";

export default async function BlogFeed() {
  const blogs = await prisma.blog.findMany({
    where: { visibility: "public" },
    orderBy: { createdAt: "desc" },
  });

  if (blogs.length === 0) {
    return (
      <p className="text-center text-gray-400 py-12">No blogs to show yet.</p>
    );
  }

  return (
    <section className="flex flex-wrap gap-8 py-8 w-full max-w-7xl mx-auto px-4">
      {blogs.map((blog) => (
        <a
          key={blog.id}
          href={blog.blogLink || "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 min-w-[280px] max-w-[400px] flex flex-col gap-3 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 hover:border-zinc-600 transition-colors"
        >
          {blog.image && (
            <img
              src={blog.image}
              alt={blog.title || "Blog image"}
              className="w-full h-48 object-cover rounded-lg"
            />
          )}
          <h3 className="text-lg font-semibold text-white">
            {blog.title || "Untitled Blog"}
          </h3>
          {blog.summary && (
            <p className="text-sm text-gray-400 line-clamp-3">
              {blog.summary}
            </p>
          )}
          <p className="text-xs text-gray-500">
            {blog.date
              ? new Date(blog.date).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })
              : ""}
          </p>
        </a>
      ))}
    </section>
  );
}
