import Link from "next/link";

const events = [
  {
    id: "pixel-blitz-hack",
    tag: "Hackathon",
    title: "Pixel Blitz Hack",
    description:
      "A 48-hour design and code blitz where creators build interfaces that break the internet.",
    date: "Aug 14 – 16, 2025",
    imageAlt: "Pixel Blitz Hackathon Event",
  },
  {
    id: "founders-videocast",
    tag: "Fireside",
    title: "Founder's Videocast",
    description:
      "A live videocast with founders on failing, funding and finding product-market fit.",
    date: "Aug 24, 2025",
    imageAlt: "Founder's Videocast Event",
  },
  {
    id: "e-summit-2025",
    tag: "Summit",
    title: "E-Summit 2025",
    description:
      "Three days of speakers, pitching, workshops and startup expo.",
    date: "Sep 19 – 21, 2025",
    imageAlt: "E-Summit 2025 Event",
  },
];

export default function EventsSection() {
  return (
    <section id="events" className="fed-section" aria-label="Flagship events this season">
      <div className="fed-container">
        {/* Section Header */}
        <div className="flex items-end justify-between mb-12 flex-wrap gap-4 border-b border-white/5 pb-6">
          <div>
            <div className="fed-label mb-3 inline-flex">
              <span className="fed-label-dot" />
              FLAGSHIP
            </div>
            <h2 className="fed-h2">Events this Season</h2>
            <p className="text-[#999999] text-sm md:text-base mt-2">
              Handpicked programs shaping this quarter.
            </p>
          </div>
          <Link
            href="/events"
            className="text-[#f97316] text-sm font-semibold hover:underline flex items-center gap-1.5 pb-1"
          >
            View all →
          </Link>
        </div>

        {/* Events Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {events.map((event) => (
            <article key={event.id} className="fed-event-card group flex flex-col justify-between">
              <div>
                {/* Image Placeholder Area */}
                <div className="relative h-52 overflow-hidden bg-[#161616] border-b border-white/5 flex flex-col items-center justify-center p-4">
                  <div className="w-11 h-11 bg-[#f97316]/12 rounded-xl flex items-center justify-center text-[#f97316] mb-2">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                      <circle cx="8.5" cy="8.5" r="1.5"/>
                      <polyline points="21 15 16 10 5 21"/>
                    </svg>
                  </div>
                  <span className="text-[#888] text-xs font-semibold text-center">
                    {event.imageAlt}
                  </span>
                  <span className="text-[#555] text-[11px] mt-0.5">Image Placeholder (Add URL)</span>

                  {/* Tag Overlay */}
                  <div className="absolute top-3 left-3">
                    <span className="fed-event-tag">{event.tag}</span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-6">
                  <h3 className="text-white font-bold text-lg mb-2.5 group-hover:text-[#f97316] transition-colors">
                    {event.title}
                  </h3>
                  <p className="text-[#999999] text-sm leading-relaxed mb-6">
                    {event.description}
                  </p>
                </div>
              </div>

              {/* Card Footer / Date */}
              <div className="px-6 pb-6 pt-0 border-t border-white/5 mt-auto flex items-center gap-2 text-[#777] text-xs font-medium">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                {event.date}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
