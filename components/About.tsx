"use client";

import { motion } from "framer-motion";
import { User, Code, Heart } from "lucide-react";
import { useSmoothInView } from "./useSmoothInView";

const aboutItems = [
  {
    icon: Code,
    title: "全栈开发",
    description: "从前端到后端，从设计到实现，打造完整的数字解决方案",
  },
  {
    icon: Heart,
    title: "用户体验",
    description: "专注于创造直观、优雅且高效的交互体验",
  },
  {
    icon: User,
    title: "持续学习",
    description: "紧跟技术趋势，不断探索新的可能性和最佳实践",
  },
];

export default function About() {
  const { ref: titleRef, shouldAnimate: titleShouldAnimate } = useSmoothInView("-100px", 300);
  const { ref: infoRef, shouldAnimate: infoShouldAnimate } = useSmoothInView("-100px", 300);

  return (
    <section id="about" className="py-20 md:py-32 relative">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <motion.div
          ref={titleRef}
          initial={{ opacity: 0, y: 30 }}
          animate={titleShouldAnimate ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gradient mb-4">
            关于我
          </h2>
          <p className="text-white/60 text-lg max-w-2xl mx-auto">
            热爱编程，专注于创造有价值的数字产品
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {aboutItems.map((item, index) => {
            const Icon = item.icon;
            const { ref: cardRef, shouldAnimate: cardShouldAnimate } = useSmoothInView("-50px", 300);
            
            return (
              <motion.div
                key={item.title}
                ref={cardRef}
                initial={{ opacity: 0, y: 50, rotateX: -15 }}
                animate={cardShouldAnimate ? { opacity: 1, y: 0, rotateX: 0 } : { opacity: 0, y: 50, rotateX: -15 }}
                transition={{
                  delay: index * 0.15,
                  duration: 0.6,
                  type: "spring",
                  stiffness: 100,
                }}
                whileHover={{
                  y: -8,
                  rotateX: 5,
                  transition: { duration: 0.3 },
                }}
                className="glass-card glass-card-hover p-8 relative overflow-hidden group"
              >
                <motion.div
                  className="absolute top-0 right-0 w-32 h-32 bg-aurora-purple/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  animate={{
                    scale: [1, 1.2, 1],
                    rotate: [0, 90, 0],
                  }}
                  transition={{
                    duration: 8,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
                <motion.div
                  className="mb-4 relative z-10"
                  whileHover={{ scale: 1.1, rotate: [0, -10, 10, 0] }}
                  transition={{ duration: 0.5 }}
                >
                  <Icon className="w-12 h-12 text-aurora-purple" />
                </motion.div>
                <h3 className="text-xl font-semibold text-white mb-3 relative z-10">
                  {item.title}
                </h3>
                <p className="text-white/60 leading-relaxed relative z-10">
                  {item.description}
                </p>
              </motion.div>
            );
          })}
        </div>

        {/* Additional Info */}
        <motion.div
          ref={infoRef}
          initial={{ opacity: 0, y: 30 }}
          animate={infoShouldAnimate ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="mt-16 glass-card p-8 md:p-12"
        >
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-2xl font-semibold text-white mb-4">
                我的故事
              </h3>
              <p className="text-white/60 leading-relaxed mb-4">
                从对技术的热爱开始，我一直在探索如何用代码创造价值。
                我相信好的设计不仅仅是美观，更是要解决实际问题。
              </p>
              <p className="text-white/60 leading-relaxed">
                在每一个项目中，我都致力于创造既美观又实用的解决方案，
                让技术真正服务于用户。
              </p>
            </div>
            <div>
              <h3 className="text-2xl font-semibold text-white mb-4">
                我的价值观
              </h3>
              <ul className="space-y-3 text-white/60">
                <li className="flex items-start gap-3">
                  <span className="text-aurora-purple mt-1">▸</span>
                  <span>代码质量优先，追求优雅的实现</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-aurora-purple mt-1">▸</span>
                  <span>用户为中心，体验至上</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-aurora-purple mt-1">▸</span>
                  <span>持续学习，拥抱变化</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-aurora-purple mt-1">▸</span>
                  <span>团队协作，共同成长</span>
                </li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

