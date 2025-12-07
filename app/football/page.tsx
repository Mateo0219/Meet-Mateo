import Header from "@/components/Header";
import Link from "next/link";
import { ArrowLeft, Calendar, MapPin, Trophy, Activity, Users } from "lucide-react";

// 足球队数据
const footballData = {
  title: "我的足球队",
  period: "2019 - 至今",
  location: "XX大学足球队",
  description: "从大学开始加入足球队，一直坚持到现在。足球不仅是一项运动，更是一种生活方式。在球场上，我学会了团队合作、坚持不懈和永不放弃的精神。",
  achievements: [
    "2019年校足球联赛冠军",
    "2021年最佳球员",
    "2023年团队协作奖",
    "2022年最佳射手",
    "2023年联赛亚军",
  ],
  teamMembers: [
    { name: "队友1", role: "前锋" },
    { name: "队友2", role: "中场" },
    { name: "队友3", role: "后卫" },
    { name: "队友4", role: "门将" },
  ],
  recentMatches: [
    {
      date: "2024-01-20",
      opponent: "XX队",
      result: "3:2",
      status: "胜利",
    },
    {
      date: "2024-01-15",
      opponent: "YY队",
      result: "1:1",
      status: "平局",
    },
    {
      date: "2024-01-10",
      opponent: "ZZ队",
      result: "2:0",
      status: "胜利",
    },
  ],
};

export default function FootballPage() {
  return (
    <main className="min-h-screen">
      <Header />
      
      <section className="py-20 md:py-32 relative">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          {/* Back Button */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-8"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>返回首页</span>
          </Link>

          {/* Title */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-aurora-purple/10 mb-6">
              <Activity className="w-10 h-10 text-aurora-purple" />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-gradient mb-4">
              {footballData.title}
            </h1>
            <div className="flex items-center justify-center gap-4 text-white/60">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                <span>{footballData.period}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                <span>{footballData.location}</span>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="glass-card p-8 md:p-12 mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">关于足球队</h2>
            <p className="text-white/60 leading-relaxed mb-8">{footballData.description}</p>

            {/* Achievements */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Trophy className="w-6 h-6 text-aurora-purple" />
                主要成就
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                {footballData.achievements.map((achievement, index) => (
                  <div
                    key={index}
                    className="glass-card glass-card-hover p-4 flex items-center gap-3"
                  >
                    <div className="w-2 h-2 rounded-full bg-aurora-purple" />
                    <span className="text-white/80">{achievement}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Team Members */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Users className="w-6 h-6 text-aurora-purple" />
                团队成员
              </h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                {footballData.teamMembers.map((member, index) => (
                  <div
                    key={index}
                    className="glass-card glass-card-hover p-4 text-center"
                  >
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-aurora-purple to-aurora-cyan mx-auto mb-3 flex items-center justify-center text-white font-bold text-xl">
                      {member.name.charAt(0)}
                    </div>
                    <h4 className="text-white font-medium mb-1">{member.name}</h4>
                    <p className="text-white/60 text-sm">{member.role}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Matches */}
            <div>
              <h3 className="text-xl font-semibold text-white mb-4">最近比赛</h3>
              <div className="space-y-3">
                {footballData.recentMatches.map((match, index) => (
                  <div
                    key={index}
                    className="glass-card glass-card-hover p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-white/40 text-sm">{match.date}</div>
                      <div className="text-white font-medium">vs {match.opponent}</div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-white font-bold">{match.result}</div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs ${
                          match.status === "胜利"
                            ? "bg-green-500/20 text-green-400"
                            : match.status === "平局"
                            ? "bg-yellow-500/20 text-yellow-400"
                            : "bg-red-500/20 text-red-400"
                        }`}
                      >
                        {match.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

