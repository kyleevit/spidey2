import type { Vec2 } from "../state/petState";

export function moveToward(
  pos: Vec2, target: Vec2, speed: number, dt: number
): { pos: Vec2; dir: number; arrived: boolean } {
  const dx = target.x - pos.x;
  const dy = target.y - pos.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist < 6) return { pos: { ...target }, dir: Math.atan2(dy, dx), arrived: true };
  const step = Math.min(speed * dt, dist);
  const dir = Math.atan2(dy, dx);
  return {
    pos: { x: pos.x + Math.cos(dir) * step, y: pos.y + Math.sin(dir) * step },
    dir, arrived: false,
  };
}

export function randomDesktopPoint(sw: number, sh: number, margin = 130): Vec2 {
  return {
    x: margin + Math.random() * (sw - margin * 2),
    y: margin + Math.random() * (sh - margin * 2),
  };
}

export function randomEdgePoint(sw: number, sh: number): Vec2 {
  const edge = Math.floor(Math.random() * 4);
  const pad = 25;
  switch (edge) {
    case 0: return { x: pad + Math.random() * (sw - pad * 2), y: pad };
    case 1: return { x: sw - pad, y: pad + Math.random() * (sh - pad * 2) };
    case 2: return { x: pad + Math.random() * (sw - pad * 2), y: sh - pad };
    default: return { x: pad, y: pad + Math.random() * (sh - pad * 2) };
  }
}

export function randomCornerPoint(sw: number, sh: number): Vec2 {
  const corners: Vec2[] = [
    { x: 60, y: 60 }, { x: sw - 60, y: 60 },
    { x: 60, y: sh - 60 }, { x: sw - 60, y: sh - 60 },
  ];
  return corners[Math.floor(Math.random() * corners.length)];
}

export function awayFromPoint(pos: Vec2, from: Vec2, sw: number, sh: number): Vec2 {
  const dx = pos.x - from.x;
  const dy = pos.y - from.y;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const dist = 250 + Math.random() * 150;
  return {
    x: Math.max(60, Math.min(sw - 60, pos.x + (dx / len) * dist)),
    y: Math.max(60, Math.min(sh - 60, pos.y + (dy / len) * dist)),
  };
}

export function clampToScreen(pos: Vec2, sw: number, sh: number, margin = 70): Vec2 {
  return {
    x: Math.max(margin, Math.min(sw - margin, pos.x)),
    y: Math.max(margin, Math.min(sh - margin, pos.y)),
  };
}

export function addNoise(pos: Vec2, strength = 8): Vec2 {
  return {
    x: pos.x + (Math.random() - 0.5) * strength,
    y: pos.y + (Math.random() - 0.5) * strength,
  };
}
