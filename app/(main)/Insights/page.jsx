import SocialFeed from "@/components/SocialFeed";
import Blog from "@/src/views/Blog/Blog";

export default function InsightsPage() {
  return (
    <main className="w-full">
      <section id="socials" className="py-8">
        <h2 className="text-2xl font-semibold text-center mb-8">
          Our Socials
        </h2>
        <SocialFeed />
      </section>
      <section id="blogs" className="py-8">
        <h2 className="text-2xl font-semibold text-center mb-8">
          Blogs
        </h2>
        <Blog />
      </section>
    </main>
  );
}
