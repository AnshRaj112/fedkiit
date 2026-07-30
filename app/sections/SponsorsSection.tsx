import Link from "next/link";

const sponsors = [
  { tier: "TITLE SPONSOR", tierColor: "#f97316", name: "Blume Ventures" },
  { tier: "PLATINUM",      tierColor: "#e2e8f0", name: "Razorpay" },
  { tier: "PLATINUM",      tierColor: "#e2e8f0", name: "Zerodha" },
  { tier: "GOLD",          tierColor: "#f59e0b", name: "Y Combinator" },
  { tier: "GOLD",          tierColor: "#f59e0b", name: "Sequoia" },
  { tier: "SILVER",        tierColor: "#94a3b8", name: "Antler" },
  { tier: "SILVER",        tierColor: "#94a3b8", name: "Notion" },
  { tier: "SILVER",        tierColor: "#94a3b8", name: "Figma" },
];

export default function SponsorsSection() {
  return (
    <section id="sponsors" className="fed-section" aria-label="Sponsors and partners">
      <div className="fed-container">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="fed-label inline-flex mb-4">
            <span className="fed-label-dot" />
            BACKED BY
          </div>
          <h2 className="fed-h2">
            Our <em className="fed-orange-italic">Sponsors</em> &amp; Partners
          </h2>
          <p className="text-[#999999] text-base mt-3">
            The founders, VCs and companies that fuel every FED experience.
          </p>
        </div>

        {/* Sponsors Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 mb-10">
          {sponsors.map((sponsor, i) => (
            <div key={i} className="fed-sponsor-card">
              <span
                className="text-[0.6875rem] font-extrabold tracking-widest uppercase"
                style={{ color: sponsor.tierColor }}
              >
                {sponsor.tier}
              </span>
              <span className="text-white font-bold text-xl tracking-tight">
                {sponsor.name}
              </span>
            </div>
          ))}
        </div>

        {/* Become a Sponsor CTA Banner */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 bg-[#111111]/90 border border-white/10 rounded-2xl p-6 md:p-8 backdrop-blur-xl">
          <div>
            <h3 className="text-white font-bold text-lg md:text-xl">
              Want to sponsor the next FED cohort?
            </h3>
            <p className="text-[#999999] text-sm mt-1">
              Get in front of 5,000+ engineering student-founders across Eastern India.
            </p>
          </div>
          <Link href="/sponsor" className="fed-btn-primary shrink-0 text-base py-3 px-6">
            Become a Sponsor →
          </Link>
        </div>
      </div>
    </section>
  );
}
