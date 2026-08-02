import Link from "next/link";
import { notFound } from "next/navigation";
import { events, getEventById } from "../../data/events";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  return events.map((e) => ({ id: e.id }));
}

export default async function EventDetailPage({ params }: PageProps) {
  const { id } = await params;
  const event = getEventById(id);
  if (!event) notFound();

  const isLive     = event.status === "live";
  const isUpcoming = event.status === "upcoming";

  const accentColor = isLive ? "#22c55e" : isUpcoming ? "#f97316" : "#6b7280";

  return (
    <main
      className="min-h-screen bg-top-orange-glow overflow-hidden"
      style={{
        background: "var(--fed-bg)",
        paddingTop: "9.5rem",
        paddingBottom: "8rem",
      }}
    >
      <div className="fed-container">

        {/* ── Back to Events Button ──────────────────────────── */}
        <div style={{ marginBottom: "2.5rem" }}>
          <Link
            href="/events"
            className="inline-flex items-center gap-2 text-[#999999] hover:text-white text-sm font-semibold transition-colors group"
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "9999px",
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="group-hover:-translate-x-1 transition-transform"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Back to Events
          </Link>
        </div>

        {/* ── Main 2-Col Layout ─────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14">

          {/* ── LEFT (main content - 8 cols) ───────────────── */}
          <div className="lg:col-span-8">

            {/* Category + Status Badges Row */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "0.75rem",
                marginBottom: "1.75rem",
              }}
            >
              <span className="fed-event-tag">{event.tag}</span>
              {isLive ? (
                <span className="status-badge status-badge--live">
                  <span className="status-dot status-dot--live" /> LIVE NOW
                </span>
              ) : isUpcoming ? (
                <span className="status-badge status-badge--upcoming">
                  <span className="status-dot" /> UPCOMING
                </span>
              ) : (
                <span className="status-badge status-badge--past">PAST</span>
              )}
            </div>

            {/* Title */}
            <h1
              className="font-extrabold text-white leading-tight"
              style={{
                fontSize: "clamp(2.2rem, 4.5vw, 3.25rem)",
                letterSpacing: "-0.025em",
                marginBottom: "1.5rem",
              }}
            >
              {event.title}
            </h1>

            {/* Date & Venue Metadata */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "1.5rem",
                color: "#a0a0a0",
                fontSize: "0.95rem",
                marginBottom: "2.5rem",
              }}
            >
              <span className="inline-flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                {event.date}
              </span>
              <span className="inline-flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                {event.venue}
              </span>
            </div>

            {/* Banner Placeholder */}
            <div
              className="w-full rounded-3xl overflow-hidden flex flex-col items-center justify-center text-center p-8"
              style={{
                height: "340px",
                marginBottom: "3.5rem",
                background: isLive
                  ? "radial-gradient(ellipse at 50% 90%, rgba(34, 197, 94, 0.18) 0%, #0c180e 100%)"
                  : "rgba(18, 18, 18, 0.95)",
                border: `1px solid ${isLive ? "rgba(34, 197, 94, 0.3)" : "rgba(255, 255, 255, 0.1)"}`,
                boxShadow: isLive ? "0 0 60px rgba(34, 197, 94, 0.12)" : "none",
              }}
            >
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-3 shadow-lg"
                style={{ background: `${accentColor}20`, color: accentColor }}
              >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
              </div>
              <span className="text-[#888] text-sm font-semibold">{event.imageAlt}</span>
              <span className="text-[#555] text-xs mt-1">Event Banner Placeholder</span>
            </div>

            {/* About Section */}
            <div style={{ marginBottom: "3.5rem" }}>
              <h2 className="text-white font-bold text-2xl" style={{ marginBottom: "1.25rem" }}>
                About This Event
              </h2>
              <p className="text-[#a0a0a0] text-base md:text-lg leading-relaxed">
                {event.description}
              </p>
            </div>

            {/* Agenda Section */}
            <div style={{ marginBottom: "3.5rem" }}>
              <h2 className="text-white font-bold text-2xl" style={{ marginBottom: "1.75rem" }}>
                Event Agenda
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                {event.agenda.map((item, i) => (
                  <div key={i} className="agenda-item">
                    <div className="agenda-dot" />
                    <div style={{ paddingBottom: "0.5rem" }}>
                      <p
                        className="text-xs font-bold uppercase tracking-wider"
                        style={{ color: accentColor, marginBottom: "0.25rem" }}
                      >
                        {item.time}
                      </p>
                      <p className="text-white text-base font-medium">{item.activity}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Featured Speakers Section */}
            <div>
              <h2 className="text-white font-bold text-2xl" style={{ marginBottom: "1.75rem" }}>
                Featured Speakers
              </h2>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
                  gap: "1.25rem",
                }}
              >
                {event.speakers.map((speaker, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-4 rounded-2xl p-5"
                    style={{
                      background: "rgba(18, 18, 18, 0.95)",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                    }}
                  >
                    <div className="speaker-avatar">{speaker.initials}</div>
                    <div>
                      <p className="text-white font-bold text-base">{speaker.name}</p>
                      <p className="text-[#888888] text-xs" style={{ marginTop: "0.25rem" }}>
                        {speaker.title}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── RIGHT (sticky sidebar - 4 cols) ─────────────── */}
          <div className="lg:col-span-4">
            <div className="event-detail-sidebar" style={{ top: "7.5rem" }}>

              {/* Action Button */}
              {isLive || isUpcoming ? (
                <>
                  <button
                    className="fed-btn-primary w-full text-base"
                    style={{
                      padding: "0.875rem 1.5rem",
                      marginBottom: "0.75rem",
                      ...(isLive
                        ? {
                            background: "#22c55e",
                            boxShadow: "0 4px 24px rgba(34, 197, 94, 0.35)",
                          }
                        : {}),
                    }}
                  >
                    {isLive ? "Join Now — Live" : "Register Now"} →
                  </button>
                  <p className="text-[#888888] text-xs text-center" style={{ marginBottom: "1.75rem" }}>
                    {isLive ? "Event is happening right now!" : "Seats filling fast. Secure yours today."}
                  </p>
                </>
              ) : (
                <div
                  className="rounded-2xl text-center text-[#888888] text-sm"
                  style={{
                    padding: "1rem 1.25rem",
                    marginBottom: "1.75rem",
                    background: "rgba(255, 255, 255, 0.03)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                  }}
                >
                  This event has ended.
                </div>
              )}

              <div style={{ borderTop: "1px solid rgba(255, 255, 255, 0.1)", marginBottom: "0.5rem" }} />

              {/* Info Rows */}
              {[
                { label: "Date",      value: event.date,                 color: undefined },
                { label: "Venue",     value: event.venue,                color: undefined },
                ...(event.prizePool ? [{ label: "Prize Pool", value: event.prizePool, color: "#f97316" }] : []),
                ...(event.teamSize  ? [{ label: "Team Size",  value: event.teamSize,  color: undefined }] : []),
                { label: "Category",  value: event.tag,                  color: undefined },
                { label: "Status",    value: event.status,               color: accentColor },
              ].map(({ label, value, color }) => (
                <div key={label} className="event-detail-info-row">
                  <span className="event-detail-info-label">{label}</span>
                  <span
                    className="event-detail-info-value capitalize"
                    style={color ? { color } : {}}
                  >
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
