"use client";

import { Code2, Palette, Database, Smartphone, LucideIcon } from "lucide-react";

const skillCategories = [
  {
    icon: Code2,
    title: "前端开发",
    skills: ["React", "Next.js", "TypeScript", "Tailwind CSS"],
    bgColor: "bg-aurora-purple/10",
    iconColor: "text-aurora-purple",
    dotColor: "bg-aurora-purple",
  },
  {
    icon: Palette,
    title: "设计工具",
    skills: ["Figma", "UI/UX Design", "Design Systems"],
    bgColor: "bg-aurora-pink/10",
    iconColor: "text-aurora-pink",
    dotColor: "bg-aurora-pink",
  },
  {
    icon: Database,
    title: "后端技术",
    skills: ["Node.js", "RESTful API", "Database Design"],
    bgColor: "bg-aurora-blue/10",
    iconColor: "text-aurora-blue",
    dotColor: "bg-aurora-blue",
  },
  {
    icon: Smartphone,
    title: "移动开发",
    skills: ["React Native", "Responsive Design"],
    bgColor: "bg-aurora-cyan/10",
    iconColor: "text-aurora-cyan",
    dotColor: "bg-aurora-cyan",
  },
];

interface SkillCardProps {
  category: {
    icon: LucideIcon;
    title: string;
    skills: string[];
    bgColor: string;
    iconColor: string;
    dotColor: string;
  };
}

function SkillCard({ category }: SkillCardProps) {
  const Icon = category.icon;

  return (
    <div className="glass-card glass-card-hover p-6 relative overflow-hidden group">
      <div className={`mb-4 inline-flex p-3 rounded-xl ${category.bgColor} relative z-10`}>
        <Icon className={`w-8 h-8 ${category.iconColor}`} />
      </div>
      <h3 className="text-xl font-semibold text-white mb-4 relative z-10">
        {category.title}
      </h3>
      <ul className="space-y-2 relative z-10">
        {category.skills.map((skill) => (
          <li key={skill} className="text-white/60 flex items-center gap-2 cursor-default">
            <span className={`w-1.5 h-1.5 rounded-full ${category.dotColor}`} />
            {skill}
          </li>
        ))}
      </ul>
      <div className={`absolute inset-0 bg-gradient-to-br ${category.bgColor} opacity-0 group-hover:opacity-20 transition-opacity duration-500`} />
    </div>
  );
}

export default function Skills() {
  return (
    <section id="skills" className="py-20 md:py-32 relative">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gradient mb-4">
            技能专长
          </h2>
          <p className="text-white/60 text-lg max-w-2xl mx-auto">
            掌握现代 Web 开发的核心技术栈
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {skillCategories.map((category) => (
            <SkillCard key={category.title} category={category} />
          ))}
        </div>
      </div>
    </section>
  );
}
