import Link from "next/link";
import { events, getStatusColor } from "../data/events";

// Only show first 3 events on homepage
const homeEvents = events.slice(0, 3);

export default function EventsSection() {
  return (
    <section
      id="events"
      className="fed-section section-glow-right"
      aria-label="Flagship events this season"
    >
      <div className="fed-container">
        {/* Section Header */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "1.5rem",
            marginBottom: "3.5rem",
            paddingBottom: "2rem",
            borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
          }}
        >
          <div>
            <div className="fed-label inline-flex" style={{ marginBottom: "1.25rem" }}>
              <span className="fed-label-dot" />
              FLAGSHIP
            </div>
            <h2 className="fed-h2">Events this Season</h2>
            <p className="text-[#999999] text-base" style={{ marginTop: "0.75rem" }}>
              Handpicked programs shaping this quarter.
            </p>
          </div>
          <Link
            href="/events"
            className="text-[#f97316] text-sm font-semibold hover:underline flex items-center gap-1.5"
            style={{ paddingBottom: "0.25rem" }}
          >
            View all →
          </Link>
        </div>

        {/* Events Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "2.25rem",
          }}
        >
          {homeEvents.map((event) => {
            const isLive = event.status === "live";

            return (
              <article
                key={event.id}
                className={`fed-event-card group flex flex-col justify-between ${
                  isLive ? "fed-event-card--live" : ""
                }`}
              >
                <div>
                  {/* Image Placeholder Area */}
                  <Link
                    href={`/events/${event.id}`}
                    className="block relative h-56 overflow-hidden bg-[#161616] border-b border-white/10 flex flex-col items-center justify-center p-6 text-center"
                  >
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
                      style={{
                        background: "rgba(249, 115, 22, 0.12)",
                        color: "#f97316",
                      }}
                    >
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                        <circle cx="8.5" cy="8.5" r="1.5"/>
                        <polyline points="21 15 16 10 5 21"/>
                      </svg>
                    </div>
                    <span className="text-[#888] text-xs font-semibold">
                      {event.imageAlt}
                    </span>
                    <span className="text-[#555] text-[11px]" style={{ marginTop: "0.25rem" }}>
                      Image Placeholder
                    </span>

                    {/* Tag Overlay */}
                    <div className="absolute top-4 left-4">
                      <span className="fed-event-tag">{event.tag}</span>
                    </div>

                    {/* Live Spot Glow & Status Badge */}
                    <div className="absolute top-4 right-4">
                      {isLive ? (
                        <span className="status-badge status-badge--live">
                          <span className="status-dot status-dot--live" />
                          LIVE
                        </span>
                      ) : event.status === "upcoming" ? (
                        <span className="status-badge status-badge--upcoming">
                          <span className="status-dot" />
                          UPCOMING
                        </span>
                      ) : (
                        <span className="status-badge status-badge--past">
                          PAST
                        </span>
                      )}
                    </div>

                    {/* Live Glow Overlay */}
                    {isLive && (
                      <div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                          background: `radial-gradient(ellipse at 50% 100%, rgba(34,197,94,0.18) 0%, transparent 70%)`,
                        }}
                      />
                    )}
                  </Link>

                  {/* Card Body */}
                  <div style={{ padding: "1.75rem 1.75rem 1.25rem 1.75rem" }}>
                    <Link href={`/events/${event.id}`}>
                      <h3
                        className="text-white font-bold text-lg md:text-xl leading-snug group-hover:text-[#f97316] transition-colors"
                        style={{
                          marginBottom: "0.875rem",
                          color: isLive ? "#22c55e" : undefined,
                        }}
                      >
                        {event.title}
                      </h3>
                    </Link>
                    <p className="text-[#999999] text-sm leading-relaxed">
                      {event.description}
                    </p>
                  </div>
                </div>

                {/* Card Footer */}
                <div
                  style={{
                    padding: "1.25rem 1.75rem 1.75rem 1.75rem",
                    borderTop: "1px solid rgba(255, 255, 255, 0.1)",
                    marginTop: "auto",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "1rem",
                  }}
                >
                  <div className="flex items-center gap-2 text-[#888888] text-xs font-medium">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                      <line x1="16" y1="2" x2="16" y2="6"/>
                      <line x1="8" y1="2" x2="8" y2="6"/>
                      <line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                    {event.date}
                  </div>
                  <Link
                    href={`/events/${event.id}`}
                    className="text-xs font-semibold hover:underline flex items-center gap-1"
                    style={{ color: isLive ? "#22c55e" : "#f97316" }}
                  >
                    View details →
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
