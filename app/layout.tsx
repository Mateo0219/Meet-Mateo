import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./os.css";
import "./space.css";
import "./apps.css";

export const metadata: Metadata = {
  title: {
    default: "Mateo Jiang",
    template: "%s — Mateo Jiang",
  },
  description: "Mateo OS：一个持续生长的个人空间。在北京 vibe coding、打乒乓球、听歌。",
  openGraph: {
    title: "Mateo Jiang",
    description: "Vibe Coding、乒乓球、生活碎片。欢迎来到 Mateo 的个人空间。",
    type: "website",
    locale: "zh_CN",
  },
};

export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: "#f4efeb",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
