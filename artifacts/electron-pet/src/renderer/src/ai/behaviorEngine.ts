import type { Behavior, PetStats, Vec2, Settings, ToyItem } from "../state/petState";
import { CHAOS_MULT } from "../state/petState";

function dist(a: Vec2, b: Vec2): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

export function selectBehavior(opts: {
  stats: PetStats;
  current: Behavior;
  mousePos: Vec2;
  spiderPos: Vec2;
  hasFood: boolean;
  hasToy: boolean;
  timeInState: number;
  settings: Settings;
}): Behavior {
  const { stats, current, mousePos, spiderPos, hasFood, hasToy, timeInState, settings } = opts;
  const { hunger, energy, aggression, boredom, trust, mood, isDead, personality, growthStage } = stats;
  const chaos = CHAOS_MULT[settings.chaosLevel];

  if (isDead) return "dead";
  if (current === "disappear" && timeInState < 10000 + Math.random() * 15000) return "disappear";
  if (current === "eat_food" && timeInState < 2200) return "eat_food";
  if (current === "jump_scare" && timeInState < 500) return "jump_scare";
  if (current === "curl_up" && timeInState < 2500) return "curl_up";

  // Starvation overrides everything
  const isStarving = mood === "dying" || mood === "eating_screen" || hunger < 20;
  if (isStarving) {
    if (hasFood) return "chase_food";
    if (aggression > 65 || personality === "aggressive") return "rage";
    return "screen_bite";
  }

  // Hungry — chase food or get angry
  if (hunger < 40) {
    if (hasFood) return "chase_food";
    if (current === "angry" && timeInState > 6000 && aggression > 55 * chaos) return "screen_bite";
    return "angry";
  }

  // Food present and moderately hungry
  if (hasFood && hunger < 70) return "chase_food";

  // Very low energy → sleep
  if (energy < 15 && current !== "sleep") {
    return current === "curl_up" ? "sleep" : "curl_up";
  }

  // Mouse proximity interactions
  const d = dist(spiderPos, mousePos);
  const isMouseNear = d < 200;
  const isMouseVeryNear = d < 100;

  if (isMouseNear && energy > 25 && current !== "sleep" && current !== "corner_hide") {
    if (personality === "skittish") {
      if (isMouseVeryNear || trust < 40) return "flee_mouse";
    }
    if (personality === "aggressive" && aggression > 55 && isMouseVeryNear) {
      if (Math.random() < 0.3 * chaos) return "jump_scare";
    }
    if (personality === "friendly" && trust > 30 && Math.random() < 0.4) return "follow_mouse";
    if (personality === "curious" && d < 180) {
      if (Math.random() < 0.25 * chaos) return "follow_mouse";
      if (Math.random() < 0.08 * chaos && isMouseVeryNear) return "jump_scare";
    }
    if (personality === "mischievous" && Math.random() < 0.15 * chaos) {
      return Math.random() < 0.5 ? "jump_scare" : "follow_mouse";
    }
  }

  // Toy interaction
  if (hasToy && boredom > 40 && energy > 30 && Math.random() < 0.3) {
    return "play";
  }

  // Boredom triggers web-spinning or chaos
  if (boredom > 75 && Math.random() < 0.025 * chaos) return "web_spin";
  if (boredom > 85 && personality === "mischievous" && Math.random() < 0.02 * chaos) return "screen_bite";

  // Aggression builds → chaos
  if (aggression > 80 && Math.random() < 0.018 * chaos) {
    return personality === "aggressive" ? "screen_bite" : "angry";
  }

  // Giant mode causes more chaos
  if (growthStage === "giant" && Math.random() < 0.01 * chaos) {
    return "screen_bite";
  }

  // Random disappear event
  if (personality === "mischievous" && Math.random() < 0.003 * chaos) return "disappear";

  // State machine transitions
  switch (current) {
    case "idle":
      if (timeInState > 2000 + Math.random() * 3500) {
        if (energy < 35 && Math.random() < 0.4) return "curl_up";
        if (personality === "lazy" && Math.random() < 0.35) return "curl_up";
        if (personality === "curious" && Math.random() < 0.25) return "follow_mouse";
        return "wander";
      }
      break;

    case "wander":
      if (timeInState > 5000 + Math.random() * 8000) {
        if (energy < 40 && Math.random() < 0.35) return "curl_up";
        if (boredom > 55 && Math.random() < 0.2) return "web_spin";
        if (personality === "skittish" && Math.random() < 0.15) return "corner_hide";
        return "idle";
      }
      break;

    case "sleep":
      if (timeInState > 12000 + Math.random() * 20000 || energy > 90) return "wander";
      if (hunger < 50) return "hungry_wander";
      break;

    case "follow_mouse":
      if (d > 280 || timeInState > 6000) return "idle";
      break;

    case "flee_mouse":
      if (d > 320 || timeInState > 4000) return "corner_hide";
      break;

    case "corner_hide":
      if (timeInState > 6000 + Math.random() * 8000 && d > 250) return "idle";
      break;

    case "web_spin":
      if (timeInState > 5000 + Math.random() * 5000) return "idle";
      break;

    case "play":
      if (!hasToy || timeInState > 8000) return "idle";
      break;

    case "angry":
      if (hunger > 55) return "wander";
      if (timeInState > 7000 && aggression > 60 && Math.random() < 0.4 * chaos) return "screen_bite";
      break;

    case "screen_bite":
      if (hunger > 50) return "wander";
      if (timeInState > 4000 + Math.random() * 3000) return "angry";
      break;

    case "rage":
      if (hunger > 45 && mood !== "dying") return "angry";
      break;

    case "hungry_wander":
      if (hunger > 65) return "wander";
      if (hasFood) return "chase_food";
      break;
  }

  return current;
}

export function getSpeedForBehavior(behavior: Behavior, personality: string, growthSpeed: number): number {
  const baseSpeed: Record<Behavior, number> = {
    idle: 0, sleep: 0, curl_up: 0, eat_food: 0, web_spin: 0, dead: 0, disappear: 0,
    wander: 85, hungry_wander: 120, follow_mouse: 100, flee_mouse: 170,
    corner_hide: 140, chase_food: 210, angry: 155, rage: 200, screen_bite: 145,
    jump_scare: 350, play: 90,
  };
  let speed = baseSpeed[behavior] ?? 90;
  if (personality === "lazy") speed *= 0.75;
  if (personality === "aggressive") speed *= 1.2;
  if (personality === "skittish") speed *= 1.15;
  return speed * growthSpeed;
}
