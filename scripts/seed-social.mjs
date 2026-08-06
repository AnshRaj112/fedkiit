// Seeds the database with FED KIIT social posts and sample blogs so the
// /Social and /Insights pages have content to render in local dev.
//
// Run from the project root:
//   node --env-file=.env.local scripts/seed-social.mjs
//
// Safe to re-run: it only inserts when the corresponding table is empty.
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const socialPosts = [
  {
    platform: "instagram",
    url: "https://www.instagram.com/p/C_NcMspy94V/",
    embedUrl: "https://www.instagram.com/p/C_NcMspy94V/embed",
    caption: "FED KIIT on Instagram",
  },
  {
    platform: "instagram",
    url: "https://www.instagram.com/p/DNBKQZXzDvn/",
    embedUrl: "https://www.instagram.com/p/DNBKQZXzDvn/embed",
    caption: "Omega 6.0",
  },
  {
    platform: "instagram",
    url: "https://www.instagram.com/p/DM5azT6TVt4/",
    embedUrl: "https://www.instagram.com/p/DM5azT6TVt4/embed",
    caption: "Latest from FED",
  },
  {
    platform: "linkedin",
    url: "https://www.linkedin.com/feed/update/urn:li:share:7358731261688827904",
    embedUrl:
      "https://www.linkedin.com/embed/feed/update/urn:li:share:7358731261688827904",
    caption: "Unstop x InnovateX Hackathon, Omega",
  },
];

const blogs = [
  {
    image: "https://picsum.photos/seed/fed-blog-1/640/360",
    title: "The Repreneur Show: Lessons from Founders",
    author: { name: "FED KIIT", department: "Editorial" },
    blogLink: "https://medium.com/@fedkiit",
    desc: "Highlights and takeaways from The Repreneur Show — real founder stories from the KIIT ecosystem.",
    summary:
      "Highlights and takeaways from The Repreneur Show — real founder stories from the KIIT ecosystem.",
    date: new Date("2026-07-20").toISOString(),
    visibility: "public",
    approval: true,
    category: "Events",
  },
  {
    image: "https://picsum.photos/seed/fed-blog-2/640/360",
    title: "Omega 6.0: What to Expect",
    author: { name: "FED KIIT", department: "Events" },
    blogLink: "https://medium.com/@fedkiit",
    desc: "A preview of Omega 6.0 — FED Premier League, Strategic Pivot Challenge, InnovateX Hackathon and more.",
    summary:
      "A preview of Omega 6.0 — FED Premier League, Strategic Pivot Challenge, InnovateX Hackathon and more.",
    date: new Date("2026-07-28").toISOString(),
    visibility: "public",
    approval: true,
    category: "Events",
  },
  {
    image: "https://picsum.photos/seed/fed-blog-3/640/360",
    title: "Building a Startup While in College",
    author: { name: "FED KIIT", department: "Editorial" },
    blogLink: "https://medium.com/@fedkiit",
    desc: "Practical advice on balancing academics with building something of your own.",
    summary:
      "Practical advice on balancing academics with building something of your own.",
    date: new Date("2026-08-01").toISOString(),
    visibility: "public",
    approval: true,
    category: "Entrepreneurship",
  },
];

async function main() {
  const postCount = await prisma.socialPost.count();
  if (postCount === 0) {
    await prisma.socialPost.createMany({ data: socialPosts });
    console.log(`Inserted ${socialPosts.length} social posts.`);
  } else {
    console.log(`Skipped social posts — ${postCount} already exist.`);
  }

  const blogCount = await prisma.blog.count();
  if (blogCount === 0) {
    await prisma.blog.createMany({ data: blogs });
    console.log(`Inserted ${blogs.length} blogs.`);
  } else {
    console.log(`Skipped blogs — ${blogCount} already exist.`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
