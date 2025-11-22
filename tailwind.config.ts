import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Apple 风格的深色调色板
        glass: {
          dark: "rgba(0, 0, 0, 0.4)",
          light: "rgba(255, 255, 255, 0.05)",
        },
        // 极光渐变色彩
        aurora: {
          purple: "#8B5CF6",
          blue: "#3B82F6",
          cyan: "#06B6D4",
          pink: "#EC4899",
        },
      },
      backgroundImage: {
        // 动态渐变网格背景
        "gradient-mesh": "radial-gradient(at 0% 0%, rgba(139, 92, 246, 0.15) 0px, transparent 50%), radial-gradient(at 100% 0%, rgba(59, 130, 246, 0.15) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(6, 182, 212, 0.15) 0px, transparent 50%), radial-gradient(at 0% 100%, rgba(236, 72, 153, 0.15) 0px, transparent 50%)",
        // 噪点纹理
        "noise": "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.03'/%3E%3C/svg%3E\")",
      },
      animation: {
        // 缓慢旋转动画（用于背景渐变）
        "slow-spin": "spin 20s linear infinite",
        // 渐变移动动画
        "gradient-move": "gradient 15s ease infinite",
        // 淡入动画
        "fade-in": "fadeIn 0.6s ease-out",
        // 滑入动画
        "slide-up": "slideUp 0.6s ease-out",
      },
      keyframes: {
        gradient: {
          "0%, 100%": {
            "background-position": "0% 50%",
          },
          "50%": {
            "background-position": "100% 50%",
          },
        },
        fadeIn: {
          "0%": {
            opacity: "0",
          },
          "100%": {
            opacity: "1",
          },
        },
        slideUp: {
          "0%": {
            opacity: "0",
            transform: "translateY(20px)",
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0)",
          },
        },
      },
      backdropBlur: {
        xs: "2px",
      },
      boxShadow: {
        // 内发光效果
        "inner-glow": "inset 0 0 20px rgba(255, 255, 255, 0.05)",
        // 外发光效果
        "outer-glow": "0 0 30px rgba(139, 92, 246, 0.2)",
      },
    },
  },
  plugins: [],
};

export default config;

