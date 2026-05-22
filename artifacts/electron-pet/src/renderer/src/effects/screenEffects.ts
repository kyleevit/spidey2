import type { DamageEvent, Vec2, ChaosLevel } from "../state/petState";
import { CHAOS_MULT } from "../state/petState";

let nextId = 1;

export function makeBite(x: number, y: number, intensity = 1): DamageEvent {
  return {
    id: nextId++,
    type: "bite",
    x: x + (Math.random() - 0.5) * 60,
    y: y + (Math.random() - 0.5) * 60,
    size: (30 + Math.random() * 50) * intensity,
    angle: Math.random() * Math.PI * 2,
    opacity: 0.7 + Math.random() * 0.3,
  };
}

export function makeCrack(x: number, y: number, intensity = 1): DamageEvent {
  return {
    id: nextId++,
    type: "crack",
    x: x + (Math.random() - 0.5) * 80,
    y: y + (Math.random() - 0.5) * 80,
    size: (40 + Math.random() * 80) * intensity,
    angle: Math.random() * Math.PI * 2,
    opacity: 0.5 + Math.random() * 0.4,
  };
}

export function makeWeb(x: number, y: number): DamageEvent {
  return {
    id: nextId++,
    type: "web",
    x,
    y,
    size: 60 + Math.random() * 80,
    angle: Math.random() * Math.PI * 2,
    opacity: 0.4 + Math.random() * 0.35,
  };
}

export function makeScratch(x: number, y: number, dir: number): DamageEvent {
  return {
    id: nextId++,
    type: "scratch",
    x,
    y,
    size: 60 + Math.random() * 100,
    angle: dir + (Math.random() - 0.5) * 0.8,
    opacity: 0.4 + Math.random() * 0.35,
  };
}

export function makeSmudge(x: number, y: number): DamageEvent {
  return {
    id: nextId++,
    type: "smudge",
    x: x + (Math.random() - 0.5) * 100,
    y: y + (Math.random() - 0.5) * 100,
    size: 25 + Math.random() * 45,
    angle: Math.random() * Math.PI * 2,
    opacity: 0.2 + Math.random() * 0.25,
  };
}

export function makeDebris(x: number, y: number): DamageEvent {
  return {
    id: nextId++,
    type: "debris",
    x: x + (Math.random() - 0.5) * 200,
    y: y + (Math.random() - 0.5) * 150,
    size: 2 + Math.random() * 6,
    angle: Math.random() * Math.PI * 2,
    opacity: 0.5 + Math.random() * 0.5,
  };
}

export function makeFootprint(x: number, y: number, dir: number): DamageEvent {
  return {
    id: nextId++,
    type: "footprint",
    x: x + (Math.random() - 0.5) * 20,
    y: y + (Math.random() - 0.5) * 20,
    size: 8 + Math.random() * 6,
    angle: dir,
    opacity: 0.12 + Math.random() * 0.12,
  };
}

export function applyScreenBite(
  pos: Vec2,
  events: DamageEvent[],
  chaos: ChaosLevel,
  behavior: string
): DamageEvent[] {
  const mult = CHAOS_MULT[chaos];
  const newEvents: DamageEvent[] = [];
  const isRage = behavior === "rage";
  const intensity = isRage ? 1.5 * mult : mult;

  newEvents.push(makeBite(pos.x, pos.y, intensity));

  if (Math.random() < 0.6) newEvents.push(makeCrack(pos.x, pos.y, intensity));
  if (Math.random() < 0.4 * mult) newEvents.push(makeSmudge(pos.x, pos.y));

  if (isRage) {
    for (let i = 0; i < Math.floor(3 * mult); i++) {
      newEvents.push(makeDebris(pos.x, pos.y));
    }
    if (Math.random() < 0.5) newEvents.push(makeCrack(pos.x, pos.y, intensity * 1.3));
  }

  const next = [...events, ...newEvents];
  const cap = Math.floor(50 * mult);
  return next.length > cap ? next.slice(next.length - cap) : next;
}

export function applyWebSpin(pos: Vec2, events: DamageEvent[]): DamageEvent[] {
  const newEvents: DamageEvent[] = [makeWeb(pos.x, pos.y)];
  if (Math.random() < 0.4) newEvents.push(makeWeb(pos.x + (Math.random() - 0.5) * 120, pos.y + (Math.random() - 0.5) * 120));
  const next = [...events, ...newEvents];
  return next.length > 60 ? next.slice(next.length - 60) : next;
}

export function addFootprint(pos: Vec2, dir: number, events: DamageEvent[]): DamageEvent[] {
  const fp = makeFootprint(pos.x, pos.y, dir);
  const next = [...events, fp];
  // Keep only last 80 footprints + other effects
  const footprints = next.filter(e => e.type === "footprint");
  const other = next.filter(e => e.type !== "footprint");
  return [...other, ...footprints.slice(-80)];
}

export function fadeDamage(events: DamageEvent[], rate = 0.0003): DamageEvent[] {
  return events
    .map(e => ({ ...e, opacity: e.opacity - rate }))
    .filter(e => e.opacity > 0.03);
}
