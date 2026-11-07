"use client";

import { memo, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Play, Search, X } from "lucide-react";

interface PlaylistPickerProps {
  tracks: readonly { id: string; name: string; artist: string }[];
  currentIndex: number;
  onSelect: (index: number) => void;
  onClose: () => void;
}

const PAGE_SIZE = 50;

function PlaylistPicker({ tracks, currentIndex, onSelect, onClose }: PlaylistPickerProps) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(() => Math.floor(currentIndex / PAGE_SIZE));
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const results = useMemo(() => {
    const terms = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
    return tracks.flatMap((track, index) => {
      const text = `${track.name} ${track.artist}`.toLocaleLowerCase();
      return terms.every(term => text.includes(term)) ? [{ track, index }] : [];
    });
  }, [query, tracks]);
  const pages = Math.max(1, Math.ceil(results.length / PAGE_SIZE));
  const activePage = Math.min(page, pages - 1);
  const visible = results.slice(activePage * PAGE_SIZE, (activePage + 1) * PAGE_SIZE);

  useEffect(() => { inputRef.current?.focus({ preventScroll: true }); }, []);
  useEffect(() => { scrollRef.current?.scrollTo({ top: 0, behavior: "instant" }); }, [activePage, query]);

  return (
    <section className="playlist-picker" id="music-playlist-picker" aria-label="歌单选歌" onKeyDown={event => {
      if (event.key === "Escape") { event.stopPropagation(); onClose(); }
    }}>
      <div className="playlist-picker-heading">
        <div><span>YOUR COLLECTION</span><h3>选一首，继续听。</h3></div>
        <button type="button" className="playlist-back" onClick={onClose}><ArrowLeft size={15} /> 返回播放</button>
      </div>
      <div className="playlist-search">
        <Search size={17} aria-hidden="true" />
        <input ref={inputRef} type="search" value={query} onChange={event => { setQuery(event.target.value); setPage(0); }} placeholder="搜索歌名或歌手" aria-label="搜索歌名或歌手" />
        {query && <button type="button" aria-label="清空搜索" onClick={() => { setQuery(""); setPage(0); inputRef.current?.focus({ preventScroll: true }); }}><X size={16} /></button>}
      </div>
      <div className="playlist-results-meta" role="status">{query.trim() ? `找到 ${results.length} 首` : `共 ${tracks.length} 首`}<span>点击歌曲即可播放</span></div>
      <div ref={scrollRef} className="playlist-scroll" tabIndex={0} aria-label="歌曲列表">
        {visible.length ? <ol className="playlist-rows" start={activePage * PAGE_SIZE + 1}>
          {visible.map(({ track, index }) => <li key={track.id}>
            <button type="button" className={`playlist-song${index === currentIndex ? " is-current" : ""}`} aria-current={index === currentIndex ? "true" : undefined} aria-label={`播放 ${track.name} — ${track.artist}`} onClick={() => onSelect(index)}>
              <span className="playlist-song-number">{String(index + 1).padStart(2, "0")}</span>
              <span className="playlist-song-copy"><strong>{track.name}</strong><small>{track.artist}</small></span>
              {index === currentIndex ? <span className="playlist-current-label">当前</span> : <Play size={14} className="playlist-song-play" aria-hidden="true" />}
            </button>
          </li>)}
        </ol> : <div className="playlist-empty"><Search size={24} aria-hidden="true" /><p>没有找到这首歌</p><span>换个歌名或歌手试试</span></div>}
      </div>
      <div className="playlist-pagination">
        <span>{results.length ? `${activePage * PAGE_SIZE + 1}–${Math.min((activePage + 1) * PAGE_SIZE, results.length)} / ${results.length}` : "0 首"}</span>
        <div>
          <button type="button" aria-label="歌单上一页" disabled={activePage === 0} onClick={() => setPage(activePage - 1)}><ArrowLeft size={16} /></button>
          <span>{activePage + 1} / {pages}</span>
          <button type="button" aria-label="歌单下一页" disabled={activePage >= pages - 1} onClick={() => setPage(activePage + 1)}><ArrowRight size={16} /></button>
        </div>
      </div>
    </section>
  );
}

export default memo(PlaylistPicker);
