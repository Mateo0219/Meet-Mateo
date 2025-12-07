"use client";

import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  opacity: number;
}

export default function ParticleAnimation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const particlesRef = useRef<Particle[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 设置画布大小
    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // 极光颜色
    const colors = [
      "rgba(139, 92, 246, 0.5)", // aurora-purple
      "rgba(59, 130, 246, 0.5)",  // aurora-blue
      "rgba(6, 182, 212, 0.5)",   // aurora-cyan
      "rgba(236, 72, 153, 0.5)",  // aurora-pink
    ];

    // 计算中心点（标题位置）
    const getCenter = () => {
      return {
        x: canvas.width / 2,
        y: canvas.height / 2 - 40, // 稍微上移，对应标题位置
      };
    };

    // 创建粒子 - 围绕中心点，更大的范围
    const createParticles = () => {
      const particles: Particle[] = [];
      const particleCount = Math.min(70, Math.floor((canvas.width * canvas.height) / 20000));
      const center = getCenter();

      for (let i = 0; i < particleCount; i++) {
        // 围绕中心点创建粒子，范围更大
        const angle = (Math.PI * 2 * i) / particleCount + Math.random() * 0.5;
        const radius = 100 + Math.random() * 180; // 增加范围
        const x = center.x + Math.cos(angle) * radius + (Math.random() - 0.5) * 50;
        const y = center.y + Math.sin(angle) * radius + (Math.random() - 0.5) * 50;

        particles.push({
          x,
          y,
          vx: (Math.random() - 0.5) * 0.25,
          vy: (Math.random() - 0.5) * 0.25,
          radius: Math.random() * 2 + 1, // 更大的粒子
          color: colors[Math.floor(Math.random() * colors.length)],
          opacity: Math.random() * 0.4 + 0.3,
        });
      }
      particlesRef.current = particles;
    };

    createParticles();

    // 绘制粒子
    const drawParticles = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const particles = particlesRef.current;
      const center = getCenter();

      // 绘制连接线 - 更大的连接范围
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 120) { // 增加连接范围
            ctx.beginPath();
            const opacity = 0.15 * (1 - distance / 120);
            ctx.strokeStyle = `rgba(139, 92, 246, ${opacity})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      // 绘制粒子 - 带光晕效果
      particles.forEach((particle) => {
        // 光晕
        const gradient = ctx.createRadialGradient(
          particle.x,
          particle.y,
          0,
          particle.x,
          particle.y,
          particle.radius * 4
        );
        gradient.addColorStop(0, particle.color.replace("0.5", particle.opacity.toString()));
        gradient.addColorStop(0.5, particle.color.replace("0.5", (particle.opacity * 0.5).toString()));
        gradient.addColorStop(1, particle.color.replace("0.5", "0"));
        
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius * 4, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // 核心粒子
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fillStyle = particle.color.replace("0.5", particle.opacity.toString());
        ctx.fill();
      });
    };

    // 更新粒子位置 - 围绕中心点
    const updateParticles = () => {
      const particles = particlesRef.current;
      const center = getCenter();

      particles.forEach((particle) => {
        // 向中心点轻微吸引，形成围绕效果
        const dx = center.x - particle.x;
        const dy = center.y - particle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
          const force = 0.0006;
          particle.vx += (dx / distance) * force;
          particle.vy += (dy / distance) * force;
        }

        particle.x += particle.vx;
        particle.y += particle.vy;

        // 边界反弹
        if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -0.8;
        if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -0.8;

        // 保持在画布内
        particle.x = Math.max(0, Math.min(canvas.width, particle.x));
        particle.y = Math.max(0, Math.min(canvas.height, particle.y));

        // 限制速度
        const maxSpeed = 0.4;
        const speed = Math.sqrt(particle.vx * particle.vx + particle.vy * particle.vy);
        if (speed > maxSpeed) {
          particle.vx = (particle.vx / speed) * maxSpeed;
          particle.vy = (particle.vy / speed) * maxSpeed;
        }
      });
    };

    // 动画循环
    const animate = () => {
      updateParticles();
      drawParticles();
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ background: "transparent" }}
      />
    </div>
  );
}
