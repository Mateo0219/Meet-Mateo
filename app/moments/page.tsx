import Header from "@/components/Header";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Moments",
  description: "等待真正值得留下的照片与文字。",
};

export default function MomentsPage() {
  return (
    <div className="site detail-page">
      <Header />
      <main className="page-frame detail-main">
        <Link href="/#fragments" className="back-link">
          <ArrowLeft size={15} aria-hidden="true" /> 回到碎片
        </Link>

        <section className="detail-block tone-lavender archive-block">
          <span className="block-label">记录</span>
          <h1>
            这里暂时
            <br />
            还是空的。
          </h1>
          <p>等遇到想留下来的照片和文字，再从这里开始更新。不赶时间。</p>
          <div className="archive-stickers" aria-hidden="true">
            <span className="sticker-static tone-orange" style={{ rotate: "-8deg" }}>慢慢来</span>
            <span className="sticker-static tone-yellow" style={{ rotate: "6deg" }}>上海</span>
            <span className="sticker-static tone-lime" style={{ rotate: "-3deg" }}>2026</span>
          </div>
        </section>
      </main>
    </div>
  );
}
