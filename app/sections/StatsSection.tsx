const stats = [
  { value: "500+", label: "Founders Nurtured" },
  { value: "40+",  label: "Events Hosted" },
  { value: "15+",  label: "Partner Startups" },
  { value: "3+",   label: "Years of Impact" },
];

export default function StatsSection() {
  return (
    <section
      id="stats"
      className="py-12 md:py-16 relative z-10 section-glow-left overflow-hidden"
      aria-label="Impact statistics"
    >
      <div className="fed-container" style={{ position: "relative", zIndex: 1 }}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {stats.map((stat) => (
            <div key={stat.label} className="fed-stat-card">
              <h3>{stat.value}</h3>
              <p>{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
