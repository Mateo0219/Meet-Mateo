"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Camera, Coffee, Music, Book, Plane, Heart } from "lucide-react";
import { useSmoothInView } from "./useSmoothInView";

const lifestyleItems = [
  {
    icon: Camera,
    title: "摄影",
    description: "用镜头记录生活的美好瞬间",
    bgColor: "bg-aurora-purple/10",
    iconColor: "text-aurora-purple",
  },
  {
    icon: Coffee,
    title: "咖啡",
    description: "享受每一杯精心制作的咖啡时光",
    bgColor: "bg-aurora-pink/10",
    iconColor: "text-aurora-pink",
  },
  {
    icon: Music,
    title: "音乐",
    description: "让旋律陪伴每一个创作时刻",
    bgColor: "bg-aurora-blue/10",
    iconColor: "text-aurora-blue",
  },
  {
    icon: Book,
    title: "阅读",
    description: "在文字中寻找灵感和智慧",
    bgColor: "bg-aurora-cyan/10",
    iconColor: "text-aurora-cyan",
  },
  {
    icon: Plane,
    title: "旅行",
    description: "探索世界，发现新的可能性",
    bgColor: "bg-aurora-purple/10",
    iconColor: "text-aurora-purple",
  },
  {
    icon: Heart,
    title: "生活",
    description: "平衡工作与生活，享受当下",
    bgColor: "bg-aurora-pink/10",
    iconColor: "text-aurora-pink",
  },
];

const moments = [
  {
    title: "晨间时光",
    description: "一杯咖啡，一段代码，开启新的一天",
    gradient: "from-aurora-purple/20 to-aurora-blue/20",
  },
  {
    title: "创作时刻",
    description: "专注而沉浸，将想法转化为现实",
    gradient: "from-aurora-cyan/20 to-aurora-pink/20",
  },
  {
    title: "生活瞬间",
    description: "记录日常，感受生活的温度",
    gradient: "from-aurora-blue/20 to-aurora-purple/20",
  },
];

export default function Lifestyle() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [50, -50]);
  const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [0.3, 1, 0.3]);

  function AnimatedDot({ delay }: { delay: number }) {
    const { ref: dotRef, shouldAnimate: dotShouldAnimate } = useSmoothInView("0px", 200);

    return (
      <motion.div
        ref={dotRef}
        initial={{ scale: 0 }}
        animate={dotShouldAnimate ? { scale: 1 } : { scale: 0 }}
        transition={{
          delay,
          type: "spring",
          stiffness: 200,
        }}
        className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm mb-6 flex items-center justify-center"
      >
        <div className="w-2 h-2 rounded-full bg-white/60" />
      </motion.div>
    );
  }

  function LifestyleTitleSection() {
    const { ref: titleRef, shouldAnimate: titleShouldAnimate } = useSmoothInView("-100px", 300);
    const { ref: h2Ref, shouldAnimate: h2ShouldAnimate } = useSmoothInView("0px", 200);
    const { ref: pRef, shouldAnimate: pShouldAnimate } = useSmoothInView("0px", 200);

    return (
      <motion.div
        ref={titleRef}
        initial={{ opacity: 0, y: 30 }}
        animate={titleShouldAnimate ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
        transition={{ duration: 0.8 }}
        className="text-center mb-16"
      >
        <motion.h2
          ref={h2Ref}
          className="text-4xl md:text-5xl font-bold text-gradient mb-4"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={h2ShouldAnimate ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.6 }}
        >
          生活与兴趣
        </motion.h2>
        <motion.p
          ref={pRef}
          className="text-white/60 text-lg max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 10 }}
          animate={pShouldAnimate ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          工作之外，我享受生活的每一个瞬间
        </motion.p>
      </motion.div>
    );
  }

  return (
    <section id="lifestyle" className="py-20 md:py-32 relative" ref={ref}>
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <LifestyleTitleSection />

        {/* Interests Grid */}
        <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-4 mb-16">
          {lifestyleItems.map((item, index) => {
            const Icon = item.icon;
            const { ref: itemRef, shouldAnimate: itemShouldAnimate } = useSmoothInView("-50px", 300);

            return (
              <motion.div
                key={item.title}
                ref={itemRef}
                initial={{ opacity: 0, scale: 0.8, rotateY: -15 }}
                animate={itemShouldAnimate ? { opacity: 1, scale: 1, rotateY: 0 } : { opacity: 0, scale: 0.8, rotateY: -15 }}
                transition={{
                  delay: index * 0.1,
                  duration: 0.6,
                  type: "spring",
                  stiffness: 100,
                }}
                whileHover={{
                  scale: 1.05,
                  rotateY: 5,
                  transition: { duration: 0.3 },
                }}
                className="glass-card glass-card-hover p-6 text-center group cursor-pointer"
              >
                <motion.div
                  className={`mb-4 inline-flex p-4 rounded-2xl ${item.bgColor}`}
                  whileHover={{ rotate: [0, -10, 10, -10, 0] }}
                  transition={{ duration: 0.5 }}
                >
                  <Icon className={`w-6 h-6 ${item.iconColor}`} />
                </motion.div>
                <h3 className="text-sm font-semibold text-white mb-2">
                  {item.title}
                </h3>
                <p className="text-xs text-white/50 leading-relaxed">
                  {item.description}
                </p>
              </motion.div>
            );
          })}
        </div>

        {/* Life Moments */}
        <motion.div
          style={{ y, opacity }}
          className="grid md:grid-cols-3 gap-6"
        >
          {moments.map((moment, index) => {
            const { ref: momentRef, shouldAnimate: momentShouldAnimate } = useSmoothInView("-100px", 300);

            return (
              <motion.div
                key={moment.title}
                ref={momentRef}
                initial={{ opacity: 0, y: 50, rotateX: 15 }}
                animate={momentShouldAnimate ? { opacity: 1, y: 0, rotateX: 0 } : { opacity: 0, y: 50, rotateX: 15 }}
                transition={{
                  delay: index * 0.2,
                  duration: 0.8,
                  type: "spring",
                  stiffness: 100,
                }}
              whileHover={{
                y: -10,
                rotateX: -5,
                transition: { duration: 0.4 },
              }}
              className="glass-card glass-card-hover overflow-hidden group relative"
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br ${moment.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
              />
              <div className="relative p-8 md:p-10">
                <AnimatedDot delay={index * 0.2 + 0.3} />
                <h3 className="text-2xl font-semibold text-white mb-3">
                  {moment.title}
                </h3>
                <p className="text-white/60 leading-relaxed">
                  {moment.description}
                </p>
              </div>
            </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}

