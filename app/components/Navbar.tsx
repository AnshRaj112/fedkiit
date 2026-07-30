"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/events", label: "Events" },
  { href: "/team", label: "Team" },
  { href: "/insights", label: "Insights" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 30);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <header className="fed-navbar-wrapper">
        <nav
          className={`fed-navbar flex items-center justify-between gap-4 ${
            scrolled ? "fed-navbar--scrolled" : ""
          }`}
        >
          {/* Left: Brand Logo */}
          <Link
            href="/"
            className="flex items-center gap-2.5 group shrink-0"
            aria-label="FED KIIT Home"
          >
            <div className="fed-logo-badge group-hover:scale-105 transition-transform duration-300">
              <Image
                src="/fedkiit-mascot.png"
                alt="FED KIIT Logo"
                width={32}
                height={32}
                className="object-cover rounded-md"
                priority
              />
            </div>
            <span className="fed-logo-text">FED KIIT</span>
          </Link>

          {/* Center: Desktop Nav Links Pill Container */}
          <div className="hidden md:flex items-center fed-nav-pill-container">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`fed-nav-link ${
                    isActive ? "fed-nav-link--active" : ""
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Right: Actions */}
          <div className="hidden md:flex items-center gap-3 shrink-0">
            <Link href="/login" className="fed-btn-primary">
              Login
            </Link>
          </div>

          {/* Mobile Hamburger Toggle */}
          <div className="flex md:hidden items-center">
            <button
              className="hamburger-button"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle mobile menu"
            >
              <div className={`hamburger ${mobileOpen ? "open" : ""}`}>
                <span />
                <span />
                <span />
              </div>
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile Drawer */}
      <div
        className={`fixed inset-0 z-40 md:hidden transition-all duration-300 ${
          mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Dark Overlay */}
        <div
          className="absolute inset-0 bg-black/75 backdrop-blur-md"
          onClick={() => setMobileOpen(false)}
        />

        {/* Drawer Panel */}
        <div
          className={`absolute top-20 left-4 right-4 bg-[#111111] border border-white/10 rounded-2xl p-6 shadow-2xl transition-all duration-300 ${
            mobileOpen ? "scale-100 translate-y-0" : "scale-95 -translate-y-4"
          }`}
        >
          <div className="flex flex-col gap-2">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`fed-nav-link text-base py-3 px-4 rounded-xl ${
                    isActive
                      ? "bg-white/10 text-white font-semibold"
                      : "text-[#aaa] hover:bg-white/5 hover:text-white"
                  }`}
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
              );
            })}
            <div className="border-t border-white/10 pt-4 mt-2">
              <Link
                href="/login"
                className="fed-btn-primary w-full justify-center py-3 text-base"
                onClick={() => setMobileOpen(false)}
              >
                Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
