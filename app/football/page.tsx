import Header from "@/components/Header";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Football",
  description: "关于空间、信任与九十分钟的足球笔记。",
};

const footballValues = [
  {
    number: "01",
    tone: "tone-pink",
    title: "先看空间",
    description: "先观察空当、队友与对手，再决定下一步。好的跑位往往发生在拿球之前。",
  },
  {
    number: "02",
    tone: "tone-blue",
    title: "相信队友",
    description: "一次回追、一脚传球、一次主动补位。信任在球场上从来不是抽象词。",
  },
  {
    number: "03",
    tone: "tone-orange",
    title: "留在节奏里",
    description: "比分会变，体力会掉。真正稳定的是注意力，以及完成下一次跑动的意愿。",
  },
] as const;

export default function FootballPage() {
  return (
    <div className="site detail-page">
      <Header />
      <main className="page-frame detail-main">
        <Link href="/#fragments" className="back-link">
          <ArrowLeft size={15} aria-hidden="true" /> 回到碎片
        </Link>

        <section className="detail-hero">
          <div className="detail-block tone-lime detail-title">
            <span className="block-label">足球 · 中场</span>
            <h1>
              我为什么
              <br />
              喜欢踢球。
            </h1>
            <p>
              不是因为它总有漂亮的结果，而是因为场上没有人能独自完成一切。判断、沟通、跑动和信任，会在九十分钟里变得非常诚实。
            </p>
          </div>

          <div className="detail-block tone-night field-visual" aria-hidden="true">
            <div className="field-plane">
              <span className="field-halfway" />
              <span className="field-circle" />
              <span className="field-box field-box-left" />
              <span className="field-box field-box-right" />
              <i className="field-player field-player-one" />
              <i className="field-player field-player-two" />
              <i className="field-player field-player-three" />
              <i className="field-ball" />
              <i className="field-vector" />
            </div>
            <span className="field-caption">先观察，再行动</span>
          </div>
        </section>

        <section className="principles" aria-labelledby="principles-title">
          <h2 id="principles-title" className="section-title">我在场上最在意的三件事。</h2>
          <ol className="principles-list">
            {footballValues.map((value) => (
              <li key={value.title} className={`detail-block ${value.tone}`}>
                <span className="block-label">{value.number}</span>
                <strong>{value.title}</strong>
                <p>{value.description}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="detail-block tone-yellow detail-quote">
          <span className="block-label">下一场</span>
          <blockquote>有失误也没关系，下一次继续跑。</blockquote>
          <Link href="/#listen" className="pill-link">
            回去听歌 <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
        </section>
      </main>
    </div>
  );
}
