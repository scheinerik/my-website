import { useEffect, useRef } from "react";

export default function BackgroundLines() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let W, H, points = [];
    const POINT_COUNT = 75;
    const MOUSE = { x: 0, y: 0 };
    let animationFrame;

    function resize() { 
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
      points = Array.from({ length: POINT_COUNT }, () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.8,
      }));
    }

    function distance(a, b) {
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      return Math.sqrt(dx * dx + dy * dy);
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = "rgba(255,255,255,0.8)";
      ctx.shadowBlur = 8;
      ctx.shadowColor = "rgba(0, 255, 255, 0.2)";

      for (const p of points) {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > W) p.vx *= -1;
        if (p.y < 0 || p.y > H) p.vy *= -1;

        // Draw node
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.6, 0, Math.PI * 2);
        ctx.fill();

        // Draw connecting lines
        for (const q of points) {
          const dist = distance(p, q);
          if (dist < 120) {
            const opacity = 1 - dist / 120;
            const hue = (p.x / W) * 360;
            ctx.strokeStyle = `hsla(${hue}, 100%, 70%, ${opacity * 0.25})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.stroke();
          }
        }

        // Mouse repulsion
        const md = distance(p, MOUSE);
        if (md < 150) {
          const pull = (150 - md) / 150;
          p.vx += (p.x - MOUSE.x) * 0.00003 * pull;
          p.vy += (p.y - MOUSE.y) * 0.00003 * pull;
        }
      }

      animationFrame = requestAnimationFrame(draw);
    }

    // Event listeners
    window.addEventListener("mousemove", (e) => {
      MOUSE.x = e.clientX;
      MOUSE.y = e.clientY;
    });
    window.addEventListener("resize", resize);

    resize();
    draw();

    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: -1,
        background: "#0a0f1f",
        pointerEvents: "none",
      }}
    />
  );
}