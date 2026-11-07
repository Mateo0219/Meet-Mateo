"use client";

import Image from "next/image";
import type { CSSProperties } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowUpRight,
  Loader2,
  ListMusic,
  Pause,
  Play,
  SkipBack,
  SkipForward,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { findActiveLyricIndex, LyricLine, parseLyrics } from "@/lib/lyrics";
import { requestMediaPlayback } from "@/lib/media-playback";
import { MUSIC_PLAYLIST_URL } from "@/lib/music-config";
import { loadPlaylist, type LibraryTrack } from "@/lib/use-playlist";
import PlaylistPicker from "./PlaylistPicker";

interface MusicTrack extends LibraryTrack {
  lyrics?: LyricLine[];
}

export interface TrackRequest {
  id: string;
  nonce: number;
  autoplay: boolean;
}

export interface MusicControls {
  toggle: () => void;
  getProgress: () => { currentTime: number; duration: number };
}

interface MusicPlayerProps {
  onControlsReady?: (controls: MusicControls | null) => void;
  onRequestHandled?: (nonce: number) => void;
  /** Track to show first instead of a random one. */
  initialTrackId?: string;
  /** Ask the player to jump to a track from elsewhere on the page. */
  request?: TrackRequest | null;
  /** Reports the current track and whether it is playing, e.g. for a menu bar. */
  onPlaybackChange?: (state: { track: Pick<LibraryTrack, "id" | "name" | "artist" | "cover">; playing: boolean } | null) => void;
}

const LYRIC_DISPLAY_LEAD_SECONDS = 0.12;
const playerSpring = {
  type: "spring" as const,
  stiffness: 360,
  damping: 34,
  mass: 0.84,
};

const coverVariants = {
  enter: (direction: number) => ({
    opacity: 0,
    x: direction * 34,
    scale: 0.975,
  }),
  center: { opacity: 1, x: 0, scale: 1 },
  exit: (direction: number) => ({
    opacity: 0,
    x: direction * -34,
    scale: 0.98,
  }),
};

function projectVelocity(velocity: number, decelerationRate = 0.99): number {
  return (velocity / 1_000) * (decelerationRate / (1 - decelerationRate));
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return "0:00";
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}

function isAutoplayBlocked(error: unknown): boolean {
  return typeof error === "object" && error !== null && "name" in error && error.name === "NotAllowedError";
}

export default function MusicPlayer({ initialTrackId, request, onPlaybackChange, onControlsReady, onRequestHandled }: MusicPlayerProps) {
  const [playlist, setPlaylist] = useState<MusicTrack[]>([]);
  const [playlistName, setPlaylistName] = useState("我喜欢的音乐");
  const [playlistTotal, setPlaylistTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingTrackIndex, setLoadingTrackIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(0);
  const [trackDirection, setTrackDirection] = useState(1);
  const [currentLyricIndex, setCurrentLyricIndex] = useState(-1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isPlaylistOpen, setPlaylistOpen] = useState(false);
  const playlistButtonRef = useRef<HTMLButtonElement>(null);
  const selectedPlaybackRef = useRef<string | null>(null);
  const initialTrackRef = useRef(initialTrackId);
  const handledRequestRef = useRef<number | null>(null);

  const audioRef = useRef<HTMLAudioElement>(null);
  const isPlayingRef = useRef(false);
  const playRequestRef = useRef(0);
  const playbackFrameRef = useRef<number | null>(null);
  const lastTimelineUpdateRef = useRef(0);
  const prefersReducedMotion = useReducedMotion();

  const currentTrackData = playlist[currentTrack];
  const currentTrackId = currentTrackData?.id;
  const currentPlayUrl = currentTrackData?.urlApi;
  const isLoadingTrack = loadingTrackIndex === currentTrack;

  // Primitive deps: lyric loads replace the track object but not the track.
  const trackName = currentTrackData?.name;
  const trackArtist = currentTrackData?.artist;
  const trackCover = currentTrackData?.cover;
  useEffect(() => {
    if (!onPlaybackChange) return;
    onPlaybackChange(
      currentTrackId && trackName && trackArtist && trackCover
        ? { track: { id: currentTrackId, name: trackName, artist: trackArtist, cover: trackCover }, playing: isPlaying }
        : null,
    );
  }, [onPlaybackChange, currentTrackId, trackName, trackArtist, trackCover, isPlaying]);

  const updatePlayingState = useCallback((playing: boolean) => {
    isPlayingRef.current = playing;
    setIsPlaying(playing);
  }, []);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setError(null);

    loadPlaylist()
      .then((library) => {
        if (!active) return;
        const preferred = library.tracks.findIndex((track) => track.id === initialTrackRef.current);
        // Keep the list order for browsing; only the starting point varies.
        setCurrentTrack(preferred >= 0 ? preferred : Math.floor(Math.random() * library.tracks.length));
        setPlaylist(library.tracks.map((track) => ({ ...track })));
        setPlaylistName(library.name);
        setPlaylistTotal(library.total);
      })
      .catch((fetchError: unknown) => {
        if (!active) return;
        console.error("获取歌单错误:", fetchError);
        setError("获取歌单失败，请稍后重试");
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  // Lyrics do not block a user-initiated audio request. Abort stale track loads.
  useEffect(() => {
    if (!currentTrackId) return;
    const controller = new AbortController();
    setLoadingTrackIndex(currentTrack);
    const loadLyrics = async () => {
      try {
        const response = await fetch(`/api/music/lyrics?id=${currentTrackId}`, {
          signal: controller.signal,
        });
        if (!response.ok) return;
        const data: unknown = await response.json();
        if (!data || typeof data !== "object" || !("lyrics" in data) || typeof data.lyrics !== "string") return;
        const lyrics = parseLyrics(data.lyrics);
        if (controller.signal.aborted) return;
        setPlaylist(previous => previous.map(track => track.id === currentTrackId ? { ...track, lyrics } : track));
      } catch (error) {
        if (!controller.signal.aborted) console.warn("获取歌词失败:", error);
      } finally {
        if (!controller.signal.aborted) setLoadingTrackIndex(null);
      }
    };
    void loadLyrics();
    return () => controller.abort();
  }, [currentTrack, currentTrackId]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = 0.5;
    }
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    setCurrentLyricIndex(-1);
    setCurrentTime(0);
    setDuration(0);

    // A list selection starts playback in the click handler to retain the
    // browser's user gesture. Don't interrupt that request in this effect.
    if (selectedPlaybackRef.current === currentTrackId) {
      selectedPlaybackRef.current = null;
      return;
    }
    const requestId = ++playRequestRef.current;

    if (!currentPlayUrl || !isPlayingRef.current) {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
      return;
    }

    if (audio.getAttribute("src") !== currentPlayUrl) {
      audio.src = currentPlayUrl;
      audio.load();
    }

    if (isPlayingRef.current) {
      void requestMediaPlayback(audio).then((result) => {
        if (requestId !== playRequestRef.current) {
          return;
        }

        if (result.status === "failed") {
          console.error("自动播放失败:", result.error);
          updatePlayingState(false);
          setError("这首歌暂时无法在网页播放，可切换下一首或前往网易云收听。");
        }
      });
    }
  }, [currentPlayUrl, currentTrack, currentTrackId, updatePlayingState]);

  const playTrack = useCallback(async (track: MusicTrack) => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.getAttribute("src") !== track.urlApi) {
      audio.src = track.urlApi;
      audio.load();
    }
    const requestId = ++playRequestRef.current;
    const result = await requestMediaPlayback(audio);
    if (requestId !== playRequestRef.current) return;
    if (result.status === "playing") {
      updatePlayingState(true);
      setError(null);
    } else {
      updatePlayingState(false);
      // A blocked autoplay is not a broken track; leave it paused quietly.
      if (result.status === "failed" && !isAutoplayBlocked(result.error)) {
        setError("这首歌暂时无法在网页播放，可切换下一首或前往网易云收听。");
      }
    }
  }, [updatePlayingState]);

  useEffect(() => {
    if (!request || handledRequestRef.current === request.nonce || playlist.length === 0) return;
    const index = playlist.findIndex((track) => track.id === request.id);
    if (index < 0) return;
    handledRequestRef.current = request.nonce;
    onRequestHandled?.(request.nonce);
    const track = playlist[index];
    setError(null);
    if (index !== currentTrack) {
      selectedPlaybackRef.current = request.autoplay ? track.id : null;
      setTrackDirection(index > currentTrack ? 1 : -1);
      setCurrentTrack(index);
      if (request.autoplay) updatePlayingState(false);
    }
    if (request.autoplay) void playTrack(track);
  }, [request, playlist, currentTrack, playTrack, updatePlayingState, onRequestHandled]);

  const togglePlay = useCallback(async () => {
    const track = playlist[currentTrack];
    const audio = audioRef.current;

    if (!track || !audio) {
      setError("当前没有可播放的歌曲");
      return;
    }

    if (isPlaying) {
      playRequestRef.current += 1;
      updatePlayingState(false);
      audio.pause();
      return;
    }

    await playTrack(track);
  }, [playlist, currentTrack, isPlaying, updatePlayingState, playTrack]);

  useEffect(() => {
    onControlsReady?.({
      toggle: () => { void togglePlay(); },
      getProgress: () => ({ currentTime: audioRef.current?.currentTime ?? 0, duration: audioRef.current?.duration || 0 }),
    });
    return () => onControlsReady?.(null);
  }, [onControlsReady, togglePlay]);

  const closePlaylist = useCallback(() => {
    setPlaylistOpen(false);
    playlistButtonRef.current?.focus({ preventScroll: true });
  }, []);

  const selectTrack = useCallback((index: number) => {
    const track = playlist[index];
    if (!track) return;
    setError(null);
    if (index !== currentTrack) {
      selectedPlaybackRef.current = track.id;
      setTrackDirection(index > currentTrack ? 1 : -1);
      setCurrentTrack(index);
      updatePlayingState(false);
    }
    closePlaylist();
    void playTrack(track);
  }, [playlist, currentTrack, closePlaylist, playTrack, updatePlayingState]);

  const changeTrack = useCallback(
    (direction: number) => {
      if (playlist.length === 0) {
        return;
      }

      playRequestRef.current += 1;
      setError(null);
      setTrackDirection(direction > 0 ? 1 : -1);
      setCurrentTrack(
        (current) => (current + direction + playlist.length) % playlist.length
      );
    },
    [playlist.length]
  );

  const nextTrack = useCallback(() => changeTrack(1), [changeTrack]);
  const previousTrack = useCallback(() => changeTrack(-1), [changeTrack]);

  const syncPlaybackPosition = useCallback((forceTimelineUpdate = false) => {
    const time = audioRef.current?.currentTime ?? 0;
    const lyrics = currentTrackData?.lyrics ?? [];

    if (
      forceTimelineUpdate ||
      Math.abs(time - lastTimelineUpdateRef.current) >= 0.08
    ) {
      lastTimelineUpdateRef.current = time;
      setCurrentTime(time);
    }

    const activeIndex = findActiveLyricIndex(
      lyrics,
      time,
      LYRIC_DISPLAY_LEAD_SECONDS
    );
    setCurrentLyricIndex((current) =>
      current === activeIndex ? current : activeIndex
    );
  }, [currentTrackData?.lyrics]);

  const handleTimeUpdate = () => syncPlaybackPosition(true);

  useEffect(() => {
    if (!isPlaying) {
      if (playbackFrameRef.current !== null) {
        cancelAnimationFrame(playbackFrameRef.current);
        playbackFrameRef.current = null;
      }
      return;
    }

    const tick = () => {
      syncPlaybackPosition();
      playbackFrameRef.current = requestAnimationFrame(tick);
    };

    playbackFrameRef.current = requestAnimationFrame(tick);
    return () => {
      if (playbackFrameRef.current !== null) {
        cancelAnimationFrame(playbackFrameRef.current);
        playbackFrameRef.current = null;
      }
    };
  }, [isPlaying, syncPlaybackPosition]);

  const visibleLyrics = useMemo(() => {
    const lyrics = currentTrackData?.lyrics ?? [];
    if (lyrics.length === 0) {
      return [];
    }

    const activeIndex = Math.max(currentLyricIndex, 0);
    const startIndex = Math.max(0, activeIndex - 2);
    const endIndex = Math.min(lyrics.length, activeIndex + 4);

    return lyrics
      .slice(startIndex, endIndex)
      .map((lyric, index) => ({
        ...lyric,
        originalIndex: startIndex + index,
      }))
      .filter((lyric) => lyric.text.length > 0)
      .slice(0, 4);
  }, [currentLyricIndex, currentTrackData?.lyrics]);

  const handleSeek = (value: number) => {
    const audio = audioRef.current;
    if (!audio || !Number.isFinite(value)) {
      return;
    }

    audio.currentTime = value;
    setCurrentTime(value);
    syncPlaybackPosition(true);
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const hasMusic = playlist.length > 0;

  return (
    <section
      className={`music-player${isPlaying ? " is-playing" : ""}${isPlaylistOpen ? " is-selecting" : ""}`}
      aria-label="音乐播放器"
    >
      {hasMusic && (
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={`backdrop-${currentTrackData.id}`}
            className="player-backdrop"
            aria-hidden="true"
            initial={{ opacity: 0, scale: 1.08 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={playerSpring}
          >
            <Image
              src={currentTrackData.cover}
              alt=""
              width={180}
              height={180}
              unoptimized
            />
          </motion.div>
        </AnimatePresence>
      )}
      <div className="player-topline">
        <span className="player-source">
          <span className="player-eq" aria-hidden="true"><i /><i /><i /></span>
          <a href={MUSIC_PLAYLIST_URL} target="_blank" rel="noopener noreferrer">
            {playlistName} <ArrowUpRight size={13} aria-hidden="true" />
          </a>
        </span>
        {hasMusic && (
          <div className="player-topline-actions">
            <span className="player-counter">{currentTrack + 1} / {playlist.length}</span>
            <button ref={playlistButtonRef} type="button" className={`playlist-toggle${isPlaylistOpen ? " is-active" : ""}`} aria-expanded={isPlaylistOpen} aria-controls="music-playlist-picker" onClick={() => isPlaylistOpen ? closePlaylist() : setPlaylistOpen(true)}><ListMusic size={16} aria-hidden="true" /> 歌单</button>
          </div>
        )}
      </div>

      {hasMusic && playlistTotal > playlist.length && (
        <p className="playlist-availability">网易云共 {playlistTotal} 首 · 当前公开可读取 {playlist.length} 首</p>
      )}
      {isLoading ? (
        <div className="player-state">
          <Loader2 className="player-spinner" aria-hidden="true" />
          <span>正在读取歌单</span>
        </div>
      ) : hasMusic ? (
        <div className="player-view-stack">
        <div className="player-grid" style={isPlaylistOpen ? { visibility: "hidden" } : undefined} aria-hidden={isPlaylistOpen}>
          <div className="cover-stage">
            <AnimatePresence initial={false} custom={trackDirection} mode="popLayout">
              <motion.div
                key={currentTrackData.id}
                className="cover-interaction"
                custom={trackDirection}
                variants={coverVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={playerSpring}
                drag={prefersReducedMotion ? false : "x"}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.16}
                dragMomentum={false}
                onDragEnd={(_, info) => {
                  const projected = info.offset.x + projectVelocity(info.velocity.x);
                  if (Math.abs(projected) < 72) {
                    return;
                  }
                  if (projected < 0) {
                    nextTrack();
                  } else {
                    previousTrack();
                  }
                }}
                whileTap={{ scale: 0.985 }}
                style={{ touchAction: "pan-y" }}
              >
                <Image
                  src={currentTrackData.cover}
                  alt={`${currentTrackData.name} 封面`}
                  width={720}
                  height={720}
                  unoptimized
                  priority={currentTrack === 0}
                  className="player-cover"
                />
                <span className="cover-hint" aria-hidden="true">
                  左右滑动切歌
                </span>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="player-content">
            <div className="track-heading">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={currentTrackData.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={playerSpring}
                >
                  <span className="track-kicker">{isPlaying ? "正在播放" : "来自网易云音乐"}</span>
                  <h3>{currentTrackData.name}</h3>
                  <p>{currentTrackData.artist}</p>
                </motion.div>
              </AnimatePresence>
              {isLoadingTrack && (
                <span className="track-loading">
                  <Loader2 className="player-spinner" aria-hidden="true" /> 正在读取
                </span>
              )}
            </div>

            <div className="lyrics-window" aria-live="polite">
              {visibleLyrics.length > 0 ? (
                <div className="lyrics-stack">
                  <AnimatePresence initial={false} mode="popLayout">
                    {visibleLyrics.map((lyric) => {
                      const distance = Math.abs(lyric.originalIndex - currentLyricIndex);
                      const isCurrent = distance === 0;

                      return (
                        <motion.p
                          layout="position"
                          key={`${lyric.time}-${lyric.originalIndex}`}
                          className={isCurrent ? "is-current" : ""}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{
                            opacity: isCurrent ? 1 : distance === 1 ? 0.46 : 0.2,
                            x: 0,
                            y: 0,
                          }}
                          exit={{ opacity: 0, y: -8 }}
                          transition={{ duration: 0.1, ease: "easeOut" }}
                        >
                          {lyric.text}
                        </motion.p>
                      );
                    })}
                  </AnimatePresence>
                </div>
              ) : (currentTrackData?.lyrics?.length ?? 0) > 0 ? (
                <p className="lyrics-empty">间奏</p>
              ) : (
                <p className="lyrics-empty">
                  {isLoadingTrack ? "正在读取歌词…" : "这首歌暂时没有歌词"}
                </p>
              )}
            </div>

            <div className="transport">
              <div className="timeline">
                <input
                  type="range"
                  min={0}
                  max={duration || 1}
                  step={0.1}
                  value={Math.min(currentTime, duration || 0)}
                  onChange={(event) => handleSeek(Number(event.target.value))}
                  disabled={!duration}
                  aria-label="播放进度"
                  style={{ "--player-progress": `${progressPercent}%` } as CSSProperties}
                />
                <div className="time-row">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              <div className="transport-row">
                <button
                  type="button"
                  onClick={previousTrack}
                  disabled={playlist.length <= 1}
                  aria-label="播放上一首"
                  className="transport-button"
                >
                  <SkipBack size={18} fill="currentColor" />
                </button>
                <button
                  type="button"
                  onClick={togglePlay}
                  aria-label={isPlaying ? "暂停" : "播放"}
                  className="transport-button transport-button-primary"
                >
                  {isPlaying ? (
                    <Pause size={22} fill="currentColor" />
                  ) : (
                    <Play size={22} fill="currentColor" className="transport-play-icon" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={nextTrack}
                  disabled={playlist.length <= 1}
                  aria-label="播放下一首"
                  className="transport-button"
                >
                  <SkipForward size={18} fill="currentColor" />
                </button>
              </div>
            </div>
          </div>
        </div>
        {isPlaylistOpen && <PlaylistPicker tracks={playlist} currentIndex={currentTrack} onSelect={selectTrack} onClose={closePlaylist} />}
        </div>
      ) : (
        <div className="player-state">歌单暂时不可用，稍后再来。</div>
      )}

      {error && (
        <p role="alert" className="player-error">
          {error}{" "}
          <a href={currentTrackId ? `https://music.163.com/song?id=${currentTrackId}` : MUSIC_PLAYLIST_URL} target="_blank" rel="noopener noreferrer">在网易云打开 ↗</a>
        </p>
      )}

      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={() => {
          const nextDuration = audioRef.current?.duration ?? 0;
          setDuration(Number.isFinite(nextDuration) ? nextDuration : 0);
        }}
        onDurationChange={() => {
          const nextDuration = audioRef.current?.duration ?? 0;
          setDuration(Number.isFinite(nextDuration) ? nextDuration : 0);
        }}
        onEnded={nextTrack}
        onError={() => {
          playRequestRef.current += 1;
          setError("这首歌暂时无法在网页播放，可切换下一首或前往网易云收听。");
          updatePlayingState(false);
        }}
        preload="none"
      />
    </section>
  );
}
