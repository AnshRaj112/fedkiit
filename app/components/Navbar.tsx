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
  const [visible, setVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setScrolled(currentScrollY > 30);

      if (!mobileOpen) {
        if (currentScrollY <= 15) {
          setVisible(true);
        } else {
          // Disappear when scrolled down, appear when scrolled up
          if (currentScrollY > lastScrollY) {
            setVisible(false);
          } else if (currentScrollY < lastScrollY) {
            setVisible(true);
          }
        }
      }
      setLastScrollY(currentScrollY);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY, mobileOpen]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
    setVisible(true);
  }, [pathname]);

  return (
    <>
      {/* Dynamic Backdrop Blur Overlay */}
      <div
        className={`fixed inset-0 z-40 bg-[#080808]/50 backdrop-blur-md transition-all duration-500 md:hidden ${
          mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
      />

      <header className={`fed-navbar-wrapper ${!visible ? "fed-navbar-wrapper--hidden" : ""}`}>
      <nav
        className={`fed-navbar flex flex-col justify-center ${scrolled ? "fed-navbar--scrolled" : ""
          } ${mobileOpen ? "fed-navbar--dynamic-island" : ""}`}
      >
        {/* Top Navbar Row */}
        <div className="flex items-center justify-between w-full gap-4">
          {/* Brand Logo */}
          <Link
            href="/"
            className="flex items-center gap-3 group shrink-0"
            aria-label="FED KIIT Home"
          >
            <div className="fed-logo-badge group-hover:scale-105 transition-transform duration-300">
              <Image
                src="/fedkiit-mascot.png"
                alt="FED KIIT Logo"
                width={46}
                height={46}
                className="object-cover w-full h-full"
                priority
              />
            </div>
            <span className="fed-logo-text">FED KIIT</span>
          </Link>

          {/* Desktop Nav Links Pill Container */}
          <div className="fed-nav-pill-container">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`fed-nav-link ${isActive ? "fed-nav-link--active" : ""
                    }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Desktop Right Action */}
          <div className="fed-desktop-action items-center gap-3 shrink-0">
            <Link href="/login" className="fed-btn-primary">
              Login
            </Link>
          </div>

          {/* Mobile Hamburger Toggle (Morphs into Close X) */}
          <div className="fed-mobile-toggle items-center">
            <button
              className="hamburger-button"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle mobile navigation menu"
            >
              <div className={`hamburger ${mobileOpen ? "open" : ""}`}>
                <span />
                <span />
                <span />
              </div>
            </button>
          </div>
        </div>

        {/* Dynamic Island Expandable Content (Mobile Only) */}
        <div
          className={`md:hidden overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${mobileOpen
              ? "max-h-[460px] opacity-100 mt-4 pt-5 border-t border-white/10"
              : "max-h-0 opacity-0 mt-0 pt-0 border-t-0 pointer-events-none"
            }`}
        >
          <div className="flex flex-col gap-4 pb-2 mt-8">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`clay-nav-item ${isActive ? "clay-nav-item--active" : ""
                    }`}
                >
                  <span>{link.label}</span>
                  {isActive && (
                    <span
                      className="w-2 h-2 rounded-full bg-[#f97316]"
                      style={{ boxShadow: "0 0 10px #f97316" }}
                    />
                  )}
                </Link>
              );
            })}

            {/* Claymorphic Login Button */}
            <div className="pt-3 mt-2">
              <Link
                href="/login"
                className="fed-btn-primary w-full text-base justify-center py-3"
                style={{
                  borderRadius: "18px",
                  boxShadow: "0 6px 24px rgba(249, 115, 22, 0.4)",
                }}
              >
                Login →
              </Link>
            </div>
          </div>
        </div>
      </nav>
    </header>
    </>
  );
}
