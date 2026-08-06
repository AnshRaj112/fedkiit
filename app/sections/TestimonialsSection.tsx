"use client";

import { useState, useEffect, useCallback } from "react";
import testimonialsData from "../data/testimonials.json";

const { testimonials } = testimonialsData;

export default function TestimonialsSection() {
  const [page, setPage] = useState(0);

  // Group testimonials into pairs of 2
  const pageSize = 2;
  const totalPages = Math.ceil(testimonials.length / pageSize);

  const next = useCallback(() => {
    setPage((prev) => (prev + 1) % totalPages);
  }, [totalPages]);

  const prev = useCallback(() => {
    setPage((prev) => (prev - 1 + totalPages) % totalPages);
  }, [totalPages]);

  useEffect(() => {
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [next]);

  const currentPair = testimonials.slice(page * pageSize, page * pageSize + pageSize);

  return (
    <section
      id="testimonials"
      className="fed-section section-glow-right"
      aria-label="What our founders say"
    >
      <div className="fed-container">
        {/* Header Row */}
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
              VOICES
            </div>
            <h2 className="fed-h2">
              What Our <em className="fed-orange-italic">Founders</em> Say
            </h2>
          </div>

          {/* Navigation Arrows */}
          <div className="flex items-center gap-3 shrink-0" style={{ paddingBottom: "0.25rem" }}>
            <button
              className="testimonial-nav-btn"
              onClick={prev}
              aria-label="Previous testimonials"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <button
              className="testimonial-nav-btn"
              onClick={next}
              aria-label="Next testimonials"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        </div>

        {/* 2-at-a-time Grid with Key Transition */}
        <div
          key={page}
          className="testimonial-card-animate"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "2.25rem",
          }}
        >
          {currentPair.map((t) => (
            <blockquote
              key={t.id}
              className="fed-testimonial-card flex flex-col justify-between"
              style={{ padding: "2.5rem" }}
            >
              <div>
                {/* Quote Icon */}
                <div className="text-[#f97316] opacity-80" style={{ marginBottom: "1.5rem" }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9.983 3v7.391c0 5.704-3.731 9.57-8.983 10.609l-.995-2.151c2.432-.917 3.995-3.638 3.995-5.849h-4v-10h9.983zm14.017 0v7.391c0 5.704-3.748 9.57-9 10.609l-.996-2.151c2.433-.917 3.996-3.638 3.996-5.849h-3.983v-10h9.983z" />
                  </svg>
                </div>

                {/* Quote Text */}
                <p
                  className="text-white text-base md:text-lg leading-relaxed font-normal"
                  style={{ marginBottom: "2rem" }}
                >
                  &ldquo;{t.quote}&rdquo;
                </p>
              </div>

              {/* Author Footer */}
              <footer
                className="flex items-center gap-4 border-t border-white/10"
                style={{ paddingTop: "1.5rem", marginTop: "auto" }}
              >
                <div className="speaker-avatar text-sm font-bold">{t.initials}</div>
                <cite className="not-italic">
                  <span className="block text-white font-bold text-base">{t.name}</span>
                  <span className="block text-[#888888] text-xs" style={{ marginTop: "0.2rem" }}>
                    {t.role}
                  </span>
                </cite>
              </footer>
            </blockquote>
          ))}
        </div>

        {/* Page Dots */}
        <div className="testimonial-dots" style={{ marginTop: "3rem" }}>
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              className={`testimonial-dot ${i === page ? "testimonial-dot--active" : ""}`}
              onClick={() => setPage(i)}
              aria-label={`Go to testimonial page ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
