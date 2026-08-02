"use client";

import { useState } from "react";
import Link from "next/link";
import { events, FedEvent } from "../data/events";

type FilterTab = "all" | "live" | "upcoming" | "past";

const tabs: { key: FilterTab; label: string }[] = [
  { key: "all",      label: "All Events" },
  { key: "live",     label: "Live Now" },
  { key: "upcoming", label: "Upcoming" },
  { key: "past",     label: "Past" },
];

/* ── Small reusable image placeholder ────────────────────────────── */
function EventImg({
  event,
  className = "",
}: {
  event: FedEvent;
  className?: string;
}) {
  const isLive = event.status === "live";
  return (
    <div
      className={`relative flex flex-col items-center justify-center p-8 ${className}`}
      style={{
        background: isLive
          ? "linear-gradient(135deg, #07190c 0%, #0c180e 100%)"
          : "rgba(20, 20, 20, 0.95)",
      }}
    >
      {/* Live Glow Overlay */}
      {isLive && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at 50% 110%, rgba(34, 197, 94, 0.25) 0%, transparent 70%)",
          }}
        />
      )}

      {/* Image Placeholder Icon & Text */}
      <div className="relative z-10 flex flex-col items-center gap-3 text-center">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
          style={{
            background: isLive ? "rgba(34, 197, 94, 0.16)" : "rgba(249, 115, 22, 0.14)",
            color: isLive ? "#22c55e" : "#f97316",
          }}
        >
          <svg
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
        </div>
        <span className="text-[#888] text-xs font-semibold">{event.imageAlt}</span>
        <span className="text-[#555] text-[11px]">Image Placeholder</span>
      </div>

      {/* Category Tag */}
      <div className="absolute top-4 left-4 z-10">
        <span className="fed-event-tag">{event.tag}</span>
      </div>

      {/* Status Badge */}
      <div className="absolute top-4 right-4 z-10">
        {event.status === "live" ? (
          <span className="status-badge status-badge--live">
            <span className="status-dot status-dot--live" /> LIVE NOW
          </span>
        ) : event.status === "upcoming" ? (
          <span className="status-badge status-badge--upcoming">
            <span className="status-dot" /> UPCOMING
          </span>
        ) : (
          <span className="status-badge status-badge--past">PAST</span>
        )}
      </div>
    </div>
  );
}

/* ── Meta Pill Component ─────────────────────────────────────────── */
function MetaRow({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-[#a0a0a0] text-sm">
      <span className="text-[#f97316] opacity-90">{icon}</span>
      {text}
    </span>
  );
}

const CalIcon = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const PinIcon = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const TrophyIcon = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

/* ══════════════════════════════════════════════════════════════════ */

export default function EventsPage() {
  const [activeTab, setActiveTab] = useState<FilterTab>("all");

  const filtered =
    activeTab === "all" ? events : events.filter((e) => e.status === activeTab);

  const featured =
    filtered.find((e) => e.status === "live") ??
    filtered.find((e) => e.status === "upcoming") ??
    filtered[0];

  const grid = filtered.filter((e) => e !== featured);

  return (
    <main
      className="min-h-screen bg-top-orange-glow overflow-hidden"
      style={{ background: "var(--fed-bg)", paddingTop: "8.5rem", paddingBottom: "8rem" }}
    >
      <div className="fed-container">

        {/* ── Page Title Header ───────────────────────────────────── */}
        <div style={{ marginBottom: "2.5rem" }}>
          <div className="fed-label inline-flex" style={{ marginBottom: "1.25rem" }}>
            <span className="fed-label-dot" />
            EVENTS
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "1.5rem",
              paddingBottom: "2rem",
              borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
            }}
          >
            <div>
              <h1 className="fed-h1" style={{ marginBottom: "1rem" }}>
                All <em className="fed-orange-italic">Events</em>
              </h1>
              <p className="text-[#a0a0a0] text-base md:text-lg max-w-xl leading-relaxed">
                Hackathons, firesides, summits and workshops — every FED experience in one place.
              </p>
            </div>
          </div>
        </div>

        {/* ── Filter Tabs ──────────────────────────────────────── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            flexWrap: "wrap",
            marginBottom: "3.5rem",
          }}
        >
          {tabs.map((tab) => {
            const count =
              tab.key === "all"
                ? events.length
                : events.filter((e) => e.status === tab.key).length;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`events-filter-tab ${
                  activeTab === tab.key
                    ? "events-filter-tab--active"
                    : "events-filter-tab--inactive"
                }`}
              >
                {tab.label}
                <span
                  style={{
                    fontSize: "0.72rem",
                    borderRadius: "9999px",
                    padding: "0.15rem 0.55rem",
                    fontWeight: 700,
                    marginLeft: "0.35rem",
                    background:
                      activeTab === tab.key
                        ? "rgba(255, 255, 255, 0.25)"
                        : "rgba(255, 255, 255, 0.08)",
                    color: activeTab === tab.key ? "#ffffff" : "#888888",
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── Empty State ──────────────────────────────────────── */}
        {filtered.length === 0 && (
          <div className="text-center" style={{ padding: "6rem 0" }}>
            <p className="text-[#666] text-lg font-medium">No events found in this category.</p>
          </div>
        )}

        {/* ── Featured Card ─────────────────────────────────────── */}
        {featured && (
          <div style={{ marginBottom: "3.5rem" }}>
            <div
              className={`event-featured-card ${
                featured.status === "live" ? "event-featured-card--live" : ""
              }`}
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
                {/* Image Placeholder Side */}
                <EventImg
                  event={featured}
                  className="lg:col-span-6 h-72 lg:h-full min-h-[320px] border-b lg:border-b-0 lg:border-r border-white/10"
                />

                {/* Content Side */}
                <div
                  className="lg:col-span-6 flex flex-col justify-between"
                  style={{ padding: "2.75rem 2.5rem" }}
                >
                  <div>
                    <Link href={`/events/${featured.id}`} className="group inline-block">
                      <h2
                        className="font-extrabold text-white leading-tight group-hover:text-[#f97316] transition-colors"
                        style={{
                          fontSize: "clamp(1.75rem, 3.2vw, 2.35rem)",
                          marginBottom: "1.25rem",
                        }}
                      >
                        {featured.title}
                      </h2>
                    </Link>

                    <p
                      className="text-[#a0a0a0] text-base leading-relaxed"
                      style={{ marginBottom: "2rem" }}
                    >
                      {featured.description}
                    </p>

                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "1.25rem 2rem",
                        marginBottom: "2rem",
                      }}
                    >
                      <MetaRow icon={CalIcon} text={featured.date} />
                      <MetaRow icon={PinIcon} text={featured.venue} />
                      {featured.prizePool && (
                        <MetaRow icon={TrophyIcon} text={`Prize: ${featured.prizePool}`} />
                      )}
                    </div>
                  </div>

                  <Link
                    href={`/events/${featured.id}`}
                    className="fed-btn-primary self-start text-sm"
                    style={{
                      padding: "0.75rem 1.75rem",
                      ...(featured.status === "live"
                        ? {
                            background: "#22c55e",
                            boxShadow: "0 4px 24px rgba(34, 197, 94, 0.35)",
                          }
                        : {}),
                    }}
                  >
                    View Details →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Events Grid ───────────────────────────────────────── */}
        {grid.length > 0 && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
              gap: "2.25rem",
            }}
          >
            {grid.map((event) => (
              <article
                key={event.id}
                className={`event-grid-card group flex flex-col justify-between ${
                  event.status === "live" ? "event-grid-card--live" : ""
                }`}
              >
                <div>
                  {/* Image Placeholder */}
                  <EventImg event={event} className="h-52 border-b border-white/10" />

                  {/* Body Content */}
                  <div style={{ padding: "1.75rem 1.75rem 1rem 1.75rem" }}>
                    <Link href={`/events/${event.id}`}>
                      <h3
                        className="text-white font-bold text-lg md:text-xl leading-snug group-hover:text-[#f97316] transition-colors"
                        style={{ marginBottom: "0.875rem" }}
                      >
                        {event.title}
                      </h3>
                    </Link>
                    <p
                      className="text-[#999999] text-sm leading-relaxed line-clamp-3"
                      style={{ marginBottom: "1rem" }}
                    >
                      {event.description}
                    </p>
                  </div>
                </div>

                {/* Footer Metadata & Link */}
                <div
                  style={{
                    padding: "1.25rem 1.75rem 1.5rem 1.75rem",
                    borderTop: "1px solid rgba(255, 255, 255, 0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "1rem",
                    marginTop: "auto",
                  }}
                >
                  <span className="inline-flex items-center gap-2 text-[#888888] text-xs font-medium">
                    {CalIcon}
                    {event.date}
                  </span>
                  <Link
                    href={`/events/${event.id}`}
                    className="text-xs font-semibold hover:underline transition-colors flex items-center gap-1"
                    style={{
                      color: event.status === "live" ? "#22c55e" : "#f97316",
                    }}
                  >
                    View details →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
