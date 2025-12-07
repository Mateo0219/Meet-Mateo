"use client";

import Link from "next/link";
import { Calendar, MapPin, Trophy, ArrowRight, Activity } from "lucide-react";

// 乒乓球经历数据
const tableTennisData = {
  title: "乒乓球经历",
  period: "2020 - 至今",
  location: "XX乒乓球俱乐部",
  description: "乒乓球是我最热爱的运动之一。这项运动需要快速的反应、精准的控制和持久的专注力。通过乒乓球，我不仅锻炼了身体，也培养了耐心和专注力。",
  achievements: [
    "2021年俱乐部锦标赛亚军",
    "2022年最佳进步奖",
    "2023年单打比赛季军",
  ],
};

export default function Lifestyle() {
  return (
    <section id="lifestyle" className="py-20 md:py-32 relative">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gradient mb-4">
            日常生活
          </h2>
          <p className="text-white/60 text-lg max-w-2xl mx-auto">
            运动是我生活的重要组成部分，足球和乒乓球让我保持活力，也让我结识了很多志同道合的朋友
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* 足球队卡片 - 跳转到独立页面 */}
          <Link href="/football" className="glass-card glass-card-hover overflow-hidden group relative block">
            <div className="absolute inset-0 bg-gradient-to-br from-aurora-purple/20 to-aurora-blue/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <div className="relative p-6 md:p-8">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-aurora-purple/10">
                    <Activity className="w-6 h-6 text-aurora-purple" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-semibold text-white mb-1">足球队经历</h3>
                    <div className="flex items-center gap-2 text-white/40 text-sm">
                      <Calendar className="w-4 h-4" />
                      <span>2019 - 至今</span>
                    </div>
                    <div className="flex items-center gap-2 text-white/40 text-sm mt-1">
                      <MapPin className="w-4 h-4" />
                      <span>XX大学足球队</span>
                    </div>
                  </div>
                </div>
                <span className="px-3 py-1 text-xs rounded-full bg-white/5 text-white/60 border border-white/10">
                  足球
                </span>
              </div>

              <p className="text-white/60 leading-relaxed mb-6">
                从大学开始加入足球队，一直坚持到现在。足球不仅是一项运动，更是一种生活方式。
                在球场上，我学会了团队合作、坚持不懈和永不放弃的精神。
              </p>

              <div className="flex items-center gap-2 text-aurora-purple group-hover:gap-3 transition-all">
                <span className="font-medium">查看详情</span>
                <ArrowRight className="w-5 h-5" />
              </div>
            </div>
          </Link>

          {/* 乒乓球卡片 */}
          <div className="glass-card glass-card-hover overflow-hidden group relative">
            <div className="absolute inset-0 bg-gradient-to-br from-aurora-cyan/20 to-aurora-pink/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <div className="relative p-6 md:p-8">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-aurora-purple/10">
                    <Trophy className="w-6 h-6 text-aurora-purple" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-semibold text-white mb-1">{tableTennisData.title}</h3>
                    <div className="flex items-center gap-2 text-white/40 text-sm">
                      <Calendar className="w-4 h-4" />
                      <span>{tableTennisData.period}</span>
                    </div>
                    <div className="flex items-center gap-2 text-white/40 text-sm mt-1">
                      <MapPin className="w-4 h-4" />
                      <span>{tableTennisData.location}</span>
                    </div>
                  </div>
                </div>
                <span className="px-3 py-1 text-xs rounded-full bg-white/5 text-white/60 border border-white/10">
                  乒乓球
                </span>
              </div>

              <p className="text-white/60 leading-relaxed mb-6">{tableTennisData.description}</p>

              {/* Achievements */}
              <div>
                <h4 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-aurora-purple" />
                  主要成就
                </h4>
                <ul className="space-y-2">
                  {tableTennisData.achievements.map((achievement, index) => (
                    <li key={index} className="flex items-start gap-3 text-white/60">
                      <span className="text-aurora-purple mt-1">▸</span>
                      <span>{achievement}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* 朋友圈跳转卡片 */}
        <div className="mt-8">
          <Link href="/moments" className="glass-card glass-card-hover p-6 md:p-8 flex items-center justify-between group relative block">
            <div className="absolute inset-0 bg-gradient-to-br from-aurora-blue/20 to-aurora-purple/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative z-10 flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-aurora-purple to-aurora-cyan flex items-center justify-center text-white font-bold text-xl">
                我
              </div>
              <div>
                <h3 className="text-2xl font-semibold text-white mb-1">朋友圈</h3>
                <p className="text-white/60">记录和分享生活中的点点滴滴</p>
              </div>
            </div>
            <ArrowRight className="w-6 h-6 text-aurora-purple group-hover:translate-x-2 transition-transform relative z-10" />
          </Link>
        </div>
      </div>
    </section>
  );
}
