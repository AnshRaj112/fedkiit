const testimonials = [
  {
    id: "aditi",
    quote:
      "FED gave me the runway to launch my first product before graduating.",
    name: "Aditi K.",
    role: "Founder, Palette (YC W24)",
  },
  {
    id: "rohan",
    quote:
      "The mentor network here is unreal — I closed my seed round through a FED intro.",
    name: "Rohan G.",
    role: "CEO, Wispr Labs",
  },
  {
    id: "priya",
    quote:
      "Being part of FED transformed my mindset from a student to a builder. Invaluable.",
    name: "Priya M.",
    role: "Co-founder, NexaFlow",
  },
  {
    id: "arjun",
    quote:
      "FED's hackathons are where I met my co-founder. The community is everything.",
    name: "Arjun S.",
    role: "CTO, BuildStack",
  },
];

export default function TestimonialsSection() {
  return (
    <section
      id="testimonials"
      className="fed-section"
      aria-label="What our founders say"
    >
      <div className="fed-container">
        {/* Header */}
        <div className="mb-12">
          <div className="fed-label mb-3 inline-flex">
            <span className="fed-label-dot" />
            VOICES
          </div>
          <h2 className="fed-h2">
            What Our <em className="fed-orange-italic">Founders</em> Say
          </h2>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {testimonials.map((t) => (
            <blockquote key={t.id} className="fed-testimonial-card flex flex-col justify-between">
              <p className="text-white text-base md:text-lg leading-relaxed mb-6 font-normal">
                &ldquo;{t.quote}&rdquo;
              </p>
              <footer className="border-t border-white/5 pt-4 mt-auto">
                <cite className="not-italic">
                  <span className="block text-white font-bold text-sm">{t.name}</span>
                  <span className="block text-[#888888] text-xs mt-0.5">{t.role}</span>
                </cite>
              </footer>
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}
