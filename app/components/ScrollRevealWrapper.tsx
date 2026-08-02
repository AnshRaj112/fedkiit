"use client";

import { useEffect, useRef, useState } from "react";

interface ScrollRevealWrapperProps {
  children: React.ReactNode;
  instant?: boolean;
}

export default function ScrollRevealWrapper({ children, instant = false }: ScrollRevealWrapperProps) {
  const domRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(instant);

  useEffect(() => {
    if (instant) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      {
        threshold: 0.05,
        rootMargin: "-6% 0px -6% 0px",
      }
    );

    const current = domRef.current;
    if (current) observer.observe(current);

    return () => {
      if (current) observer.unobserve(current);
    };
  }, [instant]);

  return (
    <div
      ref={domRef}
      className={`transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] transform will-change-[transform,opacity,filter] ${
        isVisible
          ? "opacity-100 translate-y-0 scale-100 filter blur-0"
          : "opacity-0 translate-y-16 scale-[0.97] filter blur-[4px]"
      }`}
    >
      {children}
    </div>
  );
}
