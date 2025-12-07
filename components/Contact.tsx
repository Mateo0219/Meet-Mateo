"use client";

import { Mail, Github, Linkedin, Twitter, LucideIcon } from "lucide-react";

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
    href: "https://github.com/mateo0219",
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

interface SocialLinkProps {
  social: {
    icon: LucideIcon;
    label: string;
    href: string;
    bgColor: string;
    iconColor: string;
  };
}

function SocialLink({ social }: SocialLinkProps) {
  const Icon = social.icon;

  return (
    <a
      href={social.href}
      target="_blank"
      rel="noopener noreferrer"
      className="glass-card glass-card-hover p-6 flex items-center gap-4 group relative overflow-hidden"
    >
      <div className={`p-3 rounded-xl ${social.bgColor} relative z-10`}>
        <Icon className={`w-6 h-6 ${social.iconColor}`} />
      </div>
      <div className="relative z-10">
        <div className="text-white font-medium">{social.label}</div>
        <div className="text-white/40 text-sm">
          点击访问
        </div>
      </div>
      <div className={`absolute inset-0 bg-gradient-to-r ${social.bgColor} opacity-0 group-hover:opacity-30 transition-opacity duration-500`} />
    </a>
  );
}

export default function Contact() {
  return (
    <section id="contact" className="py-20 md:py-32 relative">
      <div className="max-w-4xl mx-auto px-4 md:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gradient mb-4">
            联系我
          </h2>
          <p className="text-white/60 text-lg max-w-2xl mx-auto">
            有项目想法或想聊聊？随时联系我
          </p>
        </div>

        <div className="glass-card p-8 md:p-12">
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            {socialLinks.map((social) => (
              <SocialLink key={social.label} social={social} />
            ))}
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
        </div>
      </div>
    </section>
  );
}
