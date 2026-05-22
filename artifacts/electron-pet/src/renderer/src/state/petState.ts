export type Behavior =
  | "idle"
  | "wander"
  | "sleep"
  | "curl_up"
  | "hungry_wander"
  | "angry"
  | "rage"
  | "chase_food"
  | "eat_food"
  | "screen_bite"
  | "web_spin"
  | "corner_hide"
  | "follow_mouse"
  | "flee_mouse"
  | "jump_scare"
  | "play"
  | "disappear"
  | "dead";

export type Personality =
  | "friendly"
  | "skittish"
  | "aggressive"
  | "lazy"
  | "curious"
  | "mischievous";

export type GrowthStage = "baby" | "juvenile" | "adult" | "giant";
export type ChaosLevel = "low" | "normal" | "high" | "insane";

export type PetStats = {
  hunger: number;
  happiness: number;
  health: number;
  cleanliness: number;
  energy: number;
  trust: number;
  aggression: number;
  boredom: number;
  mood: string;
  isDead: boolean;
  screenEatPercent: number;
  personality: Personality;
  growthStage: GrowthStage;
  age: number;
};

export type Settings = {
  screenDamageEnabled: boolean;
  chaosLevel: ChaosLevel;
  petSize: number;
  alwaysOnTop: boolean;
  clickThroughMode: boolean;
  soundEnabled: boolean;
};

export type Vec2 = { x: number; y: number };

export type DamageEvent = {
  id: number;
  type: "bite" | "crack" | "web" | "scratch" | "smudge" | "debris" | "footprint";
  x: number;
  y: number;
  size: number;
  angle: number;
  opacity: number;
};

export type FoodItem = {
  id: number;
  x: number;
  y: number;
  kind: "cricket" | "moth" | "kibble" | "roach" | "fly";
};

export type ToyItem = {
  id: number;
  x: number;
  y: number;
  kind: "ball" | "stick" | "bug" | "rock" | "water";
  vx: number;
  vy: number;
};

export const FOOD_STATS: Record<FoodItem["kind"], { hunger: number; happiness: number; energy: number; label: string; emoji: string }> = {
  kibble:  { hunger: 20, happiness: 0,  energy: 5,  label: "Kibble",  emoji: "🍪" },
  cricket: { hunger: 35, happiness: 15, energy: 10, label: "Cricket", emoji: "🦗" },
  moth:    { hunger: 50, happiness: 25, energy: 15, label: "Moth",    emoji: "🦋" },
  roach:   { hunger: 60, happiness: 20, energy: 20, label: "Roach",   emoji: "🪳" },
  fly:     { hunger: 15, happiness: 5,  energy: 3,  label: "Fly",     emoji: "🪰" },
};

export const TOY_EMOJI: Record<ToyItem["kind"], string> = {
  ball:  "🔵",
  stick: "🪵",
  bug:   "🐛",
  rock:  "🪨",
  water: "💧",
};

export const GROWTH_SCALE: Record<GrowthStage, number> = {
  baby:     0.55,
  juvenile: 0.78,
  adult:    1.0,
  giant:    1.45,
};

export const GROWTH_SPEED: Record<GrowthStage, number> = {
  baby:     0.75,
  juvenile: 0.9,
  adult:    1.0,
  giant:    0.85,
};

export const CHAOS_MULT: Record<ChaosLevel, number> = {
  low: 0.4, normal: 1.0, high: 1.8, insane: 3.5,
};

export function getSpeechText(behavior: Behavior, stats: PetStats): string | null {
  const { hunger, boredom, energy, personality } = stats;
  if (behavior === "dead") return "x_x";
  if (behavior === "sleep" || behavior === "curl_up") return "Zzz...";
  if (behavior === "rage") {
    const rage = ["RAAAWRR!!", "STARVING!!!", ">:((((", "I WILL DESTROY YOU"];
    return rage[Math.floor(Math.random() * rage.length)];
  }
  if (behavior === "screen_bite") {
    return ["*CHOMP*", "MINE NOW", "NOM NOM NOM", "*crunch*"][Math.floor(Math.random() * 4)];
  }
  if (behavior === "angry") {
    return ["HUNGRY", "FEED ME", "GRRRR", "...angry"][Math.floor(Math.random() * 4)];
  }
  if (behavior === "jump_scare") return "BOO!";
  if (behavior === "follow_mouse") return personality === "friendly" ? ":)" : "...";
  if (behavior === "flee_mouse") return "eek!";
  if (behavior === "web_spin") return "spinning...";
  if (behavior === "eat_food") return "nom :)";
  if (behavior === "play") return "wheee!";
  if (behavior === "corner_hide") return "...hiding";
  if (behavior === "disappear") return null;
  if (behavior === "idle" && boredom > 60) return "...bored";
  if (behavior === "idle" && energy < 30) return "*yawn*";
  if (behavior === "idle" && hunger < 50) return "*grumble*";
  if (behavior === "idle" && Math.random() < 0.12) {
    const idle = ["...", "*skitters*", "hi :)", "*tap tap*", "*clicks fangs*"];
    return idle[Math.floor(Math.random() * idle.length)];
  }
  return null;
}
