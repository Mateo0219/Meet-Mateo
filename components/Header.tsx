"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Github, Menu, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

const navItems = [
  { name: "Mateo OS", href: "/", path: "/" },
  { name: "足球", href: "/football", path: "/football" },
  { name: "朋友圈", href: "/#moments", path: "/moments" },
] as const;

export default function Header() {
  const pathname = usePathname();
  const prefersReducedMotion = useReducedMotion();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsMobileMenuOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => setIsMobileMenuOpen(false), [pathname]);


  const activeName = navItems.find((item) => item.path === pathname)?.name;

  return (
    <header className="global-header">
      <nav className="page-frame nav-bar" aria-label="主导航">
        <Link href="/" className="site-mark" aria-label="Mateo 首页">
          <span className="brand-glyph" aria-hidden="true">M</span>
          <span className="brand-name">Mateo</span>
        </Link>

        <div className="nav-capsule">
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={activeName === item.name ? "is-active" : undefined}
              aria-current={activeName === item.name ? "page" : undefined}
            >
              {activeName === item.name && (
                <motion.span layoutId="nav-indicator" className="nav-indicator" transition={{ type: "spring", stiffness: 420, damping: 34 }} />
              )}
              <span>{item.name}</span>
            </Link>
          ))}
        </div>

        <a href="https://github.com/mateo0219" target="_blank" rel="noopener noreferrer" className="nav-contact" aria-label="GitHub">
          <Github size={16} aria-hidden="true" />
        </a>

        <button
          type="button"
          className="menu-button"
          onClick={() => setIsMobileMenuOpen((open) => !open)}
          aria-label={isMobileMenuOpen ? "关闭导航" : "打开导航"}
          aria-expanded={isMobileMenuOpen}
          aria-controls="mobile-navigation"
        >
          {isMobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </nav>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            id="mobile-navigation"
            className="mobile-nav-wrap"
            style={{ transformOrigin: "top right" }}
            initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.96 }}
            transition={prefersReducedMotion ? { duration: 0.12 } : { type: "spring", stiffness: 420, damping: 32 }}
          >
            <nav className="mobile-nav" aria-label="移动导航">
              {navItems.map((item, index) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={activeName === item.name ? "is-active" : undefined}
                  aria-current={activeName === item.name ? "page" : undefined}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <span>0{index + 1}</span>
                  <strong>{item.name}</strong>
                  <ArrowUpRight size={16} aria-hidden="true" />
                </Link>
              ))}
              <a href="https://github.com/mateo0219" target="_blank" rel="noopener noreferrer">
                <span>04</span>
                <strong>GitHub</strong>
                <ArrowUpRight size={16} aria-hidden="true" />
              </a>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
