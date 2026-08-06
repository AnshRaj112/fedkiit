"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/Events", label: "Events" },
  { href: "/Team", label: "Team" },
  { href: "/Blog", label: "Insights" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [visible, setVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  const checkIsActive = (linkHref: string) => {
    if (!pathname) return false;
    if (linkHref === "/") {
      return pathname === "/";
    }
    const cleanPath = pathname.toLowerCase();
    const cleanHref = linkHref.toLowerCase();

    if (cleanHref === "/blog" && (cleanPath.startsWith("/blog") || cleanPath.startsWith("/social") || cleanPath.startsWith("/insights"))) {
      return true;
    }
    return cleanPath === cleanHref || cleanPath.startsWith(`${cleanHref}/`) || cleanPath.startsWith(cleanHref);
  };

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Step 1: Elongate navbar after scrolling past 40px
      setScrolled(currentScrollY > 40);

      if (!mobileOpen) {
        // Step 2: Keep visible while in top zone (<= 220px) so elongation is clearly shown
        if (currentScrollY <= 220) {
          setVisible(true);
        } else {
          // Disappear when scrolling down past 220px, appear when scrolling up
          if (currentScrollY > lastScrollY + 4) {
            setVisible(false);
          } else if (currentScrollY < lastScrollY - 4) {
            setVisible(true);
          }
        }
      }
      setLastScrollY(currentScrollY);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY, mobileOpen]);

  // Close the mobile menu on route change.
  //
  // Adjusted during render rather than in an effect: setting state
  // synchronously inside an effect triggers a second render pass, which the
  // project's lint config rejects as an error. This is React's documented
  // pattern for resetting state when a prop changes.
  const [lastPathname, setLastPathname] = useState(pathname);
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setMobileOpen(false);
    setVisible(true);
  }

  return (
    <>
      {/* Dynamic Backdrop Blur Overlay (Mobile) */}
      <div
        className={`fed-mobile-backdrop ${mobileOpen ? "fed-mobile-backdrop--open" : ""}`}
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
      />

      <header className={`fed-navbar-wrapper ${!visible ? "fed-navbar-wrapper--hidden" : ""}`}>
        <nav
          className={`fed-navbar ${scrolled ? "fed-navbar--scrolled" : ""} ${mobileOpen ? "fed-navbar--dynamic-island" : ""
            }`}
        >
          {/* Top Navbar Row */}
          <div className="fed-navbar-row">
            {/* Brand Logo */}
            <Link href="/" className="fed-brand-link" aria-label="FED KIIT Home">
              <div className="fed-logo-badge">
                <Image
                  src="/fedkiit-logo.png"
                  alt="FED KIIT Logo"
                  width={40}
                  height={40}
                  className="fed-logo-img"
                  priority
                />
              </div>
              <span className="fed-logo-text">FED KIIT</span>
            </Link>

            {/* Desktop Nav Links Pill Container */}
            <div className="fed-nav-pill-container">
              {navLinks.map((link) => {
                const isActive = checkIsActive(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`fed-nav-link ${isActive ? "fed-nav-link--active" : ""}`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>

            {/* Desktop Right Action */}
            <div className="fed-desktop-action">
              <Link href="/login" className="fed-btn-orange">
                Login
              </Link>
            </div>

            {/* Mobile Hamburger Toggle */}
            <div className="fed-mobile-toggle">
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
            className={`fed-mobile-menu-container ${mobileOpen ? "fed-mobile-menu--open" : "fed-mobile-menu--closed"
              }`}
          >
            <div className="fed-mobile-menu-list">
              {navLinks.map((link) => {
                const isActive = checkIsActive(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`clay-nav-item ${isActive ? "clay-nav-item--active" : ""}`}
                  >
                    <span>{link.label}</span>
                  </Link>
                );
              })}

              <div className="fed-mobile-login-wrapper">
                <Link href="/login" className="fed-btn-orange fed-btn-orange--full">
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
