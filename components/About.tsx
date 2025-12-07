"use client";

import { User, Heart, GraduationCap, Briefcase, Award, MapPin, Calendar, LucideIcon } from "lucide-react";

// 个人经历数据
const experiences = [
  {
    icon: GraduationCap,
    period: "2018 - 2022",
    title: "XX大学",
    organization: "XX专业",
    description: "在校期间主修XX专业，积极参与各类活动，培养了良好的学习能力和团队协作精神。",
    color: "text-aurora-blue",
    bgColor: "bg-aurora-blue/10",
  },
  {
    icon: Briefcase,
    period: "2022 - 至今",
    title: "XX公司",
    organization: "XX职位",
    description: "在工作中不断学习和成长，积累了丰富的实践经验，也结识了很多优秀的同事和朋友。",
    color: "text-aurora-purple",
    bgColor: "bg-aurora-purple/10",
  },
  {
    icon: Award,
    period: "2023",
    title: "XX荣誉",
    organization: "XX组织",
    description: "获得了XX荣誉，这是对我努力和成长的认可，也激励我继续前行。",
    color: "text-aurora-pink",
    bgColor: "bg-aurora-pink/10",
  },
];

export default function About() {
  return (
    <section id="about" className="py-20 md:py-32 relative">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gradient mb-4">
            关于我
          </h2>
          <p className="text-white/60 text-lg max-w-2xl mx-auto">
            一个热爱生活、享受当下的人
          </p>
        </div>

        {/* Personal Introduction */}
        <div className="glass-card p-8 md:p-12 mb-12">
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div>
              <h3 className="text-2xl font-semibold text-white mb-4">
                自我介绍
              </h3>
              <p className="text-white/60 leading-relaxed mb-4">
                你好！很高兴认识你。我是一个热爱生活、享受当下的人。
                我相信生活中的每一个瞬间都值得被记录和珍惜。
              </p>
              <p className="text-white/60 leading-relaxed mb-4">
                我喜欢运动，特别是足球和乒乓球。这些运动不仅让我保持健康，
                也让我学会了团队合作和坚持不懈的精神。
              </p>
              <p className="text-white/60 leading-relaxed">
                除了运动，我也喜欢记录生活中的美好瞬间，无论是和朋友一起的时光，
                还是独自思考的时刻，都构成了我生活的一部分。
              </p>
            </div>
            <div>
              <h3 className="text-2xl font-semibold text-white mb-4">
                我的特点
              </h3>
              <ul className="space-y-3 text-white/60">
                <li className="flex items-start gap-3">
                  <span className="text-aurora-purple mt-1">▸</span>
                  <span>热爱运动，享受团队合作的乐趣</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-aurora-purple mt-1">▸</span>
                  <span>积极乐观，对生活充满热情</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-aurora-purple mt-1">▸</span>
                  <span>喜欢记录和分享生活中的美好</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-aurora-purple mt-1">▸</span>
                  <span>珍惜友谊，重视人与人之间的连接</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-aurora-purple mt-1">▸</span>
                  <span>保持学习，不断成长</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Experience Timeline */}
          <div className="mt-12">
            <h3 className="text-2xl font-semibold text-white mb-8">个人经历</h3>
            <div className="space-y-6">
              {experiences.map((exp, index) => {
                const Icon = exp.icon;

                return (
                  <div key={index} className="flex gap-6 relative">
                    {/* Timeline Line */}
                    {index < experiences.length - 1 && (
                      <div className="absolute left-6 top-16 bottom-0 w-0.5 bg-white/10" />
                    )}

                    {/* Icon */}
                    <div className={`flex-shrink-0 w-12 h-12 rounded-full ${exp.bgColor} flex items-center justify-center relative z-10`}>
                      <Icon className={`w-6 h-6 ${exp.color}`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 pb-8">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-2">
                        <h4 className="text-xl font-semibold text-white">{exp.title}</h4>
                        <span className="text-sm text-white/40">{exp.period}</span>
                      </div>
                      <p className="text-aurora-purple mb-2">{exp.organization}</p>
                      <p className="text-white/60 leading-relaxed">{exp.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
