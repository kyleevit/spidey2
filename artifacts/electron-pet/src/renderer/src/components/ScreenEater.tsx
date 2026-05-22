import { useEffect, useRef } from "react";

type Props = { percent: number };

export default function ScreenEater({ percent }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || percent === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const w = canvas.width;
    const h = canvas.height;
    const intensity = percent / 100;

    ctx.strokeStyle = `rgba(180, 140, 60, ${0.5 + intensity * 0.4})`;
    ctx.lineWidth = 0.8;

    const drawWeb = (cx: number, cy: number, maxR: number, strands: number) => {
      const rings = Math.floor(4 + intensity * 6);
      for (let ring = 1; ring <= rings; ring++) {
        const r = (maxR / rings) * ring;
        ctx.beginPath();
        for (let s = 0; s < strands; s++) {
          const angle = ((Math.PI * 2) / strands) * s;
          const prevAngle = ((Math.PI * 2) / strands) * (s - 1);
          const x1 = cx + Math.cos(angle) * r;
          const y1 = cy + Math.sin(angle) * r;
          const x2 = cx + Math.cos(prevAngle) * r;
          const y2 = cy + Math.sin(prevAngle) * r;
          if (s === 0) ctx.moveTo(x1, y1);
          else {
            const mx = (x1 + x2) / 2;
            const my = (y1 + y2) / 2;
            ctx.quadraticCurveTo(mx, my, x1, y1);
          }
        }
        ctx.closePath();
        ctx.stroke();
      }

      for (let s = 0; s < strands; s++) {
        const angle = ((Math.PI * 2) / strands) * s;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(angle) * maxR, cy + Math.sin(angle) * maxR);
        ctx.stroke();
      }
    };

    const coverage = intensity;
    if (coverage > 0) drawWeb(-20, -20, Math.max(80, w * coverage * 0.8), 8);
    if (coverage > 0.2) drawWeb(w + 20, -20, Math.max(80, w * (coverage - 0.2) * 0.9), 8);
    if (coverage > 0.4) drawWeb(-20, h + 20, Math.max(80, h * (coverage - 0.4) * 1.0), 7);
    if (coverage > 0.5) drawWeb(w + 20, h + 20, Math.max(80, h * (coverage - 0.5) * 1.1), 7);
    if (coverage > 0.7) drawWeb(w / 2, -20, Math.max(60, w * (coverage - 0.7) * 1.5), 6);
    if (coverage > 0.85) drawWeb(w / 2, h + 20, Math.max(60, h * (coverage - 0.85) * 2), 6);

    const overlayOpacity = intensity * 0.75;
    const grad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h));
    grad.addColorStop(0, `rgba(0,0,0,0)`);
    grad.addColorStop(0.5, `rgba(5,2,12,${overlayOpacity * 0.3})`);
    grad.addColorStop(1, `rgba(5,2,12,${overlayOpacity})`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  }, [percent]);

  if (percent === 0) return null;

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-50 animate-[web-spin_1s_ease-out]"
      style={{ borderRadius: "inherit" }}
    />
  );
}
