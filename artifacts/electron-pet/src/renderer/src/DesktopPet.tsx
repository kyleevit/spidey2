import { useEffect, useRef, useState, useCallback } from "react";
import Spider from "@/components/Spider";
import ScreenDamage from "@/components/ScreenDamage";
import { FoodItemEl, ToyItemEl } from "@/components/FoodItem";
import SpeechBubble from "@/components/SpeechBubble";
import { selectBehavior, getSpeedForBehavior } from "@/ai/behaviorEngine";
import { moveToward, randomDesktopPoint, randomEdgePoint, randomCornerPoint, awayFromPoint, clampToScreen, addNoise } from "@/ai/movement";
import { applyScreenBite, applyWebSpin, addFootprint, fadeDamage } from "@/effects/screenEffects";
import { getSpeechText, GROWTH_SPEED, FOOD_STATS } from "@/state/petState";
import type { Behavior, PetStats, DamageEvent, FoodItem as FoodItemType, ToyItem, Vec2, Settings, GrowthStage, Personality } from "@/state/petState";
import { api } from "@/api";

declare global {
  interface Window {
    overlayAPI?: {
      setClickThrough: (enabled: boolean) => Promise<void>;
      getScreenSize: () => Promise<{ width: number; height: number }>;
      getSettings: () => Promise<Record<string, unknown>>;
      onTrayCmd: (cb: (cmd: Record<string, unknown>) => void) => void;
    };
  }
}

const SPIDER_HIT_R = 55;
const INTERACT_MARGIN = 140;
const API_POLL_MS = 9000;
const TICK_MS = 50;
const FOOTPRINT_EVERY = 28;

let _nextId = 1;
const uid = () => _nextId++;

const DEFAULT_SETTINGS: Settings = {
  screenDamageEnabled: true,
  chaosLevel: "normal",
  petSize: 1.0,
  alwaysOnTop: true,
  clickThroughMode: true,
  soundEnabled: false,
};

const DEFAULT_STATS: PetStats = {
  hunger: 80, happiness: 80, health: 100, cleanliness: 90,
  energy: 90, trust: 50, aggression: 20, boredom: 10,
  mood: "content", isDead: false, screenEatPercent: 0,
  personality: "curious", growthStage: "adult", age: 0,
};

export default function DesktopPet() {
  const [sw, setSw] = useState(window.innerWidth);
  const [sh, setSh] = useState(window.innerHeight);
  const [pos, setPos] = useState<Vec2>({ x: window.innerWidth / 2, y: window.innerHeight - 220 });
  const [dir, setDir] = useState(0);
  const [legPhase, setLegPhase] = useState(0);
  const [behavior, setBehavior] = useState<Behavior>("idle");
  const [stats, setStats] = useState<PetStats>(DEFAULT_STATS);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [damage, setDamage] = useState<DamageEvent[]>([]);
  const [foods, setFoods] = useState<FoodItemType[]>([]);
  const [toys, setToys] = useState<ToyItem[]>([]);
  const [speechText, setSpeech] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isNear, setIsNear] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  // Stable refs — avoid re-renders in game loop
  const posR = useRef(pos);
  const dirR = useRef(dir);
  const behR = useRef<Behavior>("idle");
  const statsR = useRef(stats);
  const settingsR = useRef(settings);
  const targetR = useRef<Vec2 | null>(null);
  const behTimerR = useRef(0);
  const lastTickR = useRef(Date.now());
  const legR = useRef(0);
  const pausedR = useRef(false);
  const foodsR = useRef<FoodItemType[]>([]);
  const toysR = useRef<ToyItem[]>([]);
  const screenR = useRef({ sw, sh });
  const mouseR = useRef<Vec2>({ x: -999, y: -999 });
  const footprintTickR = useRef(0);
  const biteTickR = useRef(0);
  const webTickR = useRef(0);
  const speechTickR = useRef(0);
  const nearR = useRef(false);
  const isVisibleR = useRef(true);

  posR.current = pos;
  dirR.current = dir;
  behR.current = behavior;
  statsR.current = stats;
  settingsR.current = settings;
  pausedR.current = isPaused;
  foodsR.current = foods;
  toysR.current = toys;
  screenR.current = { sw, sh };
  nearR.current = isNear;
  isVisibleR.current = isVisible;

  // ─── Init: screen size + settings ───────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      if (window.overlayAPI) {
        const size = await window.overlayAPI.getScreenSize();
        setSw(size.width); setSh(size.height);
        screenR.current = size;
        const center = { x: size.width / 2, y: size.height - 220 };
        setPos(center); posR.current = center;

        try {
          const s = await window.overlayAPI.getSettings();
          const merged: Settings = { ...DEFAULT_SETTINGS, ...(s as Partial<Settings>) };
          setSettings(merged); settingsR.current = merged;
        } catch { /* dev mode — no preload */ }
      }
    };
    init();
  }, []);

  // ─── API polling ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const poll = async () => {
      try {
        const pet = await api.getPet();
        const ns: PetStats = {
          hunger: pet.hunger, happiness: pet.happiness, health: pet.health,
          cleanliness: pet.cleanliness, energy: pet.energy, trust: pet.trust,
          aggression: pet.aggression, boredom: pet.boredom,
          mood: pet.mood, isDead: pet.isDead, screenEatPercent: pet.screenEatPercent,
          personality: pet.personality as Personality,
          growthStage: pet.growthStage as GrowthStage, age: pet.age,
        };
        setStats(ns); statsR.current = ns;
      } catch { /* server warming up */ }
    };
    poll();
    const id = setInterval(poll, API_POLL_MS);
    return () => clearInterval(id);
  }, []);

  // ─── Tray commands ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!window.overlayAPI) return;
    window.overlayAPI.onTrayCmd(async (cmd) => {
      const type = cmd.type as string;

      if (type === "feed") {
        try {
          const r = await api.feedPet(null);
          const ns: PetStats = { ...statsR.current, hunger: r.hunger, happiness: r.happiness, health: r.health, energy: r.energy, boredom: r.boredom, aggression: r.aggression, mood: r.mood, isDead: r.isDead };
          setStats(ns); statsR.current = ns;
          _forceBehavior("eat_food", 2000);
        } catch { /* ignore */ }
      }

      if (type === "dropFood") {
        const kind = (cmd.food as string) as FoodItemType["kind"];
        const f: FoodItemType = { id: uid(), x: 120 + Math.random() * (screenR.current.sw - 240), y: 100 + Math.random() * (screenR.current.sh - 200), kind };
        setFoods(p => { foodsR.current = [...p, f]; return foodsR.current; });
      }

      if (type === "dropToy") {
        const kind = (cmd.toy as string) as ToyItem["kind"];
        const t: ToyItem = { id: uid(), x: 120 + Math.random() * (screenR.current.sw - 240), y: 120 + Math.random() * (screenR.current.sh - 240), kind, vx: 0, vy: 0 };
        setToys(p => { toysR.current = [...p, t]; return toysR.current; });
      }

      if (type === "pet" || type === "play") {
        try {
          const r = await api.playWithPet();
          setStats(s => ({ ...s, happiness: r.happiness, boredom: r.boredom, trust: r.trust, energy: r.energy }));
          statsR.current = { ...statsR.current, happiness: r.happiness, boredom: r.boredom, trust: r.trust, energy: r.energy };
          setSpeech(":D");
          if (type === "play") _forceBehavior("play", 4000);
        } catch { /* ignore */ }
      }

      if (type === "sleep") {
        try { await api.sleepPet(); } catch { /* ignore */ }
        _forceBehavior("sleep", 0);
        statsR.current = { ...statsR.current, energy: Math.min(100, statsR.current.energy + 60) };
        setStats(s => ({ ...s, energy: Math.min(100, s.energy + 60) }));
      }

      if (type === "wakeup") {
        if (behR.current === "sleep" || behR.current === "curl_up") {
          setBehavior("idle"); behR.current = "idle"; behTimerR.current = 0;
          targetR.current = null;
        }
      }

      if (type === "pause") {
        const p = cmd.paused as boolean;
        setIsPaused(p); pausedR.current = p;
      }

      if (type === "resetDamage") {
        setDamage([]);
      }

      if (type === "revive" || type === "resetAll") {
        try { await api.revivePet(); } catch { /* ignore */ }
        setDamage([]); setFoods([]); setToys([]);
        foodsR.current = []; toysR.current = [];
        _forceBehavior("idle", 0);
      }

      if (type === "settings") {
        const key = cmd.key as keyof Settings;
        const value = cmd.value as Settings[keyof Settings];
        setSettings(s => { const ns = { ...s, [key]: value }; settingsR.current = ns; return ns; });
      }
    });
  }, []);

  // ─── Forced behavior helper ─────────────────────────────────────────────────
  function _forceBehavior(b: Behavior, durationMs: number) {
    setBehavior(b); behR.current = b; behTimerR.current = 0; targetR.current = null;
    if (durationMs > 0) {
      setTimeout(() => {
        setBehavior("idle"); behR.current = "idle"; behTimerR.current = 0; targetR.current = null;
      }, durationMs);
    }
  }

  // ─── Pick movement target ────────────────────────────────────────────────────
  const pickTarget = useCallback((beh: Behavior): Vec2 => {
    const { sw, sh } = screenR.current;
    const cur = posR.current;
    const mouse = mouseR.current;
    switch (beh) {
      case "screen_bite":
      case "angry":      return randomEdgePoint(sw, sh);
      case "corner_hide": return randomCornerPoint(sw, sh);
      case "flee_mouse":  return awayFromPoint(cur, mouse, sw, sh);
      case "follow_mouse": {
        const dx = mouse.x - cur.x, dy = mouse.y - cur.y;
        const d = Math.sqrt(dx * dx + dy * dy) || 1;
        const dist = 110 + Math.random() * 50;
        return clampToScreen({ x: mouse.x - (dx / d) * dist, y: mouse.y - (dy / d) * dist }, sw, sh);
      }
      case "jump_scare":  return { x: mouse.x + (Math.random() - 0.5) * 30, y: mouse.y + (Math.random() - 0.5) * 30 };
      case "rage":        return Math.random() < 0.5 ? randomEdgePoint(sw, sh) : { x: mouse.x, y: mouse.y };
      default:            return randomDesktopPoint(sw, sh);
    }
  }, []);

  // ─── Main game loop ──────────────────────────────────────────────────────────
  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      const dt = Math.min((now - lastTickR.current) / 1000, 0.12);
      lastTickR.current = now;

      if (pausedR.current) return;

      const s = statsR.current;
      const cfg = settingsR.current;
      const { sw, sh } = screenR.current;
      const curPos = posR.current;
      const curBeh = behR.current;
      const mouse = mouseR.current;

      behTimerR.current += dt * 1000;

      // ── Select next behavior ──────────────────────────────────
      const nextBeh = selectBehavior({
        stats: s, current: curBeh, mousePos: mouse, spiderPos: curPos,
        hasFood: foodsR.current.length > 0,
        hasToy: toysR.current.length > 0,
        timeInState: behTimerR.current, settings: cfg,
      });

      if (nextBeh !== curBeh) {
        setBehavior(nextBeh); behR.current = nextBeh;
        behTimerR.current = 0; targetR.current = null;

        // Handle disappear
        if (nextBeh === "disappear") {
          setIsVisible(false); isVisibleR.current = false;
        } else if (curBeh === "disappear") {
          // Reappear at random spot
          const rp = randomDesktopPoint(sw, sh);
          setPos(rp); posR.current = rp;
          setIsVisible(true); isVisibleR.current = true;
        }

        // Web spin deposits webs
        if (curBeh === "web_spin" && cfg.screenDamageEnabled) {
          setDamage(d => applyWebSpin(posR.current, d));
        }
      }

      // ── Movement ──────────────────────────────────────────────
      const growthSpeed = GROWTH_SPEED[s.growthStage];
      const speed = getSpeedForBehavior(behR.current, s.personality, growthSpeed);
      let newPos = { ...curPos };
      let newDir = dirR.current;
      let arrived = false;
      let isWalking = false;

      if (speed > 0 && behR.current !== "disappear") {
        // Chase food: always target nearest food
        if (behR.current === "chase_food" && foodsR.current.length > 0) {
          let nearest = foodsR.current[0];
          let minD = Infinity;
          for (const f of foodsR.current) {
            const d = (f.x - curPos.x) ** 2 + (f.y - curPos.y) ** 2;
            if (d < minD) { minD = d; nearest = f; }
          }
          targetR.current = { x: nearest.x, y: nearest.y };
        }
        // Chase toy when playing
        if (behR.current === "play" && toysR.current.length > 0 && !targetR.current) {
          const toy = toysR.current[0];
          targetR.current = { x: toy.x, y: toy.y };
        }

        if (!targetR.current) targetR.current = pickTarget(behR.current);

        const result = moveToward(curPos, targetR.current, speed, dt);
        newPos = clampToScreen(result.pos, sw, sh);
        newDir = result.dir;
        arrived = result.arrived || (Math.abs(newPos.x - curPos.x) < 0.5 && Math.abs(newPos.y - curPos.y) < 0.5);
        isWalking = true;

        // Rage: add noise
        if (behR.current === "rage") newPos = addNoise(newPos, 6);

        // ── On arrival ───────────────────────────────────────────
        if (arrived) {
          // Eat food
          if (behR.current === "chase_food" && foodsR.current.length > 0) {
            let nearest = foodsR.current[0];
            let minD = Infinity;
            for (const f of foodsR.current) {
              const d = (f.x - posR.current.x) ** 2 + (f.y - posR.current.y) ** 2;
              if (d < minD) { minD = d; nearest = f; }
            }
            if (minD < 90 * 90) {
              const ate = nearest;
              setFoods(p => { const n = p.filter(f => f.id !== ate.id); foodsR.current = n; return n; });
              api.feedPet(null).catch(() => {});
              const boost = FOOD_STATS[ate.kind];
              const ns = { ...statsR.current, hunger: Math.min(100, statsR.current.hunger + boost.hunger), happiness: Math.min(100, statsR.current.happiness + boost.happiness), energy: Math.min(100, statsR.current.energy + boost.energy), boredom: Math.max(0, statsR.current.boredom - 15), aggression: Math.max(20, statsR.current.aggression - 20) };
              setStats(ns); statsR.current = ns;
              setSpeech("nom :)");
              _forceBehavior("eat_food", 2200);
            }
          }

          // Hit toy — knock it away
          if (behR.current === "play" && toysR.current.length > 0) {
            const toy = toysR.current[0];
            const kx = toy.x + (Math.random() - 0.5) * 200, ky = toy.y + (Math.random() - 0.5) * 200;
            setToys(p => p.map(t => t.id === toy.id ? { ...t, x: Math.max(60, Math.min(sw - 60, kx)), y: Math.max(60, Math.min(sh - 60, ky)) } : t));
            toysR.current = toysR.current.map(t => t.id === toy.id ? { ...t, x: Math.max(60, Math.min(sw - 60, kx)), y: Math.max(60, Math.min(sh - 60, ky)) } : t);
            setSpeech("wheee!");
          }

          // Screen bite at edge
          if ((behR.current === "screen_bite" || behR.current === "rage") && cfg.screenDamageEnabled) {
            biteTickR.current += dt * 1000;
            if (biteTickR.current > 1200) {
              biteTickR.current = 0;
              setDamage(d => applyScreenBite(posR.current, d, cfg.chaosLevel, behR.current));
            }
          }
          targetR.current = null;
        }

        setPos(newPos); posR.current = newPos;
        setDir(newDir); dirR.current = newDir;

        // Leg animation
        legR.current = (legR.current + speed * dt * 0.012) % 1;
        setLegPhase(legR.current);

        // Footprints while walking fast
        if (cfg.screenDamageEnabled && isWalking && (behR.current === "wander" || behR.current === "hungry_wander" || behR.current === "angry" || behR.current === "rage")) {
          footprintTickR.current++;
          if (footprintTickR.current >= FOOTPRINT_EVERY) {
            footprintTickR.current = 0;
            setDamage(d => addFootprint(posR.current, dirR.current, d));
          }
        }
      }

      // ── Periodic screen biting while at edge (not arrived) ──────
      if (!arrived && (behR.current === "screen_bite" || behR.current === "rage") && cfg.screenDamageEnabled) {
        biteTickR.current += dt * 1000;
        if (biteTickR.current > 1800) {
          biteTickR.current = 0;
          setDamage(d => applyScreenBite(posR.current, d, cfg.chaosLevel, behR.current));
        }
      }

      // ── Web-spin: deposits webs while spinning ──────────────────
      if (behR.current === "web_spin" && cfg.screenDamageEnabled) {
        webTickR.current += dt * 1000;
        if (webTickR.current > 2200) {
          webTickR.current = 0;
          setDamage(d => applyWebSpin(posR.current, d));
        }
      }

      // ── Fade damage over time when fed ─────────────────────────
      if (s.hunger > 65 && (s.mood === "content" || s.mood === "happy")) {
        setDamage(d => d.length > 0 ? fadeDamage(d, 0.00025) : d);
      }

      // ── Speech bubbles ─────────────────────────────────────────
      speechTickR.current += dt * 1000;
      if (speechTickR.current > 3800) {
        speechTickR.current = 0;
        const txt = getSpeechText(behR.current, statsR.current);
        if (txt) setSpeech(txt);
      }

      // ── Local stat drift (between API polls) ──────────────────
      const boredomGain = isWalking ? -0.3 : 0.4;
      const aggrGain = s.hunger < 40 ? 0.2 : -0.1;
      const energyLoss = isWalking ? -0.06 : (behR.current === "sleep" ? 0.25 : -0.015);
      setStats(prev => ({
        ...prev,
        boredom: Math.max(0, Math.min(100, prev.boredom + boredomGain * dt)),
        aggression: Math.max(20, Math.min(100, prev.aggression + aggrGain * dt)),
        energy: Math.max(0, Math.min(100, prev.energy + energyLoss * dt)),
      }));
    };

    const id = setInterval(tick, TICK_MS);
    return () => clearInterval(id);
  }, [pickTarget]);

  // ─── Mouse tracking for click-through ───────────────────────────────────────
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouseR.current = { x: e.clientX, y: e.clientY };
      const dx = e.clientX - posR.current.x;
      const dy = e.clientY - posR.current.y;
      const close = Math.sqrt(dx * dx + dy * dy) < INTERACT_MARGIN;
      if (close !== nearR.current) {
        setIsNear(close);
        window.overlayAPI?.setClickThrough(!close);
      }
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  // ─── Click: drop food or interact ───────────────────────────────────────────
  const onOverlayClick = useCallback((e: React.MouseEvent) => {
    if (statsR.current.isDead) return;
    const dx = e.clientX - posR.current.x;
    const dy = e.clientY - posR.current.y;
    if (Math.sqrt(dx * dx + dy * dy) > SPIDER_HIT_R) {
      // Drop kibble at click
      const f: FoodItemType = { id: uid(), x: e.clientX, y: e.clientY, kind: "kibble" };
      setFoods(p => { foodsR.current = [...p, f]; return foodsR.current; });
    }
  }, []);

  const onSpiderClick = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (statsR.current.isDead) return;
    try {
      const r = await api.playWithPet();
      setStats(s => ({ ...s, happiness: r.happiness, boredom: r.boredom, trust: r.trust }));
      statsR.current = { ...statsR.current, happiness: r.happiness, boredom: r.boredom, trust: r.trust };
      setSpeech(":D");
    } catch { /* ignore */ }
  }, []);

  // ─── Derived display values ──────────────────────────────────────────────────
  const spiderScale = settings.petSize;
  const spiderPx = Math.round(130 * spiderScale);
  const halfPx = Math.round(spiderPx / 2);

  const animClass =
    behavior === "sleep" ? "spider-sleep-anim" :
    behavior === "idle" || behavior === "corner_hide" || behavior === "web_spin" ? "spider-breathe-anim" :
    (behavior === "angry" || behavior === "rage" || behavior === "screen_bite") ? "spider-shake-anim" : "";

  const hudY = pos.y < sh / 2 ? pos.y + halfPx + 20 : pos.y - 120;
  const hudX = Math.max(10, Math.min(sw - 165, pos.x - 75));

  return (
    <div
      style={{ position: "fixed", inset: 0, overflow: "hidden", background: "transparent", cursor: isNear ? "default" : "none" }}
      onClick={onOverlayClick}
    >
      {/* Screen damage canvas */}
      <ScreenDamage events={damage} screenW={sw} screenH={sh} />

      {/* Toys */}
      {toys.map(t => <ToyItemEl key={t.id} toy={t} />)}

      {/* Food items */}
      {foods.map(f => <FoodItemEl key={f.id} food={f} />)}

      {/* Speech bubble */}
      <SpeechBubble text={speechText} x={pos.x} y={pos.y - halfPx} behavior={behavior} />

      {/* The spider */}
      <div
        className={animClass}
        style={{
          position: "fixed",
          left: pos.x - halfPx,
          top: pos.y - halfPx,
          width: spiderPx, height: spiderPx,
          cursor: isNear ? "pointer" : "none",
          zIndex: 100,
          pointerEvents: isNear ? "auto" : "none",
          opacity: isVisible ? 1 : 0,
          transition: isVisible ? "opacity 0.8s ease" : "opacity 2s ease",
        }}
        onClick={onSpiderClick}
      >
        <Spider
          behavior={behavior}
          direction={dir}
          legPhase={legPhase}
          petType={stats.personality === "aggressive" ? "tarantula" : "tarantula"}
          growthStage={stats.growthStage}
          sizeOverride={1.0}
        />
      </div>

      {/* HUD — appears on hover */}
      {isNear && !stats.isDead && (
        <div
          style={{
            position: "fixed", top: hudY, left: hudX, width: 155, zIndex: 200,
            background: "rgba(8,6,18,0.88)", border: "1px solid rgba(90,55,25,0.5)",
            borderRadius: 10, padding: "7px 9px", pointerEvents: "none",
            backdropFilter: "blur(8px)", boxShadow: "0 4px 20px rgba(0,0,0,0.65)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
            <span style={{ color: "#777", fontFamily: "monospace", fontSize: 9, textTransform: "uppercase" }}>
              {stats.growthStage} · {stats.personality}
            </span>
            <span style={{ color: "#555", fontFamily: "monospace", fontSize: 9 }}>
              {behavior.replace("_", " ")}
            </span>
          </div>
          <MiniStat label="Hunger"  value={stats.hunger}     color="#d97706" />
          <MiniStat label="Happy"   value={stats.happiness}  color="#8b5cf6" />
          <MiniStat label="Health"  value={stats.health}     color="#16a34a" />
          <MiniStat label="Energy"  value={stats.energy}     color="#0ea5e9" />
          <MiniStat label="Trust"   value={stats.trust}      color="#f59e0b" />
          <MiniStat label="Boredom" value={stats.boredom}    color="#ef4444" invert />
          <div style={{ marginTop: 5, borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 4 }}>
            <div style={{ fontSize: 8, color: "#444", fontFamily: "monospace", textAlign: "center" }}>
              click → drop food · right-click tray → menu
            </div>
          </div>
        </div>
      )}

      {/* Dead overlay */}
      {stats.isDead && (
        <div style={{
          position: "fixed", top: pos.y + halfPx + 10, left: pos.x - 90, width: 180,
          pointerEvents: "none", zIndex: 200, background: "rgba(8,0,0,0.9)",
          border: "1px solid rgba(100,15,15,0.7)", borderRadius: 9,
          padding: "8px 12px", textAlign: "center", fontFamily: "monospace",
        }}>
          <div style={{ color: "#dc2626", fontSize: 13, marginBottom: 3 }}>✝ Spidey is gone</div>
          <div style={{ color: "#666", fontSize: 10 }}>Right-click tray → Settings → Reset Pet</div>
        </div>
      )}

      {/* Chaos vignette when very hungry */}
      {stats.screenEatPercent > 30 && (
        <div style={{
          position: "fixed", inset: 0, pointerEvents: "none", zIndex: 5,
          background: `radial-gradient(ellipse at center, transparent 40%, rgba(60,0,0,${Math.min(0.55, stats.screenEatPercent / 150)}) 100%)`,
          transition: "background 3s ease",
        }} />
      )}
    </div>
  );
}

function MiniStat({ label, value, color, invert }: { label: string; value: number; color: string; invert?: boolean }) {
  const filled = invert ? 100 - value : value;
  const isLow = invert ? value > 70 : value < 25;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 3 }}>
      <span style={{ color: "#555", fontFamily: "monospace", fontSize: 8, width: 40 }}>{label}</span>
      <div style={{ flex: 1, background: "rgba(255,255,255,0.05)", borderRadius: 3, height: 5, overflow: "hidden" }}>
        <div style={{ width: `${Math.max(0, Math.min(100, filled))}%`, height: "100%", background: isLow ? "#ef4444" : color, borderRadius: 3, transition: "width 0.6s ease" }} />
      </div>
      <span style={{ color: isLow ? "#ef4444" : "#444", fontFamily: "monospace", fontSize: 8, width: 20, textAlign: "right" }}>
        {Math.round(value)}
      </span>
    </div>
  );
}
