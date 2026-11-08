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
  description: "Mateo 岛：今天换你来当 Mateo。一座可以走进去逛的小岛。",
  openGraph: {
    title: "Mateo Jiang",
    description: "Vibe Coding、乒乓球、生活碎片。欢迎来到 Mateo 岛。",
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
