"use client";

import { motion } from "framer-motion";
import { Mail, Github, Linkedin, Twitter } from "lucide-react";
import { useSmoothInView } from "./useSmoothInView";

const socialLinks = [
  {
    icon: Mail,
    label: "Email",
    href: "mailto:your.email@example.com",
    bgColor: "bg-aurora-purple/10",
    iconColor: "text-aurora-purple",
  },
  {
    icon: Github,
    label: "GitHub",
    href: "https://github.com",
    bgColor: "bg-aurora-blue/10",
    iconColor: "text-aurora-blue",
  },
  {
    icon: Linkedin,
    label: "LinkedIn",
    href: "https://linkedin.com",
    bgColor: "bg-aurora-cyan/10",
    iconColor: "text-aurora-cyan",
  },
  {
    icon: Twitter,
    label: "Twitter",
    href: "https://twitter.com",
    bgColor: "bg-aurora-pink/10",
    iconColor: "text-aurora-pink",
  },
];

export default function Contact() {
  const { ref: titleRef, shouldAnimate: titleShouldAnimate } = useSmoothInView("-100px", 300);
  const { ref: cardRef, shouldAnimate: cardShouldAnimate } = useSmoothInView("-100px", 300);

  return (
    <section id="contact" className="py-20 md:py-32 relative">
      <div className="max-w-4xl mx-auto px-4 md:px-8">
        <motion.div
          ref={titleRef}
          initial={{ opacity: 0, y: 30 }}
          animate={titleShouldAnimate ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gradient mb-4">
            联系我
          </h2>
          <p className="text-white/60 text-lg max-w-2xl mx-auto">
            有项目想法或想聊聊？随时联系我
          </p>
        </motion.div>

        <motion.div
          ref={cardRef}
          initial={{ opacity: 0, y: 30 }}
          animate={cardShouldAnimate ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="glass-card p-8 md:p-12"
        >
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            {socialLinks.map((social, index) => {
              const Icon = social.icon;
              const { ref: linkRef, shouldAnimate: linkShouldAnimate } = useSmoothInView("-50px", 300);

              return (
                <motion.a
                  key={social.label}
                  ref={linkRef}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, x: -30, rotateY: -15 }}
                  animate={linkShouldAnimate ? { opacity: 1, x: 0, rotateY: 0 } : { opacity: 0, x: -30, rotateY: -15 }}
                  transition={{
                    delay: index * 0.1,
                    duration: 0.6,
                    type: "spring",
                    stiffness: 100,
                  }}
                  className="glass-card glass-card-hover p-6 flex items-center gap-4 group relative overflow-hidden"
                  whileHover={{
                    scale: 1.03,
                    y: -5,
                    rotateY: 5,
                    transition: { duration: 0.3 },
                  }}
                  whileTap={{ scale: 0.97 }}
                >
                  <motion.div
                    className={`p-3 rounded-xl ${social.bgColor} relative z-10`}
                    whileHover={{
                      rotate: [0, -10, 10, -10, 0],
                      scale: 1.1,
                      transition: { duration: 0.5 },
                    }}
                  >
                    <Icon className={`w-6 h-6 ${social.iconColor}`} />
                  </motion.div>
                  <div className="relative z-10">
                    <div className="text-white font-medium">{social.label}</div>
                    <motion.div
                      className="text-white/40 text-sm"
                      whileHover={{ x: 5 }}
                      transition={{ duration: 0.2 }}
                    >
                      点击访问
                    </motion.div>
                  </div>
                  <motion.div
                    className={`absolute inset-0 bg-gradient-to-r ${social.bgColor} opacity-0 group-hover:opacity-30 transition-opacity duration-500`}
                  />
                </motion.a>
              );
            })}
          </div>

          {/* Contact Form Placeholder */}
          <div className="mt-8 pt-8 border-t border-white/10">
            <p className="text-white/60 text-center mb-6">
              或者直接发送邮件到{" "}
              <a
                href="mailto:your.email@example.com"
                className="text-aurora-purple hover:underline"
              >
                your.email@example.com
              </a>
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

