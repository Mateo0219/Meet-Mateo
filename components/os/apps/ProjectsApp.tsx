"use client";

import Image from "next/image";
import { ArrowUpRight, Code2, Github } from "lucide-react";
import { PROJECT_URL } from "@/lib/os-apps";
import { useOS } from "../OSProvider";

export default function ProjectsApp() {
  const { openApp } = useOS();
  return <div className="projects-app">
    <div className="projects-intro"><span>01 / 代码与产品</span><h1>把想法做成作品。</h1><p>从一个念头，到一个可以打开、触摸和使用的界面。</p></div>
    <article className="project-card">
      <div className="project-art"><Image src="/scenes/work.webp" alt="Mateo OS 工作台场景" width={1536} height={1024} sizes="(max-width: 760px) 100vw, 700px" /></div>
      <div className="project-copy"><div><span className="project-status"><i /> 持续迭代</span><h2>Mateo OS</h2><p>把代码、音乐和日常，收进一个可以探索的个人空间。</p></div><div className="project-tags"><span>Next.js</span><span>TypeScript</span><span>Motion</span></div><div className="project-actions"><a href={PROJECT_URL} target="_blank" rel="noopener noreferrer"><Github size={16} /> 查看源码 <ArrowUpRight size={14} /></a><button type="button" onClick={() => openApp("notes", { payload: "site" })}><Code2 size={16} /> 关于这个网站</button></div></div>
    </article>
    <p className="projects-footnote">下一件作品，从下一个想法开始。</p>
  </div>;
}
