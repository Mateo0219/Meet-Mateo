import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./os.css";
import "./space.css";

export const metadata: Metadata = {
  title: {
    default: "Mateo Jiang",
    template: "%s — Mateo Jiang",
  },
  description: "Mateo OS：一个持续生长的个人空间。在上海写代码、打乒乓球、听歌。",
  openGraph: {
    title: "Mateo Jiang",
    description: "代码与产品、乒乓球、音乐、生活碎片。欢迎来到 Mateo 的个人空间。",
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
