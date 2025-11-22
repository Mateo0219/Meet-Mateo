"use client";

import { motion } from "framer-motion";
import { ExternalLink, Github } from "lucide-react";
import { useSmoothInView } from "./useSmoothInView";

const projects = [
  {
    title: "项目名称 1",
    description: "这是一个优秀的项目，展示了我的开发能力和设计理念。",
    tags: ["React", "Next.js", "TypeScript"],
    image: "/project1.jpg",
    github: "https://github.com",
    demo: "https://demo.com",
  },
  {
    title: "项目名称 2",
    description: "另一个令人印象深刻的项目，体现了对用户体验的关注。",
    tags: ["React", "Tailwind CSS", "Framer Motion"],
    image: "/project2.jpg",
    github: "https://github.com",
    demo: "https://demo.com",
  },
  {
    title: "项目名称 3",
    description: "第三个项目展示了我在全栈开发方面的能力。",
    tags: ["Next.js", "Node.js", "Database"],
    image: "/project3.jpg",
    github: "https://github.com",
    demo: "https://demo.com",
  },
];

export default function Projects() {
  const { ref: titleRef, shouldAnimate: titleShouldAnimate } = useSmoothInView("-100px", 300);

  return (
    <section id="projects" className="py-20 md:py-32 relative">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <motion.div
          ref={titleRef}
          initial={{ opacity: 0, y: 30 }}
          animate={titleShouldAnimate ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gradient mb-4">
            精选项目
          </h2>
          <p className="text-white/60 text-lg max-w-2xl mx-auto">
            探索我的一些最佳作品
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project, index) => {
            const { ref: cardRef, shouldAnimate: cardShouldAnimate } = useSmoothInView("-50px", 300);

            return (
              <motion.div
                key={project.title}
                ref={cardRef}
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                animate={cardShouldAnimate ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 50, scale: 0.9 }}
                transition={{
                  delay: index * 0.1,
                  duration: 0.6,
                  type: "spring",
                  stiffness: 100,
                }}
              whileHover={{
                y: -10,
                transition: { duration: 0.3 },
              }}
              className="glass-card glass-card-hover overflow-hidden group cursor-pointer"
            >
              {/* Project Image Placeholder with Animation */}
              <motion.div
                className="aspect-video bg-gradient-to-br from-aurora-purple/20 to-aurora-cyan/20 relative overflow-hidden"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.4 }}
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-aurora-purple/30 to-aurora-cyan/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  animate={{
                    backgroundPosition: ["0% 0%", "100% 100%"],
                  }}
                  transition={{
                    duration: 5,
                    repeat: Infinity,
                    repeatType: "reverse",
                    ease: "easeInOut",
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.span
                    className="text-white/20 text-4xl font-bold"
                    whileHover={{ scale: 1.1, opacity: 0.4 }}
                  >
                    {project.title}
                  </motion.span>
                </div>
              </motion.div>

              <div className="p-6">
                <h3 className="text-xl font-semibold text-white mb-2">
                  {project.title}
                </h3>
                <p className="text-white/60 mb-4 text-sm leading-relaxed">
                  {project.description}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {project.tags.map((tag, tagIndex) => {
                    const { ref: tagRef, shouldAnimate: tagShouldAnimate } = useSmoothInView("0px", 200);

                    return (
                      <motion.span
                        key={tag}
                        ref={tagRef}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={tagShouldAnimate ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0 }}
                        transition={{
                          delay: index * 0.1 + tagIndex * 0.1,
                          type: "spring",
                          stiffness: 200,
                        }}
                        whileHover={{ scale: 1.1, y: -2 }}
                        className="px-3 py-1 text-xs rounded-full bg-white/5 text-white/60 border border-white/10 cursor-default"
                      >
                        {tag}
                      </motion.span>
                    );
                  })}
                </div>

                {/* Links */}
                <div className="flex items-center gap-4">
                  <motion.a
                    href={project.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Github className="w-4 h-4" />
                    <span className="text-sm">代码</span>
                  </motion.a>
                  <motion.a
                    href={project.demo}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span className="text-sm">演示</span>
                  </motion.a>
                </div>
              </div>
            </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

