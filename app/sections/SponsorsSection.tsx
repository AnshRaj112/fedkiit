import Link from "next/link";
import sponsorsData from "../data/sponsors.json";

const { sponsors } = sponsorsData;
// Duplicate for seamless infinite loop
const allSponsors = [...sponsors, ...sponsors];

export default function SponsorsSection() {
  return (
    <section
      id="sponsors"
      className="fed-section section-glow-left"
      aria-label="Sponsors and partners"
    >
      <div className="fed-container">
        {/* Header - Centered */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            maxWidth: "48rem",
            marginLeft: "auto",
            marginRight: "auto",
            marginBottom: "4rem",
          }}
        >
          <div className="fed-label inline-flex" style={{ marginBottom: "1.25rem" }}>
            <span className="fed-label-dot" />
            BACKED BY
          </div>
          <h2 className="fed-h2 text-center" style={{ textAlign: "center", width: "100%" }}>
            Our <em className="fed-orange-italic">Sponsors</em> &amp; Partners
          </h2>
          <p
            className="text-[#999999] text-base md:text-lg leading-relaxed text-center"
            style={{ marginTop: "1rem", textAlign: "center" }}
          >
            The founders, VCs and companies that fuel every FED experience.
          </p>
        </div>

        {/* Infinite Carousel Container */}
        <div className="sponsor-carousel-outer" style={{ marginBottom: "5rem" }}>
          <div className="sponsor-carousel-track">
            {allSponsors.map((sponsor, i) => (
              <div key={i} className="fed-sponsor-card">
                {/* Tier Label */}
                <span
                  className="text-[0.625rem] font-extrabold tracking-widest uppercase"
                  style={{ color: sponsor.tierColor }}
                >
                  {sponsor.tier}
                </span>

                {/* Logo Image Placeholder */}
                <div className="fed-sponsor-img-placeholder">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                </div>

                {/* Sponsor Name */}
                <span className="text-white font-bold text-sm tracking-tight text-center leading-tight">
                  {sponsor.name}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Become a Sponsor CTA Banner */}
        <div
          className="flex flex-col sm:flex-row items-center justify-between gap-8 bg-[#111111]/90 border border-white/10 rounded-3xl backdrop-blur-xl max-w-5xl mx-auto shadow-2xl"
          style={{ padding: "2.5rem 2.5rem" }}
        >
          <div className="text-center sm:text-left">
            <h3 className="text-white font-bold text-xl md:text-2xl" style={{ marginBottom: "0.5rem" }}>
              Want to sponsor the next FED cohort?
            </h3>
            <p className="text-[#999999] text-sm md:text-base leading-relaxed">
              Get in front of 5,000+ engineering student-founders across Eastern India.
            </p>
          </div>
          <Link
            href="/sponsor"
            className="fed-btn-primary shrink-0 text-base"
            style={{ padding: "0.875rem 2rem" }}
          >
            Become a Sponsor →
          </Link>
        </div>
      </div>
    </section>
  );
}
