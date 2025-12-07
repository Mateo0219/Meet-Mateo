"use client";

import DateTime from "./DateTime";
import TimeProgress from "./TimeProgress";
import ZhuangDafeiMusic from "./MusicPlayer";
import ParticleAnimation from "./ParticleAnimation";

export default function Hero() {
  return (
    <section
      id="home"
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
    >
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-aurora-purple/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-aurora-cyan/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-aurora-pink/15 rounded-full blur-3xl" />
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10 w-full flex items-center justify-center min-h-[calc(100vh-80px)]">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center w-full">
          {/* Left: 标题和动画 */}
          <div className="relative flex flex-col justify-center items-center lg:items-start min-h-[600px]">
            {/* 粒子动画背景 - 围绕标题 */}
            <div className="absolute inset-0 w-full h-full">
              <ParticleAnimation />
            </div>

            {/* 标题 - 上下居中 */}
            <div className="relative z-10 text-center lg:text-left mb-16">
              <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold leading-tight">
                <span className="block text-white/90 mb-2">
                  Hello, I'm
                </span>
                <span className="block text-aurora bg-clip-text text-transparent">
                  Mateo
                </span>
              </h1>
            </div>

            {/* Action Buttons */}
            <div className="relative z-10 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start w-full">
              <a
                href="#about"
                className="glass-card glass-card-hover px-8 py-4 rounded-xl font-medium text-white relative overflow-hidden group text-center"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-aurora-purple/20 to-aurora-cyan/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <span className="relative z-10">了解更多</span>
              </a>
              <a
                href="/moments"
                className="glass-card glass-card-hover px-8 py-4 rounded-xl font-medium text-white/80 border border-white/20 relative overflow-hidden group text-center"
              >
                <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <span className="relative z-10">我的朋友圈</span>
              </a>
            </div>
          </div>

          {/* Right: Widgets */}
          <div className="space-y-6 flex flex-col justify-center">
            <DateTime />
            <TimeProgress />
            <ZhuangDafeiMusic />
          </div>
        </div>
      </div>
    </section>
  );
}
