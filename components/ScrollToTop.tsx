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
      document.addEventListener("DOMContentLoaded", scrollToTop, { once: true });
    } else {
      scrollToTop();
    }

    // 页面完全加载后再次确保
    window.addEventListener("load", scrollToTop, { once: true });

    // 注意：DOMContentLoaded 和 load 事件使用 { once: true } 选项，不需要手动移除
    // 但为了代码清晰，我们仍然在清理函数中移除（虽然实际上不会执行）
    return () => {
      // 这些事件监听器使用 { once: true }，会自动移除，但保留清理函数以确保代码清晰
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

