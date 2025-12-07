"use client";

import { useState, useRef, useEffect } from "react";
import { Play, Pause, SkipForward, SkipBack, Music2, Loader2 } from "lucide-react";

interface ApiTrack {
  title: string;
  author: string;
  pic: string;
  url: string; // 这是获取播放链接的 API
  lrc: string; // 歌词链接
}

interface MusicTrack {
  name: string;
  artist: string;
  playUrl?: string; // 实际播放链接（延迟加载）
  cover: string;
  urlApi: string; // 获取播放链接的 API
  lrcUrl: string;
  lyrics?: LyricLine[]; // 歌词（延迟加载）
}

interface LyricLine {
  time: number; // 秒
  text: string;
}

/**
 * 庄达菲专属歌单 - 从 API 获取
 */
export default function ZhuangDafeiMusic() {
  const [playlist, setPlaylist] = useState<MusicTrack[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingTrack, setIsLoadingTrack] = useState(false); // 加载当前歌曲的播放链接和歌词
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [currentLyricIndex, setCurrentLyricIndex] = useState(-1); // 当前播放的歌词索引
  const audioRef = useRef<HTMLAudioElement>(null);
  const lyricsRef = useRef<HTMLDivElement>(null);

  // 解析 LRC 歌词格式
  const parseLyrics = (lrcText: string): LyricLine[] => {
    const lines = lrcText.split('\n');
    const lyrics: LyricLine[] = [];

    lines.forEach((line) => {
      // 匹配 [mm:ss.xx] 格式的时间戳
      const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/g;
      const matches = [...line.matchAll(timeRegex)];
      const text = line.replace(timeRegex, '').trim();

      if (matches.length > 0 && text) {
        matches.forEach((match) => {
          const minutes = parseInt(match[1]);
          const seconds = parseInt(match[2]);
          const milliseconds = parseInt(match[3].padEnd(3, '0'));
          const time = minutes * 60 + seconds + milliseconds / 1000;
          lyrics.push({ time, text });
        });
      }
    });

    return lyrics.sort((a, b) => a.time - b.time);
  };

  // 获取歌单列表（只获取基本信息，不获取播放链接和歌词）
  const fetchPlaylist = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/music/playlist?id=13049743731');
      if (!response.ok) throw new Error('获取歌单失败');

      const apiTracks: ApiTrack[] = await response.json();
      
      // 只保存基本信息，不获取播放链接和歌词
      const tracks: MusicTrack[] = apiTracks.map((track) => ({
        name: track.title,
        artist: track.author,
        cover: track.pic,
        urlApi: track.url, // 保存获取播放链接的 API
        lrcUrl: track.lrc,
      }));

      setPlaylist(tracks);
    } catch (err: any) {
      console.error('获取歌单错误:', err);
      setError('获取歌单失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 获取当前歌曲的播放链接和歌词
  const fetchCurrentTrackData = async (trackIndex: number) => {
    const track = playlist[trackIndex];
    if (!track || track.playUrl) {
      // 如果已经有播放链接，不需要重新获取
      return;
    }

    try {
      setIsLoadingTrack(true);
      setError(null);

      // 直接使用 urlApi 作为播放链接（它会 302 重定向到真正的播放地址）
      // 浏览器会自动处理重定向
      let playUrl = track.urlApi;
      
      // 获取歌词（通过本地 API 代理，避免 CORS 问题）
      let lyrics: LyricLine[] = [];
      try {
        const lrcResponse = await fetch(`/api/music/lyrics?url=${encodeURIComponent(track.lrcUrl)}`);
        if (lrcResponse.ok) {
          const lrcData = await lrcResponse.json();
          if (lrcData.lyrics) {
            lyrics = parseLyrics(lrcData.lyrics);
          }
        }
      } catch (err) {
        console.warn('获取歌词失败:', err);
      }

      // 更新当前歌曲的播放链接和歌词
      setPlaylist((prev) => {
        const newPlaylist = [...prev];
        newPlaylist[trackIndex] = {
          ...newPlaylist[trackIndex],
          playUrl,
          lyrics,
        };
        return newPlaylist;
      });
    } catch (err: any) {
      console.error('获取歌曲数据失败:', err);
      setError('获取播放链接失败，请稍后重试');
    } finally {
      setIsLoadingTrack(false);
    }
  };

  // 初始化加载歌单
  useEffect(() => {
    fetchPlaylist();
  }, []);

  const currentTrackData = playlist[currentTrack];

  // 更新当前歌词
  useEffect(() => {
    if (!audioRef.current || !currentTrackData?.lyrics) {
      setCurrentLyricIndex(-1);
      return;
    }

    const updateLyric = () => {
      const time = audioRef.current?.currentTime || 0;
      setCurrentTime(time);

      const lyrics = currentTrackData.lyrics || [];
      if (lyrics.length === 0) {
        setCurrentLyricIndex(-1);
        return;
      }

      // 找到当前时间对应的歌词索引
      let foundIndex = -1;
      for (let i = lyrics.length - 1; i >= 0; i--) {
        if (time >= lyrics[i].time) {
          foundIndex = i;
          break;
        }
      }

      if (foundIndex !== currentLyricIndex) {
        setCurrentLyricIndex(foundIndex);
      }
    };

    const interval = setInterval(updateLyric, 100);
    return () => clearInterval(interval);
  }, [currentTrackData?.lyrics, currentTrack, currentLyricIndex]);

  // 初始化音频音量（固定为 50%）
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = 0.5;
    }
  }, []);

  // 当切换歌曲时，获取该歌曲的播放链接和歌词
  useEffect(() => {
    if (playlist.length > 0 && playlist[currentTrack]) {
      setError(null);
      setCurrentLyricIndex(-1);
      fetchCurrentTrackData(currentTrack);
    }
  }, [currentTrack, playlist.length]);

  // 当歌曲数据加载完成后，设置音频源
  useEffect(() => {
    const track = playlist[currentTrack];
    if (track?.playUrl && audioRef.current) {
      audioRef.current.src = track.playUrl;
      audioRef.current.load();
      // 如果正在播放，自动播放新歌曲
      if (isPlaying) {
        audioRef.current.play().catch((err) => {
          console.error('自动播放失败:', err);
          setIsPlaying(false);
        });
      }
    }
  }, [playlist[currentTrack]?.playUrl, currentTrack]);

  const togglePlay = async () => {
    const track = playlist[currentTrack];
    if (!track) {
      setError("请先选择歌曲");
      return;
    }

    // 如果还没有播放链接，先获取
    if (!track.playUrl) {
      if (isLoadingTrack) {
        setError("正在加载播放链接，请稍候...");
        return;
      }
      await fetchCurrentTrackData(currentTrack);
      // 等待一下让状态更新
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    const updatedTrack = playlist[currentTrack];
    if (!updatedTrack?.playUrl) {
      setError("该歌曲暂无播放链接");
      return;
    }

    if (audioRef.current) {
      try {
        if (isPlaying) {
          audioRef.current.pause();
          setIsPlaying(false);
        } else {
          if (!audioRef.current.src || audioRef.current.src !== updatedTrack.playUrl) {
            audioRef.current.src = updatedTrack.playUrl;
            audioRef.current.load();
          }
          await audioRef.current.play();
          setIsPlaying(true);
          setError(null);
        }
      } catch (err: any) {
        console.error("播放失败:", err);
        setError("无法播放此音乐，请检查网络连接");
        setIsPlaying(false);
      }
    }
  };

  const nextTrack = () => {
    if (playlist.length === 0) return;
    const next = (currentTrack + 1) % playlist.length;
    setCurrentTrack(next);
    if (audioRef.current && playlist[next]?.playUrl && isPlaying) {
      audioRef.current.src = playlist[next].playUrl;
      audioRef.current.load();
      audioRef.current.play().catch((err) => {
        console.error("自动播放下一首失败:", err);
        setIsPlaying(false);
      });
    }
  };

  const prevTrack = () => {
    if (playlist.length === 0) return;
    const prev = (currentTrack - 1 + playlist.length) % playlist.length;
    setCurrentTrack(prev);
    if (audioRef.current && playlist[prev]?.playUrl && isPlaying) {
      audioRef.current.src = playlist[prev].playUrl;
      audioRef.current.load();
      audioRef.current.play().catch((err) => {
        console.error("自动播放上一首失败:", err);
        setIsPlaying(false);
      });
    }
  };


  const hasMusic = playlist.length > 0;

  // 计算要显示的歌词范围（当前歌词前后各2-3行，总共6行）
  const getVisibleLyrics = () => {
    if (!currentTrackData?.lyrics || currentLyricIndex < 0) {
      return [];
    }
    
    const lyrics = currentTrackData.lyrics;
    const startIndex = Math.max(0, currentLyricIndex - 2);
    const endIndex = Math.min(lyrics.length - 1, currentLyricIndex + 3);
    
    return lyrics.slice(startIndex, endIndex + 1).map((lyric, idx) => ({
      ...lyric,
      originalIndex: startIndex + idx,
    }));
  };

  const visibleLyrics = getVisibleLyrics();

  return (
    <div 
      className="glass-card-hover p-4 group relative overflow-hidden w-full rounded-2xl border border-white/5"
      style={{
        background: 'rgba(10, 10, 10, 0.4)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.05), 0 8px 32px 0 rgba(0, 0, 0, 0.3)',
        height: 'fit-content',
        maxHeight: '400px',
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-aurora-purple/10 to-aurora-blue/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="relative z-10">
        {/* 标题栏 */}
        <div className="flex items-center gap-2 mb-4">
          <Music2 className="w-4 h-4 text-aurora-purple" />
          <h3 className="text-base font-semibold text-white">庄达菲的歌单</h3>
          {playlist.length > 0 && (
            <span className="text-xs text-white/40 ml-auto">
              {currentTrack + 1} / {playlist.length}
            </span>
          )}
        </div>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 text-aurora-purple animate-spin" />
            <span className="ml-2 text-white/60 text-xs">加载歌单中...</span>
          </div>
        ) : (
          <div className="flex gap-4">
            {/* 左侧：封面、歌曲信息、控制按钮 */}
            <div className="flex flex-col items-center flex-shrink-0 w-36">
              {/* 封面 */}
              {currentTrackData?.cover && (
                <img 
                  src={currentTrackData.cover} 
                  alt={currentTrackData.name}
                  className="w-36 h-36 rounded-lg object-cover mb-3 shadow-lg"
                />
              )}
              
              {/* 歌曲信息 */}
              <div className="w-full text-center mb-3">
                <div className="text-white font-semibold text-sm mb-1 line-clamp-2">
                  {currentTrackData?.name || "未知歌曲"}
                </div>
                <div className="text-white/60 text-xs mb-1">
                  {currentTrackData?.artist || "庄达菲"}
                </div>
                {isLoadingTrack && (
                  <div className="text-xs text-aurora-purple">
                    加载中...
                  </div>
                )}
              </div>

              {/* 控制按钮 - 居中 */}
              <div className="flex items-center justify-center gap-2 w-full">
                <button
                  onClick={prevTrack}
                  disabled={!hasMusic || playlist.length <= 1}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                >
                  <SkipBack className="w-4 h-4 text-white" />
                </button>
                <button
                  onClick={togglePlay}
                  disabled={!hasMusic || isLoadingTrack}
                  className="w-12 h-12 rounded-full bg-aurora-purple/20 hover:bg-aurora-purple/30 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                >
                  {isLoadingTrack ? (
                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                  ) : isPlaying ? (
                    <Pause className="w-5 h-5 text-white" />
                  ) : (
                    <Play className="w-5 h-5 text-white ml-0.5" />
                  )}
                </button>
                <button
                  onClick={nextTrack}
                  disabled={!hasMusic || playlist.length <= 1}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                >
                  <SkipForward className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>

            {/* 右侧：歌词显示（只显示6行，带渐变效果） */}
            <div className="flex-1 min-w-0 relative" style={{ height: '200px', contain: 'layout style paint' }}>
              {currentTrackData?.lyrics && currentTrackData.lyrics.length > 0 && visibleLyrics.length > 0 ? (
                <div className="relative w-full h-full overflow-hidden">
                  {/* 歌词内容 */}
                  <div 
                    ref={lyricsRef}
                    className="absolute inset-0 flex flex-col justify-center space-y-4 pl-8 pr-4"
                    style={{ willChange: 'transform' }}
                  >
                    {visibleLyrics.map((lyric, idx) => {
                      const originalIndex = lyric.originalIndex;
                      const isCurrent = originalIndex === currentLyricIndex;
                      const distance = Math.abs(originalIndex - currentLyricIndex);
                      
                      // 根据距离计算透明度和模糊度
                      let opacity = 1;
                      let blur = 0;
                      let scale = 1;
                      
                      if (distance === 0) {
                        // 当前歌词：最清晰
                        opacity = 1;
                        blur = 0;
                        scale = 1.05;
                      } else if (distance === 1) {
                        // 相邻歌词：稍微模糊
                        opacity = 0.7;
                        blur = 2;
                        scale = 1;
                      } else {
                        // 更远的歌词：更模糊
                        opacity = 0.4;
                        blur = 4;
                        scale = 0.95;
                      }
                      
                      return (
                        <div
                          key={originalIndex}
                          className={`transition-all duration-500 leading-tight ${
                            isCurrent
                              ? 'text-white text-2xl font-semibold'
                              : 'text-white/60 text-xl'
                          }`}
                          style={{
                            opacity,
                            filter: `blur(${blur}px)`,
                            transform: `scale(${scale})`,
                            lineHeight: '1.4',
                            willChange: 'transform, opacity, filter',
                          }}
                        >
                          {lyric.text || ' '}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <p className="text-white/40 text-base">
                    {isLoadingTrack ? '正在加载歌词...' : '暂无歌词'}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="absolute bottom-2 left-2 right-2 text-xs text-red-400 bg-red-500/10 px-2 py-1 rounded">
          {error}
        </div>
      )}

      {/* 隐藏的音频元素 */}
      {hasMusic && currentTrackData?.playUrl && (
        <audio
          ref={audioRef}
          src={currentTrackData.playUrl}
          onEnded={nextTrack}
          onError={(e) => {
            console.error("音频加载错误:", e);
            setError("音乐加载失败，请检查网络连接");
            setIsPlaying(false);
          }}
          onLoadedData={() => {
            setError(null);
          }}
          onCanPlay={() => {
            setError(null);
          }}
          preload="metadata"
        />
      )}
    </div>
  );
}
