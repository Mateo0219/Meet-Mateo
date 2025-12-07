"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";

const navItems = [
  { name: "首页", href: "/" },
  { name: "关于", href: "/#about" },
  { name: "生活", href: "/#lifestyle" },
  { name: "足球队", href: "/football" },
  { name: "朋友圈", href: "/moments" },
  { name: "联系", href: "/#contact" },
] as const;

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      {/* 渐变背景 - 与主页面颜色完美适配 */}
      <div 
        className="w-full"
        style={{
          background: 'linear-gradient(to bottom, rgba(10, 10, 10, 0.95) 0%, rgba(10, 10, 10, 0.75) 30%, rgba(10, 10, 10, 0.5) 60%, rgba(10, 10, 10, 0) 100%)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)'
        }}
      >
        <nav className="max-w-7xl mx-auto px-4 md:px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Logo - 使用极光渐变 */}
            <a
              href="/"
              className="text-xl font-bold text-aurora relative"
            >
              Portfolio
            </a>

            {/* Desktop Navigation - 与主页面文字颜色一致 */}
            <div className="hidden md:flex items-center gap-8">
              {navItems.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="text-white/60 hover:text-white transition-colors relative group"
                >
                  {item.name}
                  {/* 底部指示线 - 使用极光渐变 */}
                  <span className="absolute -bottom-1 left-0 h-0.5 bg-gradient-to-r from-aurora-purple to-aurora-cyan w-0 group-hover:w-full transition-all duration-300" />
                </a>
              ))}
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden text-white/60 hover:text-white transition-colors"
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              aria-label="Toggle menu"
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Mobile Menu - 使用 glass-card 样式 */}
          {isMobileMenuOpen && (
            <div className="md:hidden mt-4">
              <div className="glass-card p-4 space-y-3">
                {navItems.map((item) => (
                  <a
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block text-white/60 hover:text-white transition-colors py-2"
                  >
                    {item.name}
                  </a>
                ))}
              </div>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
