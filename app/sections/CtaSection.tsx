import Link from "next/link";

export default function CtaSection() {
  return (
    <section id="cta" className="fed-section" aria-label="Call to action – join FED KIIT">
      <div className="fed-container">
        <div className="fed-cta-banner">
          <h2 className="fed-h2 mb-4">Ready to build something great?</h2>
          <p className="text-[#a0a0a0] text-base max-w-lg mx-auto mb-8">
            Join the next cohort of founders. Applications for the FED
            Fellowship close on Aug 30.
          </p>
          <Link href="/login" className="fed-btn-primary py-3.5 px-8 text-base font-bold">
            Get Started →
          </Link>
        </div>
      </div>
    </section>
  );
}
