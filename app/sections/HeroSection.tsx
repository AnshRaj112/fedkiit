import Link from "next/link";

export default function HeroSection() {
  return (
    <section
      id="hero"
      className="fed-section overflow-hidden"
      aria-label="Hero – Empowering the next generation of founders"
    >
      <div className="fed-container">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left: Text Content (Col span 7) */}
          <div className="lg:col-span-7 pr-0 lg:pr-6">
            {/* Main Headline */}
            <h1 className="fed-h1 mb-6 animate-fade-up animate-delay-200">
              Empowering the{" "}
              <em className="fed-orange-italic">Next</em>
              <br />
              Generation of{" "}
              <em className="fed-orange-italic">Founders</em>
            </h1>

            {/* Description */}
            <p className="text-[#a0a0a0] text-base md:text-lg leading-relaxed max-w-xl mb-16 md:mb-20 animate-fade-up animate-delay-300">
              We bridge the gap between engineering and entrepreneurship. FED
              KIIT is a community-driven initiative fostering innovation,
              mentorship, and building products that scale.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-4 mt-12 md:mt-14 animate-fade-up animate-delay-400">
              <Link href="/login" className="fed-btn-primary py-3 px-6 text-base">
                Login →
              </Link>
              <Link href="#about" className="fed-btn-secondary py-3 px-6 text-base">
                Our Vision
              </Link>
            </div>
          </div>

          {/* Right: Hero Image Placeholder Card (Col span 5) */}
          <div className="lg:col-span-5 relative animate-fade-up animate-delay-300">
            {/* Image Placeholder Card */}
            <div className="fed-img-placeholder w-full aspect-[4/3] lg:aspect-[1/1] rounded-3xl relative overflow-hidden shadow-2xl">
              <div className="fed-img-placeholder-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <polyline points="21 15 16 10 5 21"/>
                </svg>
              </div>
              <span className="text-sm text-center px-6">
                Hero Image Placeholder
                <br />
                <span className="text-xs text-[#666] mt-1 block">
                  Replace with your image URL
                </span>
              </span>
            </div>

            {/* Floating Member Badge */}
            <div className="absolute -bottom-5 -left-3 sm:bottom-6 sm:left-6 bg-[#111111]/95 border border-white/12 rounded-2xl p-4 shadow-2xl backdrop-blur-xl">
              <div className="text-2xl font-extrabold text-white tracking-tight">500+</div>
              <div className="text-xs text-[#999999] font-medium mt-0.5">Active Members</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
