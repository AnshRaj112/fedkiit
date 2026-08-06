"use client";

import { useState } from "react";
import Image from "next/image";

export default function CtaSection() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      setStatus("error");
      setErrorMessage("Please fill out all fields.");
      return;
    }

    setStatus("submitting");
    setErrorMessage("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus("success");
        setFormData({ name: "", email: "", message: "" });
        if (data.mailtoUrl) {
          window.location.href = data.mailtoUrl;
        }
      } else {
        setStatus("error");
        setErrorMessage(data.error || "Failed to send message.");
      }
    } catch {
      setStatus("error");
      setErrorMessage("Network error. Please try again.");
    }
  };

  return (
    <section id="contact" className="fed-section section-glow-left" aria-label="Get in touch with FED">
      <div className="fed-container">
        {/* Section Heading */}
        <div className="text-center" style={{ marginBottom: "4rem" }}>
          <h2
            className="text-white font-extrabold tracking-tight uppercase"
            style={{ fontSize: "clamp(2.2rem, 4.5vw, 3.25rem)" }}
          >
            GET <span className="text-[#f97316] relative inline-block">
              IN
              <span
                className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#f97316] rounded-full"
                style={{ marginBottom: "-4px" }}
              />
            </span> TOUCH
          </h2>
        </div>

        {/* 2-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center max-w-6xl mx-auto">
          {/* Left Column: Enlarged Data Writing Box (7 cols) */}
          <div className="lg:col-span-7">
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              {/* Name Input */}
              <div>
                <input
                  type="text"
                  placeholder="Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-[#181818] border border-white/14 rounded-2xl px-6 py-4.5 text-white placeholder-[#888888] text-lg focus:outline-none focus:border-[#f97316] focus:ring-1 focus:ring-[#f97316] transition-all shadow-inner"
                  style={{ minHeight: "60px" }}
                  required
                />
              </div>

              {/* Email Input */}
              <div>
                <input
                  type="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-[#181818] border border-white/14 rounded-2xl px-6 py-4.5 text-white placeholder-[#888888] text-lg focus:outline-none focus:border-[#f97316] focus:ring-1 focus:ring-[#f97316] transition-all shadow-inner"
                  style={{ minHeight: "60px" }}
                  required
                />
              </div>

              {/* Message Input (Enlarged Textarea) */}
              <div>
                <textarea
                  rows={6}
                  placeholder="Message"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full bg-[#181818] border border-white/14 rounded-2xl px-6 py-5 text-white placeholder-[#888888] text-lg focus:outline-none focus:border-[#f97316] focus:ring-1 focus:ring-[#f97316] transition-all resize-none shadow-inner"
                  style={{ minHeight: "180px" }}
                  required
                />
              </div>

              {/* Status Notifications */}
              {status === "error" && (
                <p className="text-red-400 text-sm font-medium">{errorMessage}</p>
              )}
              {status === "success" && (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm font-semibold text-center">
                  ✅ Message sent to FED successfully!
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={status === "submitting"}
                className="w-full py-4.5 px-8 rounded-2xl font-bold text-white text-lg transition-all duration-200 shadow-xl cursor-pointer"
                style={{
                  background: "linear-gradient(90deg, #d97706 0%, #ea580c 50%, #f97316 100%)",
                  boxShadow: "0 8px 30px rgba(249, 115, 22, 0.45)",
                  opacity: status === "submitting" ? 0.7 : 1,
                  minHeight: "60px",
                }}
              >
                {status === "submitting" ? "Sending to FED..." : "Submit"}
              </button>
            </form>
          </div>

          {/* Right Column: Floating Transparent Envelope & Pen (5 cols) */}
          <div className="lg:col-span-5 flex justify-center items-center">
            <div className="relative w-full max-w-md aspect-square flex items-center justify-center pointer-events-none">
              <Image
                src="/to-fed-envelope-transparent.png"
                alt="To FED Mail Envelope & Pen"
                width={550}
                height={550}
                className="object-contain w-full h-full scale-110 drop-shadow-[0_20px_50px_rgba(249,115,22,0.3)]"
                priority
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
