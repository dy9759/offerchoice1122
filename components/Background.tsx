import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  radius: number;
  vx: number;
  vy: number;
  originalVx: number;
  originalVy: number;
  alpha: number;
  targetAlpha: number;
  color: string;
}

const Background: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -9999, y: -9999 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];
    let width = window.innerWidth;
    let height = window.innerHeight;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
      initParticles();
    };

    const initParticles = () => {
      particles = [];
      // Responsive particle count
      const particleCount = Math.min(Math.floor(width * 0.1), 150);

      for (let i = 0; i < particleCount; i++) {
        const size = Math.random();
        const vx = (Math.random() - 0.5) * 0.2;
        const vy = (Math.random() - 0.5) * 0.2;
        
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          radius: size * 2 + 0.5,
          vx: vx,
          vy: vy,
          originalVx: vx,
          originalVy: vy,
          alpha: Math.random() * 0.5,
          targetAlpha: Math.random() * 0.5 + 0.1,
          // Mostly white/gray, occasional accent color
          color: Math.random() > 0.95 ? '#818cf8' : '#ffffff' 
        });
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const draw = () => {
      // Clear with opacity for trail effect? No, keeping it crisp looks more modern like the reference.
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, width, height);
      
      // Deep space gradient
      const gradient = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, width);
      gradient.addColorStop(0, '#0f172a'); // Very dark slate
      gradient.addColorStop(1, '#000000');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      particles.forEach((p) => {
        // Physics: Mouse Repulsion
        const dx = p.x - mouseRef.current.x;
        const dy = p.y - mouseRef.current.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const interactionRadius = 250;

        if (distance < interactionRadius) {
          const force = (interactionRadius - distance) / interactionRadius;
          const angle = Math.atan2(dy, dx);
          const push = force * 0.8; // Strength of push

          p.vx += Math.cos(angle) * push;
          p.vy += Math.sin(angle) * push;
        }

        // Physics: Damping (return to normal speed)
        p.vx = p.vx * 0.96 + p.originalVx * 0.04;
        p.vy = p.vy * 0.96 + p.originalVy * 0.04;

        // Update position
        p.x += p.vx;
        p.y += p.vy;

        // Screen wrap
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        // Twinkle alpha
        if (Math.random() > 0.98) {
             p.targetAlpha = Math.random() * 0.8 + 0.1;
        }
        p.alpha += (p.targetAlpha - p.alpha) * 0.05;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color === '#ffffff' 
            ? `rgba(255, 255, 255, ${p.alpha})` 
            : `rgba(129, 140, 248, ${p.alpha})`; // Indigo-400
        ctx.fill();
      });

      // Constellation connections
      ctx.lineWidth = 0.5;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 120) {
            const opacity = (1 - distance / 120) * 0.15;
            ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', handleMouseMove);
    
    resize();
    draw();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-0 w-full h-full bg-black pointer-events-none">
       <canvas ref={canvasRef} className="w-full h-full" />
       {/* Grainy texture overlay for that analog feel */}
       <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay pointer-events-none"></div>
    </div>
  );
};

export default Background;