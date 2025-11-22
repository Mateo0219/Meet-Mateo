"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function ScrollToTop() {
  const pathname = usePathname();

  useEffect(() => {
    // 禁用浏览器的自动滚动恢复功能（防止浏览器记住滚动位置）
    if (typeof window !== "undefined" && "scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    // 页面加载时立即滚动到顶部
    window.scrollTo(0, 0);

    // 确保在各种情况下都滚动到顶部
    const scrollToTop = () => {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: "instant",
      });
    };

    // 立即执行
    scrollToTop();

    // DOM 加载完成后再次确保在顶部
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", scrollToTop);
    } else {
      scrollToTop();
    }

    // 页面完全加载后再次确保
    window.addEventListener("load", scrollToTop);

    return () => {
      document.removeEventListener("DOMContentLoaded", scrollToTop);
      window.removeEventListener("load", scrollToTop);
    };
  }, []);

  useEffect(() => {
    // 每次路由变化时，滚动到顶部
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "instant",
    });
  }, [pathname]);

  return null;
}

