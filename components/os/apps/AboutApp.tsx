"use client";

/* eslint-disable @next/next/no-img-element -- small local SVG avatar, no optimisation needed */

import { AVATAR_SRC, GITHUB_URL } from "@/lib/os-apps";
import { useOS } from "../OSProvider";

/** "About This Mac", for a person. The spec sheet is playful copy — edit freely. */
export default function AboutApp() {
  const { isNight, openApp } = useOS();
  const specs = [
    ["位置", "北京"],
    ["处理器", "好奇心"],
    ["内存", "一整个歌单"],
    ["显示器", `手绘小岛 · 现在是${isNight ? "深色" : "浅色"}`],
    ["启动磁盘", "Meet-Mateo"],
  ];

  return (
    <div className="about-app">
      <img src={AVATAR_SRC} alt="" className="about-avatar" width={132} height={154} />
      <div className="about-copy">
        <h2>Mateo</h2>
        <span className="about-version">Mateo 岛 · 北京</span>
        <dl>
          {specs.map(([term, value]) => (
            <div key={term}>
              <dt>{term}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
        <div className="about-actions">
          <button type="button" onClick={() => openApp("notes", { payload: "about" })}>更多信息…</button>
          <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">GitHub</a>
        </div>
      </div>
    </div>
  );
}
