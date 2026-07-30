"use client";

import { useState, useEffect, useRef, useContext } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { MdOutlineLogout } from "react-icons/md";

import AuthContext from "../../context/AuthContext";
import styles from "./styles/Navbar.module.scss";
import logo from "../../assets/images/Logo/logo.svg";
import defaultImg from "../../assets/images/defaultImg.jpg";

/**
 * Navbar — ported 1:1 from FED-Frontend/src/layouts/Navbar/Navbar.jsx.
 *
 * Markup, class names and the SCSS module are unchanged. Only the router is
 * swapped: `NavLink`/`useLocation`/`useNavigate` become `Link`/`usePathname`/
 * `useRouter`, and `windowWidth` starts at 0 instead of reading `window` during
 * render (which throws on the server).
 */
const Navbar = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [navbarHeight, setNavbarHeight] = useState("90px");
  const [windowWidth, setWindowWidth] = useState(0);
  const [activeLink, setActiveLink] = useState("/");
  const lastScrollY = useRef(0);
  const authCtx = useContext(AuthContext);
  const pathname = usePathname();
  const router = useRouter();
  const isOmegaActive = activeLink === "/omega";

  useEffect(() => {
    if (isOmegaActive) {
      document.body.style.backgroundColor = "#000000";
    } else {
      document.body.style.backgroundColor = "";
    }
    return () => {
      document.body.style.backgroundColor = "";
    };
  }, [isOmegaActive]);

  useEffect(() => {
    const SCROLL_THRESHOLD = 5;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (Math.abs(currentScrollY - lastScrollY.current) > SCROLL_THRESHOLD) {
        if (currentScrollY === 0) {
          setIsVisible(true);
        } else if (currentScrollY > lastScrollY.current) {
          setIsVisible(false);
        } else {
          setIsVisible(true);
        }
        lastScrollY.current = currentScrollY;
      }
    };

    const forceNavbarVisible = () => {
      if (window.scrollY === 0) setIsVisible(true);
    };

    const handleResize = () => setWindowWidth(window.innerWidth);

    const handleNavbarBlur = () => {
      const navbarElements = document.getElementsByClassName(styles.navbar!);
      const blurValue = window.scrollY > 0 ? "blur(20px)" : "none";
      Array.from(navbarElements).forEach((element) => {
        (element as HTMLElement).style.backdropFilter = blurValue;
      });
    };

    handleResize();

    window.addEventListener("scroll", handleScroll);
    window.addEventListener("scroll", forceNavbarVisible);
    window.addEventListener("scroll", handleNavbarBlur);
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("scroll", forceNavbarVisible);
      window.removeEventListener("scroll", handleNavbarBlur);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    let currentPath = pathname;
    if (/\/omega/i.test(currentPath)) {
      currentPath = "/omega";
    }
    setActiveLink(currentPath);
  }, [pathname]);

  const toggleMobileMenu = () => {
    setIsMobile(!isMobile);
    setNavbarHeight(!isMobile ? "500vw" : "90px");
  };

  const closeMobileMenu = () => {
    setIsMobile(false);
    setNavbarHeight("90px");
  };

  const handleLogout = () => {
    authCtx.logout();
    router.push("/");
    closeMobileMenu();
  };

  // Route matching is case-insensitive so the original capitalised links
  // (/Events, /Team …) and the canonical lowercase URLs both highlight.
  const isActive = (path: string) =>
    activeLink.toLowerCase() === path.toLowerCase();

  return (
    <nav
      className={`${styles.navbar} ${
        isVisible ? styles.visible : styles.hidden
      }`}
    >
      <div className={styles.navbarContent} style={{ height: navbarHeight }}>
        <div className={styles.mobNav}>
          <div
            className={`${styles.menuToggle} ${isMobile ? styles.active : ""}`}
            onClick={toggleMobileMenu}
          >
            {isMobile ? (
              <div className={styles.cross}>
                <div className={styles.crossBar}></div>
                <div className={styles.crossBar}></div>
              </div>
            ) : (
              <>
                <div className={styles.bar}></div>
                <div className={styles.bar}></div>
                <div className={styles.bar}></div>
              </>
            )}
          </div>
          <Link href="/">
            <div className={styles.logo_text}></div>
          </Link>
        </div>

        <ul
          className={`${styles.navLinks} ${isMobile ? styles.active : ""} ${
            authCtx.isLoggedIn ? styles.loggedIn : ""
          }`}
        >
          {authCtx.isLoggedIn && windowWidth <= 768 && windowWidth > 0 && (
            <Link href="/profile" className="LinkStyle" onClick={closeMobileMenu}>
              <div className={styles.profileImgdiv}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={authCtx.user.img || defaultImg.src}
                  alt="Profile"
                  className={styles.profileImg}
                />
              </div>
            </Link>
          )}

          <Link href="/" className={styles.logoLink} onClick={closeMobileMenu}>
            <div className={styles.logo_div}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={logo.src} alt="Logo" className={styles.logo} />
              <div className={styles.logo_text}></div>
            </div>
          </Link>

          <div className={styles.navItems}>
            <li>
              <Link
                href="/"
                className={`${styles.link} ${
                  activeLink === "/" ? styles.activeLink : ""
                } ${isOmegaActive ? styles.omegaHover : ""}`}
                onClick={closeMobileMenu}
              >
                Home
              </Link>
            </li>
            <li>
              <Link
                href="/Events"
                className={`${styles.link} ${
                  isActive("/events") ? styles.activeLink : ""
                } ${isOmegaActive ? styles.omegaHover : ""}`}
                onClick={closeMobileMenu}
              >
                Event
              </Link>
            </li>
            <li>
              <Link
                href="/Social"
                className={`${styles.link} ${
                  isActive("/social") ? styles.activeLink : ""
                } ${isOmegaActive ? styles.omegaHover : ""}`}
                onClick={closeMobileMenu}
              >
                Social
              </Link>
            </li>
            <li>
              <Link
                href="/Team"
                className={`${styles.link} ${
                  isActive("/team") ? styles.activeLink : ""
                } ${isOmegaActive ? styles.omegaHover : ""}`}
                onClick={closeMobileMenu}
              >
                Team
              </Link>
            </li>
            <li>
              <Link
                href="/Blog"
                className={`${styles.link} ${
                  isActive("/blog") ? styles.activeLink : ""
                }`}
                onClick={closeMobileMenu}
              >
                Blogs
              </Link>
            </li>
          </div>

          {authCtx.isLoggedIn ? (
            windowWidth <= 768 && windowWidth > 0 ? (
              <button
                className={`${styles.authButton} ${
                  isOmegaActive ? styles.omegaButton : ""
                }`}
                onClick={handleLogout}
              >
                Logout <MdOutlineLogout size={25} />
              </button>
            ) : (
              <Link
                href="/profile"
                className="LinkStyle"
                onClick={closeMobileMenu}
              >
                <div className={styles.profileImgdiv}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={authCtx.user.img || defaultImg.src}
                    alt="Profile"
                    className={styles.profileImg}
                  />
                </div>
              </Link>
            )
          ) : (
            <Link href="/Login" onClick={closeMobileMenu}>
              <button
                className={`${styles.authButton} ${
                  isOmegaActive ? styles.omegaButton : ""
                }`}
              >
                Login
              </button>
            </Link>
          )}
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
