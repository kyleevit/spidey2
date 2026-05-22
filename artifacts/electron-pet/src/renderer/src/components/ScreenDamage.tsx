import { useEffect, useRef } from "react";
import type { DamageEvent } from "../state/petState";

type Props = { events: DamageEvent[]; screenW: number; screenH: number };

export default function ScreenDamage({ events, screenW, screenH }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = screenW;
    canvas.height = screenH;
    ctx.clearRect(0, 0, screenW, screenH);

    if (events.length === 0) return;

    for (const ev of events) {
      const a = Math.max(0, Math.min(1, ev.opacity));
      ctx.save();
      ctx.translate(ev.x, ev.y);
      ctx.rotate(ev.angle);
      ctx.globalAlpha = a;

      switch (ev.type) {
        case "bite": {
          const r = ev.size;
          const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
          grad.addColorStop(0, "rgba(0,0,0,0.97)");
          grad.addColorStop(0.55, "rgba(5,2,8,0.85)");
          grad.addColorStop(1, "rgba(0,0,0,0)");
          ctx.fillStyle = grad;
          ctx.beginPath();
          const sides = 7 + Math.floor(Math.abs(Math.sin(ev.id * 13)) * 4);
          for (let i = 0; i < sides; i++) {
            const ang = (Math.PI * 2 * i) / sides;
            const jit = 0.45 + 0.55 * Math.abs(Math.sin(ev.id * 7 + i * 3));
            const px = Math.cos(ang) * r * jit;
            const py = Math.sin(ang) * r * jit;
            if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
          }
          ctx.closePath();
          ctx.fill();
          const glowG = ctx.createRadialGradient(0, 0, r * 0.55, 0, 0, r * 1.35);
          glowG.addColorStop(0, "rgba(0,0,0,0)");
          glowG.addColorStop(0.5, `rgba(${ev.id % 3 === 0 ? "160,25,5" : "70,15,5"},0.35)`);
          glowG.addColorStop(1, "rgba(0,0,0,0)");
          ctx.fillStyle = glowG;
          ctx.beginPath();
          ctx.arc(0, 0, r * 1.35, 0, Math.PI * 2);
          ctx.fill();
          break;
        }

        case "crack": {
          ctx.strokeStyle = `rgba(70,25,8,${a * 0.75})`;
          ctx.lineWidth = 1.5;
          const branches = 4 + Math.floor(Math.abs(Math.sin(ev.id * 5)) * 5);
          for (let b = 0; b < branches; b++) {
            const baseAngle = (Math.PI * 2 * b) / branches + Math.sin(ev.id + b) * 0.5;
            ctx.beginPath();
            let cx = 0, cy = 0;
            const segs = 3 + Math.floor(Math.abs(Math.sin(ev.id + b)) * 3);
            for (let s = 0; s < segs; s++) {
              const segLen = (ev.size / segs) * (0.7 + Math.random() * 0.9);
              const jit = (Math.random() - 0.5) * 0.55;
              if (s === 0) ctx.moveTo(cx, cy);
              cx += Math.cos(baseAngle + jit) * segLen;
              cy += Math.sin(baseAngle + jit) * segLen;
              ctx.lineTo(cx, cy);
            }
            ctx.stroke();
            if (Math.sin(ev.id * b) > 0.3) {
              ctx.beginPath();
              ctx.moveTo(cx * 0.5, cy * 0.5);
              const sa = baseAngle + 0.7;
              ctx.lineTo(cx * 0.5 + Math.cos(sa) * ev.size * 0.35, cy * 0.5 + Math.sin(sa) * ev.size * 0.35);
              ctx.globalAlpha = a * 0.45;
              ctx.stroke();
              ctx.globalAlpha = a;
            }
          }
          break;
        }

        case "web": {
          const strands = 8, rings = 5, r = ev.size;
          ctx.strokeStyle = `rgba(180,140,60,${a * 0.55})`;
          ctx.lineWidth = 0.9;
          for (let s = 0; s < strands; s++) {
            const ang = (Math.PI * 2 * s) / strands;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(Math.cos(ang) * r, Math.sin(ang) * r);
            ctx.stroke();
          }
          for (let ring = 1; ring <= rings; ring++) {
            const rr = (r / rings) * ring;
            ctx.beginPath();
            for (let s = 0; s < strands; s++) {
              const a1 = (Math.PI * 2 * s) / strands;
              const a2 = (Math.PI * 2 * (s + 1)) / strands;
              const x1 = Math.cos(a1) * rr, y1 = Math.sin(a1) * rr;
              const x2 = Math.cos(a2) * rr, y2 = Math.sin(a2) * rr;
              if (s === 0) ctx.moveTo(x1, y1);
              ctx.quadraticCurveTo((x1 + x2) / 2 * 1.05, (y1 + y2) / 2 * 1.05, x2, y2);
            }
            ctx.stroke();
          }
          break;
        }

        case "scratch": {
          const len = ev.size;
          ctx.strokeStyle = `rgba(50,20,5,${a * 0.6})`;
          ctx.lineWidth = 2;
          ctx.lineCap = "round";
          const numLines = 3 + Math.floor(Math.abs(Math.sin(ev.id * 3)) * 3);
          for (let n = 0; n < numLines; n++) {
            const off = (n - numLines / 2) * 6;
            ctx.beginPath();
            ctx.globalAlpha = a * (0.5 + Math.random() * 0.5);
            ctx.lineWidth = 0.8 + Math.random() * 1.5;
            // Wavy scratch line
            const segs = 5;
            for (let s = 0; s <= segs; s++) {
              const t = s / segs;
              const wx = Math.cos(0) * len * t + Math.sin(0) * (off + Math.sin(t * Math.PI * 3) * 4);
              const wy = Math.sin(0) * len * t + Math.cos(0) * (off + Math.sin(t * Math.PI * 3) * 4);
              // Rotate to direction (already rotated via ctx.rotate)
              const rx = wx;
              const ry = wy;
              if (s === 0) ctx.moveTo(rx, ry); else ctx.lineTo(rx, ry);
            }
            ctx.stroke();
          }
          ctx.globalAlpha = a;
          break;
        }

        case "smudge": {
          const r = ev.size;
          const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
          grad.addColorStop(0, `rgba(0,0,0,${a * 0.45})`);
          grad.addColorStop(1, "rgba(0,0,0,0)");
          ctx.fillStyle = grad;
          ctx.save();
          ctx.scale(1.6, 0.7);
          ctx.beginPath();
          ctx.arc(0, 0, r, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
          break;
        }

        case "debris": {
          const r = ev.size;
          ctx.fillStyle = `rgba(${20 + Math.floor(Math.sin(ev.id * 7) * 20)},${10 + Math.floor(Math.sin(ev.id * 11) * 10)},5,${a * 0.8})`;
          ctx.beginPath();
          ctx.arc(0, 0, r, 0, Math.PI * 2);
          ctx.fill();
          break;
        }

        case "footprint": {
          // 8 tiny dots in a tarantula foot pattern
          const r = ev.size * 0.5;
          ctx.fillStyle = `rgba(30,15,5,${a})`;
          const footDots: Vec2[] = [
            { x: -r, y: -r * 0.5 }, { x: r, y: -r * 0.5 },
            { x: -r * 1.4, y: 0 }, { x: r * 1.4, y: 0 },
            { x: -r, y: r * 0.5 }, { x: r, y: r * 0.5 },
            { x: 0, y: r * 0.8 },
          ];
          for (const dot of footDots) {
            ctx.beginPath();
            ctx.arc(dot.x, dot.y, r * 0.35, 0, Math.PI * 2);
            ctx.fill();
          }
          break;
        }
      }

      ctx.restore();
    }

    // Vignette darkness
    const severity = Math.min(events.filter(e => e.type === "bite" || e.type === "crack").length / 20, 1);
    if (severity > 0.15) {
      const vig = ctx.createRadialGradient(screenW / 2, screenH / 2, screenH * 0.25, screenW / 2, screenH / 2, Math.max(screenW, screenH) * 0.75);
      vig.addColorStop(0, "rgba(0,0,0,0)");
      vig.addColorStop(1, `rgba(0,0,0,${severity * 0.5})`);
      ctx.fillStyle = vig;
      ctx.globalAlpha = 1;
      ctx.fillRect(0, 0, screenW, screenH);
    }
  }, [events, screenW, screenH]);

  if (events.length === 0) return null;

  return (
    <canvas
      ref={canvasRef}
      style={{ position: "fixed", inset: 0, width: screenW, height: screenH, pointerEvents: "none", zIndex: 10 }}
    />
  );
}

type Vec2 = { x: number; y: number };
