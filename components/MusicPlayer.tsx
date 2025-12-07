"use client";

import { useState, useRef, useEffect } from "react";
import { Play, Pause, SkipForward, SkipBack, Music2, Volume2, VolumeX } from "lucide-react";

interface MusicTrack {
  name: string;
  artist: string;
  url: string;
  cover?: string;
}

// 示例音乐列表
const musicList: MusicTrack[] = [
  {
    name: "示例音乐 1",
    artist: "艺术家 1",
    url: "https://example.com/music1.mp3",
  },
  {
    name: "示例音乐 2",
    artist: "艺术家 2",
    url: "https://example.com/music2.mp3",
  },
];

export default function MusicPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(0);
  const [volume, setVolume] = useState(50);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const nextTrack = () => {
    const next = (currentTrack + 1) % musicList.length;
    setCurrentTrack(next);
    if (audioRef.current) {
      audioRef.current.src = musicList[next].url;
      if (isPlaying) {
        audioRef.current.play();
      }
    }
  };

  const prevTrack = () => {
    const prev = (currentTrack - 1 + musicList.length) % musicList.length;
    setCurrentTrack(prev);
    if (audioRef.current) {
      audioRef.current.src = musicList[prev].url;
      if (isPlaying) {
        audioRef.current.play();
      }
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseInt(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume / 100;
      setIsMuted(newVolume === 0);
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.volume = volume / 100;
        setIsMuted(false);
      } else {
        audioRef.current.volume = 0;
        setIsMuted(true);
      }
    }
  };

  return (
    <div 
      className="glass-card-hover p-6 group relative overflow-hidden w-full h-[200px] rounded-2xl border border-white/5"
      style={{
        background: 'rgba(10, 10, 10, 0.4)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.05), 0 8px 32px 0 rgba(0, 0, 0, 0.3)'
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-aurora-purple/10 to-aurora-blue/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="relative z-10 flex flex-col h-full">
        <div className="flex items-center gap-2 mb-4">
          <Music2 className="w-5 h-5 text-aurora-purple" />
          <h3 className="text-lg font-semibold text-white">音乐</h3>
        </div>
        
        <div className="flex-1 flex flex-col justify-center space-y-4">
          {/* 当前播放 */}
          <div className="text-center">
            <div className="text-white font-semibold text-sm mb-1 truncate">
              {musicList[currentTrack]?.name}
            </div>
            <div className="text-white/60 text-sm truncate">
              {musicList[currentTrack]?.artist}
            </div>
          </div>

          {/* 控制按钮 */}
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={prevTrack}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <SkipBack className="w-4 h-4 text-white" />
            </button>
            <button
              onClick={togglePlay}
              className="w-14 h-14 rounded-full bg-aurora-purple/20 hover:bg-aurora-purple/30 flex items-center justify-center transition-colors"
            >
              {isPlaying ? (
                <Pause className="w-6 h-6 text-white" />
              ) : (
                <Play className="w-6 h-6 text-white ml-0.5" />
              )}
            </button>
            <button
              onClick={nextTrack}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <SkipForward className="w-4 h-4 text-white" />
            </button>
          </div>

          {/* 音量控制 */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleMute}
              className="w-6 h-6 flex items-center justify-center"
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4 text-white/60" />
              ) : (
                <Volume2 className="w-4 h-4 text-white/60" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="100"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="flex-1 h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* 隐藏的音频元素 */}
      <audio
        ref={audioRef}
        src={musicList[currentTrack]?.url}
        onEnded={nextTrack}
        preload="metadata"
      />
    </div>
  );
}
