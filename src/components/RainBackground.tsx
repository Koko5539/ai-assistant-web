'use client';

import { useEffect, useRef } from 'react';

interface Raindrop {
  x: number;
  y: number;
  length: number;
  speed: number;
  opacity: number;
}

export default function RainBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lightningRef = useRef<HTMLDivElement>(null);
  const raindropsRef = useRef<Raindrop[]>([]);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 设置画布尺寸
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // 初始化雨滴
    const initRaindrops = () => {
      const drops: Raindrop[] = [];
      for (let i = 0; i < 150; i++) {
        drops.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          length: Math.random() * 30 + 10,
          speed: Math.random() * 15 + 10,
          opacity: Math.random() * 0.5 + 0.3,
        });
      }
      raindropsRef.current = drops;
    };
    initRaindrops();

    // 动画循环
    const animate = () => {
      // 清空画布 - 半透明黑色背景（产生拖尾效果）
      ctx.fillStyle = 'rgba(10, 15, 30, 0.3)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 绘制雨滴
      raindropsRef.current.forEach((drop) => {
        // 绘制雨滴线条
        const gradient = ctx.createLinearGradient(drop.x, drop.y, drop.x, drop.y + drop.length);
        gradient.addColorStop(0, `rgba(200, 220, 255, 0)`);
        gradient.addColorStop(0.5, `rgba(200, 220, 255, ${drop.opacity})`);
        gradient.addColorStop(1, `rgba(200, 220, 255, 0)`);

        ctx.beginPath();
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 1.5;
        ctx.moveTo(drop.x, drop.y);
        ctx.lineTo(drop.x, drop.y + drop.length);
        ctx.stroke();

        // 更新位置
        drop.y += drop.speed;

        // 超出屏幕重置
        if (drop.y > canvas.height) {
          drop.y = -drop.length;
          drop.x = Math.random() * canvas.width;
        }
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    // 闪电效果 - 每3秒触发
    const triggerLightning = () => {
      const lightning = lightningRef.current;
      if (!lightning) return;

      // 闪电序列：闪-灭-闪-灭
      const sequence = [
        { opacity: 0.8, duration: 50 },
        { opacity: 0, duration: 50 },
        { opacity: 0.4, duration: 100 },
        { opacity: 0, duration: 50 },
        { opacity: 0.6, duration: 80 },
        { opacity: 0, duration: 0 },
      ];

      let delay = 0;
      sequence.forEach((step) => {
        setTimeout(() => {
          lightning.style.opacity = step.opacity.toString();
        }, delay);
        delay += step.duration;
      });
    };

    const lightningInterval = setInterval(triggerLightning, 3000);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      clearInterval(lightningInterval);
    };
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden">
      {/* 深色背景 */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900" />

      {/* Canvas雨景 */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0"
        style={{ mixBlendMode: 'screen' }}
      />

      {/* 闪电覆盖层 */}
      <div
        ref={lightningRef}
        className="absolute inset-0 bg-white pointer-events-none transition-opacity duration-75"
        style={{ opacity: 0 }}
      />

      {/* 暗角效果 */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.4) 100%)',
        }}
      />
    </div>
  );
}
