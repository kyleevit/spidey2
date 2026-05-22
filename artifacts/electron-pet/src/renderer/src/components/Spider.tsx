import type { GrowthStage } from "../state/petState";
import { GROWTH_SCALE } from "../state/petState";

type Vec2 = { x: number; y: number };

type Props = {
  behavior: string;
  direction: number;
  legPhase: number;
  petType?: string;
  growthStage?: GrowthStage;
  sizeOverride?: number;
};

const LEFT_HIPS: Vec2[] = [
  { x: -14, y: -10 }, { x: -16, y: -2 }, { x: -16, y: 6 }, { x: -13, y: 13 },
];
const RIGHT_HIPS: Vec2[] = [
  { x: 14, y: -10 }, { x: 16, y: -2 }, { x: 16, y: 6 }, { x: 13, y: 13 },
];
const LEFT_REST: Vec2[] = [
  { x: -48, y: -24 }, { x: -52, y: 2 }, { x: -50, y: 24 }, { x: -44, y: 42 },
];
const RIGHT_REST: Vec2[] = [
  { x: 48, y: -24 }, { x: 52, y: 2 }, { x: 50, y: 24 }, { x: 44, y: 42 },
];
const LEFT_PHASE = [0, 0.5, 0.25, 0.75];
const RIGHT_PHASE = [0.5, 0, 0.75, 0.25];

function lerp(a: Vec2, b: Vec2, t: number): Vec2 {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

function legTip(hip: Vec2, rest: Vec2, phaseOff: number, legPhase: number, walking: boolean, behavior: string): Vec2 {
  if (!walking) {
    if (behavior === "sleep" || behavior === "curl_up") return lerp(hip, rest, 0.32);
    if (behavior === "dead") return { x: hip.x * 0.35 + (rest.x > 0 ? 18 : -18), y: Math.abs(rest.y) * 0.4 + 18 };
    if (behavior === "web_spin") return lerp(hip, rest, 0.6);
    if (behavior === "jump_scare") return { x: rest.x * 1.3, y: rest.y * 0.6 - 10 };
    return rest;
  }
  const p = (legPhase + phaseOff) % 1;
  const lift = behavior === "rage" ? 16 : 12;
  const stride = behavior === "rage" ? 14 : 10;
  let liftAmt = 0, strideOff = 0;
  if (p < 0.4) {
    const t = p / 0.4;
    liftAmt = Math.sin(t * Math.PI) * lift;
    strideOff = (t - 0.5) * stride;
  } else {
    const t = (p - 0.4) / 0.6;
    strideOff = (0.5 - t) * stride * 0.5;
  }
  const sign = hip.x < 0 ? -1 : 1;
  return { x: rest.x + strideOff * sign * 0.3, y: rest.y - liftAmt + strideOff * 0.35 };
}

function knee(hip: Vec2, tip: Vec2): Vec2 {
  const out = hip.x < 0 ? -1 : 1;
  return { x: (hip.x + tip.x) / 2 + out * 10, y: (hip.y + tip.y) / 2 - 7 };
}

type LegProps = { hip: Vec2; knee: Vec2; tip: Vec2; color: string; thick?: boolean };
function Leg({ hip, knee: kn, tip, color, thick }: LegProps) {
  return (
    <>
      <line x1={hip.x} y1={hip.y} x2={kn.x} y2={kn.y} stroke={color} strokeWidth={thick ? 6 : 5} strokeLinecap="round" />
      <line x1={kn.x} y1={kn.y} x2={tip.x} y2={tip.y} stroke={color} strokeWidth={thick ? 4 : 3.5} strokeLinecap="round" />
      <circle cx={tip.x} cy={tip.y} r="2.2" fill={color} opacity="0.65" />
    </>
  );
}

const COLORS: Record<string, { body: string; hi: string; hair: string; eye: string }> = {
  tarantula:        { body: "#2d1b0e", hi: "#4a2c0a", hair: "#5c3512", eye: "#d97706" },
  scorpion:         { body: "#1a1828", hi: "#2d2750", hair: "#4c1d95", eye: "#7c3aed" },
  dragon_spider:    { body: "#180818", hi: "#3b1238", hair: "#7c2d7c", eye: "#ef4444" },
  golden_tarantula: { body: "#92400e", hi: "#b45309", hair: "#d97706", eye: "#fbbf24" },
};

export default function Spider({ behavior, direction, legPhase, petType = "tarantula", growthStage = "adult", sizeOverride }: Props) {
  const c = COLORS[petType] ?? COLORS.tarantula;
  const scale = sizeOverride ?? GROWTH_SCALE[growthStage];
  const px = Math.round(130 * scale);

  const walking = ["wander", "hungry_wander", "angry", "rage", "chase_food", "flee_mouse", "follow_mouse", "jump_scare", "corner_hide", "play"].includes(behavior);
  const sleeping = behavior === "sleep" || behavior === "curl_up";
  const dead = behavior === "dead";
  const angry = behavior === "angry" || behavior === "rage" || behavior === "screen_bite";
  const eating = behavior === "eat_food";
  const spinning = behavior === "web_spin";
  const disappearing = behavior === "disappear";
  const thick = growthStage === "giant";

  const eyeColor = angry ? "#ef4444" : dead ? "#555" : c.eye;
  const fangLen = angry || eating ? 9 : 6;

  const leftLegs = LEFT_HIPS.map((h, i) => ({ hip: h, knee: knee(h, legTip(h, LEFT_REST[i], LEFT_PHASE[i], legPhase, walking, behavior)), tip: legTip(h, LEFT_REST[i], LEFT_PHASE[i], legPhase, walking, behavior) }));
  const rightLegs = RIGHT_HIPS.map((h, i) => ({ hip: h, knee: knee(h, legTip(h, RIGHT_REST[i], RIGHT_PHASE[i], legPhase, walking, behavior)), tip: legTip(h, RIGHT_REST[i], RIGHT_PHASE[i], legPhase, walking, behavior) }));

  const rotDeg = walking ? (direction * 180) / Math.PI + 90 : 90;

  const glow = angry
    ? `drop-shadow(0 0 ${thick ? 16 : 10}px rgba(220,38,38,${thick ? 1 : 0.9})) drop-shadow(0 0 30px rgba(180,0,0,0.4))`
    : sleeping ? "drop-shadow(0 0 8px rgba(120,100,220,0.45))"
    : spinning ? "drop-shadow(0 0 8px rgba(180,140,60,0.5))"
    : `drop-shadow(0 ${Math.round(3 * scale)}px ${Math.round(8 * scale)}px rgba(0,0,0,0.7))`;

  // Curl up: body hunched
  const abdomRy = sleeping && behavior === "curl_up" ? 20 : 27;
  const cephRy = sleeping && behavior === "curl_up" ? 13 : 17;

  return (
    <div style={{ width: px, height: px, filter: glow, opacity: disappearing ? 0 : 1, transition: disappearing ? "opacity 1.5s ease" : "opacity 0.5s ease" }}>
      <svg
        viewBox="-70 -60 140 125"
        width={px} height={px}
        style={{
          transform: `rotate(${rotDeg}deg)`,
          transition: walking ? "transform 0.07s linear" : "transform 0.4s ease",
          overflow: "visible",
        }}
      >
        <defs>
          <radialGradient id={`spA${petType}`} cx="38%" cy="30%" r="65%">
            <stop offset="0%" stopColor={c.hi} />
            <stop offset="100%" stopColor={c.body} />
          </radialGradient>
          <radialGradient id={`spC${petType}`} cx="38%" cy="30%" r="65%">
            <stop offset="0%" stopColor={c.hi} />
            <stop offset="100%" stopColor={c.body} />
          </radialGradient>
          {angry && <filter id="eyeGlow"><feGaussianBlur stdDeviation="2.5" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>}
        </defs>

        {!dead && <ellipse cx="0" cy="52" rx={Math.round(28 * scale)} ry="6" fill="rgba(0,0,0,0.22)" />}

        {leftLegs.map((l, i) => <Leg key={`l${i}`} {...l} color={c.hair} thick={thick} />)}
        {rightLegs.map((l, i) => <Leg key={`r${i}`} {...l} color={c.hair} thick={thick} />)}

        {/* Body hairs */}
        {[-22, -10, 0, 10, 22].map((a) => {
          const rad = (a * Math.PI) / 180;
          const ox = Math.cos(rad + Math.PI / 2) * 19;
          const oy = Math.sin(rad + Math.PI / 2) * 24 + 12;
          return <line key={a} x1={ox} y1={oy} x2={ox + Math.cos(rad) * 6} y2={oy + Math.sin(rad) * 6} stroke={c.hair} strokeWidth="1.5" opacity="0.55" />;
        })}

        {/* Abdomen */}
        <ellipse cx="0" cy="16" rx="20" ry={abdomRy} fill={`url(#spA${petType})`} />
        <ellipse cx="0" cy="11" rx="9" ry="14" fill={c.hi} opacity="0.18" />
        {petType === "golden_tarantula" && <ellipse cx="0" cy="16" rx="11" ry="16" fill="#fbbf24" opacity="0.12" />}

        {/* Web-spin silk glands */}
        {spinning && <ellipse cx="0" cy="38" rx="4" ry="6" fill={c.hi} opacity="0.6" />}

        {/* Pedicel */}
        <ellipse cx="0" cy="-10" rx="6" ry="5" fill={c.body} />

        {/* Cephalothorax */}
        <ellipse cx="0" cy="-24" rx="19" ry={cephRy} fill={`url(#spC${petType})`} />
        <line x1="-8" y1="-18" x2="8" y2="-18" stroke={c.hair} strokeWidth="1" opacity="0.25" />
        <line x1="-10" y1="-24" x2="10" y2="-24" stroke={c.hair} strokeWidth="1" opacity="0.25" />
        <line x1="-8" y1="-30" x2="8" y2="-30" stroke={c.hair} strokeWidth="1" opacity="0.2" />

        {/* Chelicerae */}
        {!dead && (
          <>
            <ellipse cx="-5.5" cy={-37 - fangLen / 2} rx="3" ry={fangLen / 2 + 2} fill={c.body} />
            <ellipse cx="5.5" cy={-37 - fangLen / 2} rx="3" ry={fangLen / 2 + 2} fill={c.body} />
            <ellipse cx="-5.5" cy={-40 - fangLen / 2} rx="2" ry="2.5" fill="#050505" />
            <ellipse cx="5.5" cy={-40 - fangLen / 2} rx="2" ry="2.5" fill="#050505" />
          </>
        )}

        {/* Eyes */}
        {!dead ? (
          <>
            <circle cx="-6.5" cy="-34" r="5" fill={eyeColor} filter={angry ? "url(#eyeGlow)" : undefined} />
            <circle cx="6.5" cy="-34" r="5" fill={eyeColor} filter={angry ? "url(#eyeGlow)" : undefined} />
            <circle cx="-5.5" cy="-33" r="1.8" fill="white" opacity="0.7" />
            <circle cx="7.5" cy="-33" r="1.8" fill="white" opacity="0.7" />
            <circle cx="-13" cy="-30" r="2.8" fill={eyeColor} opacity="0.65" />
            <circle cx="13" cy="-30" r="2.8" fill={eyeColor} opacity="0.65" />
            <circle cx="-15" cy="-24" r="2" fill={eyeColor} opacity="0.45" />
            <circle cx="15" cy="-24" r="2" fill={eyeColor} opacity="0.45" />
          </>
        ) : (
          <>
            <line x1="-11" y1="-38" x2="-2" y2="-29" stroke="#555" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="-2" y1="-38" x2="-11" y2="-29" stroke="#555" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="2" y1="-38" x2="11" y2="-29" stroke="#555" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="11" y1="-38" x2="2" y2="-29" stroke="#555" strokeWidth="2.5" strokeLinecap="round" />
          </>
        )}

        {/* Pet type extras */}
        {petType === "scorpion" && <path d="M0 -8 Q28 -18 34 -32 Q36 -44 28 -48" stroke={c.hair} strokeWidth="5.5" fill="none" strokeLinecap="round" />}
        {petType === "dragon_spider" && !dead && (
          <>
            <circle cx="0" cy="-52" r="5" fill="#ef4444" opacity="0.75" />
            <path d="M-3 -48 Q0 -56 3 -48" stroke="#f97316" strokeWidth="1.5" fill="none" />
          </>
        )}

        {/* Giant mode — extra glow ring */}
        {growthStage === "giant" && !dead && (
          <ellipse cx="0" cy="-24" rx="23" ry="21" fill="none" stroke={c.hi} strokeWidth="1.5" opacity="0.3" />
        )}
      </svg>
    </div>
  );
}
