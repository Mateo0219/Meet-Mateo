"use client";

import Image from "next/image";
import { useState } from "react";
import { ArrowUpRight, Github, ImagePlus, Play } from "lucide-react";
import { GITHUB_URL } from "@/lib/os-apps";
import { projects, type Project, type ProjectMedia } from "@/lib/projects";
import { useOS } from "../OSProvider";

function MediaView({ media }: { media: ProjectMedia }) {
  if (media.type === "video") {
    return <video src={media.src} poster={media.poster} controls playsInline preload="none" aria-label={media.label} />;
  }
  return <Image src={media.src} alt={media.alt} width={1536} height={1024} sizes="(max-width: 760px) 100vw, 480px" />;
}

function ProjectCard({ project }: { project: Project }) {
  const { openApp } = useOS();
  const [index, setIndex] = useState(0);
  const current = project.media[index];

  return (
    <article className="project-card">
      <div className="project-art">
        {current ? <MediaView media={current} /> : <div className="project-art-empty"><ImagePlus size={22} strokeWidth={1.5} aria-hidden="true" /><span>录屏和截图整理中</span></div>}
        {project.media.length > 1 && (
          <div className="project-thumbs" role="group" aria-label={`${project.name} 的截图和录屏`}>
            {project.media.map((media, position) => (
              <button key={media.src} type="button" className={position === index ? "is-selected" : undefined} aria-label={`查看第 ${position + 1} 个`} aria-pressed={position === index} onClick={() => setIndex(position)}>
                {media.type === "video" ? <Play size={13} fill="currentColor" aria-hidden="true" /> : position + 1}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="project-copy">
        <span className="project-status"><i /> {project.status}</span>
        <h2>{project.name}</h2>
        <p>{project.tagline}</p>
        <div className="project-tags">{project.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
        <div className="project-actions">
          {project.links.map((link) => link.kind === "external" ? (
            <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer" className={link.primary ? "is-primary" : undefined}>
              {link.label === "GitHub" && <Github size={16} aria-hidden="true" />} {link.label} <ArrowUpRight size={14} aria-hidden="true" />
            </a>
          ) : (
            <button key={link.noteId} type="button" onClick={() => openApp("notes", { payload: link.noteId })}>{link.label}</button>
          ))}
        </div>
      </div>
    </article>
  );
}

export default function ProjectsApp() {
  return (
    <div className="projects-app">
      <div className="projects-intro">
        <span>01 / Vibe Coding</span>
        <h1>把想法做成作品。</h1>
        <p>我不手写代码，用自然语言和 AI 协作，把一个念头做成可以打开、触摸和使用的东西。</p>
      </div>
      <div className="project-list">{projects.map((project) => <ProjectCard key={project.id} project={project} />)}</div>
      <a className="projects-all" href={GITHUB_URL} target="_blank" rel="noopener noreferrer"><Github size={15} aria-hidden="true" /> 在 GitHub 上看全部 <ArrowUpRight size={14} aria-hidden="true" /></a>
    </div>
  );
}
