"use client";

import { motion } from "framer-motion";
import { Code2, Palette, Database, Smartphone } from "lucide-react";
import { useSmoothInView } from "./useSmoothInView";

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

export default function Skills() {
  const { ref: titleRef, shouldAnimate: titleShouldAnimate } = useSmoothInView("-100px", 300);

  return (
    <section id="skills" className="py-20 md:py-32 relative">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <motion.div
          ref={titleRef}
          initial={{ opacity: 0, y: 30 }}
          animate={titleShouldAnimate ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gradient mb-4">
            技能专长
          </h2>
          <p className="text-white/60 text-lg max-w-2xl mx-auto">
            掌握现代 Web 开发的核心技术栈
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {skillCategories.map((category, index) => {
            const Icon = category.icon;
            const { ref: cardRef, shouldAnimate: cardShouldAnimate } = useSmoothInView("-50px", 300);

            return (
              <motion.div
                key={category.title}
                ref={cardRef}
                initial={{ opacity: 0, y: 50, rotateX: -15 }}
                animate={cardShouldAnimate ? { opacity: 1, y: 0, rotateX: 0 } : { opacity: 0, y: 50, rotateX: -15 }}
                transition={{
                  delay: index * 0.1,
                  duration: 0.6,
                  type: "spring",
                  stiffness: 100,
                }}
                whileHover={{
                  y: -8,
                  rotateX: 5,
                  transition: { duration: 0.3 },
                }}
                className="glass-card glass-card-hover p-6 relative overflow-hidden group"
              >
                <motion.div
                  className={`mb-4 inline-flex p-3 rounded-xl ${category.bgColor} relative z-10`}
                  whileHover={{
                    scale: 1.1,
                    rotate: [0, -5, 5, 0],
                    transition: { duration: 0.5 },
                  }}
                >
                  <Icon className={`w-8 h-8 ${category.iconColor}`} />
                </motion.div>
                <h3 className="text-xl font-semibold text-white mb-4 relative z-10">
                  {category.title}
                </h3>
                <ul className="space-y-2 relative z-10">
                  {category.skills.map((skill, skillIndex) => {
                    const { ref: skillRef, shouldAnimate: skillShouldAnimate } = useSmoothInView("0px", 200);

                    return (
                      <motion.li
                        key={skill}
                        ref={skillRef}
                        initial={{ opacity: 0, x: -10 }}
                        animate={skillShouldAnimate ? { opacity: 1, x: 0 } : { opacity: 0, x: -10 }}
                        transition={{
                          delay: index * 0.1 + skillIndex * 0.1,
                          duration: 0.4,
                        }}
                        whileHover={{ x: 5, transition: { duration: 0.2 } }}
                        className="text-white/60 flex items-center gap-2 cursor-default"
                      >
                        <motion.span
                          className={`w-1.5 h-1.5 rounded-full ${category.dotColor}`}
                          whileHover={{ scale: 1.5 }}
                          transition={{ duration: 0.2 }}
                        />
                        {skill}
                      </motion.li>
                    );
                  })}
                </ul>
                <motion.div
                  className={`absolute inset-0 bg-gradient-to-br ${category.bgColor} opacity-0 group-hover:opacity-20 transition-opacity duration-500`}
                />
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

