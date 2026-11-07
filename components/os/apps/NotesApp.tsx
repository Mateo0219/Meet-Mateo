"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, ChevronLeft, Search } from "lucide-react";
import { noteById, notes, type Note } from "@/lib/notes";

const folders: Note["folder"][] = ["关于", "运动", "这台电脑"];

export default function NotesApp({ payload, navigationId, compact = false }: { payload?: string; navigationId: number; compact?: boolean }) {
  const [selectedId, setSelectedId] = useState(payload && noteById[payload] ? payload : "about");
  const [query, setQuery] = useState("");
  const [showList, setShowList] = useState(compact && !payload);

  useEffect(() => {
    if (payload && noteById[payload]) {
      setSelectedId(payload);
      setShowList(false);
    }
  }, [payload, navigationId]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return notes;
    return notes.filter((note) => [note.title, note.preview, ...note.blocks.map((block) => ("text" in block ? block.text : block.items.map((item) => `${item.title}${item.text}`).join("")))].join(" ").toLowerCase().includes(term));
  }, [query]);

  const note = noteById[selectedId] ?? notes[0];

  return (
    <div className={`notes-app${compact ? " is-compact" : ""}${showList ? " show-list" : ""}`}>
      <aside className="notes-sidebar" aria-label="备忘录列表">
        <label className="notes-search">
          <Search size={14} aria-hidden="true" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索" aria-label="搜索备忘录" />
        </label>
        <div className="notes-list">
          {folders.map((folder) => {
            const inFolder = filtered.filter((item) => item.folder === folder);
            if (!inFolder.length) return null;
            return (
              <section key={folder}>
                <h3>{folder}</h3>
                {inFolder.map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    className={item.id === note.id ? "is-selected" : undefined}
                    aria-current={item.id === note.id ? "true" : undefined}
                    onClick={() => {
                      setSelectedId(item.id);
                      setShowList(false);
                    }}
                  >
                    <strong>{item.title}</strong>
                    <span>{item.preview}</span>
                  </button>
                ))}
              </section>
            );
          })}
          {!filtered.length && <p className="notes-empty">没有找到「{query}」</p>}
        </div>
      </aside>

      <article className="notes-document">
        {compact && (
          <button type="button" className="notes-back" onClick={() => setShowList(true)}>
            <ChevronLeft size={18} aria-hidden="true" /> 备忘录
          </button>
        )}
        <span className="notes-folder">{note.folder}</span>
        <h1>{note.title}</h1>
        {note.blocks.map((block, index) => {
          if (block.type === "h") return <h2 key={index}>{block.text}</h2>;
          if (block.type === "quote") return <blockquote key={index}>{block.text}</blockquote>;
          if (block.type === "list") {
            return (
              <ul key={index}>
                {block.items.map((item) => (
                  <li key={item.title}>
                    <strong>{item.title}</strong>
                    <span>{item.text}</span>
                  </li>
                ))}
              </ul>
            );
          }
          return <p key={index}>{block.text}</p>;
        })}
        {note.link &&
          (note.link.href.startsWith("/") ? (
            <Link href={note.link.href} className="notes-link">
              {note.link.label} <ArrowUpRight size={15} aria-hidden="true" />
            </Link>
          ) : (
            <a href={note.link.href} className="notes-link" target="_blank" rel="noopener noreferrer">
              {note.link.label} <ArrowUpRight size={15} aria-hidden="true" />
            </a>
          ))}
      </article>
    </div>
  );
}
