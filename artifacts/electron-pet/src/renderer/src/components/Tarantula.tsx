type Props = { mood: string; petType?: string };

export default function Tarantula({ mood, petType = "tarantula" }: Props) {
  const isDead = mood === "dead";
  const isDying = mood === "dying";
  const isHappy = mood === "happy";
  const isAngry = mood === "angry" || mood === "eating_screen";

  const bodyColor = petType === "golden_tarantula" ? "#b45309" : petType === "scorpion" ? "#1e1b2e" : "#2d1b0e";
  const hairColor = petType === "golden_tarantula" ? "#d97706" : petType === "scorpion" ? "#4c1d95" : "#4a2c0a";
  const eyeColor = petType === "dragon_spider" ? "#ef4444" : "#d97706";

  const animClass = isDead
    ? ""
    : isDying
    ? "animate-[spider-shake_0.5s_ease-in-out_infinite]"
    : isHappy
    ? "animate-[spider-breathe_2s_ease-in-out_infinite]"
    : isAngry
    ? "animate-[spider-shake_0.8s_ease-in-out_infinite]"
    : "animate-[spider-breathe_3s_ease-in-out_infinite]";

  const legSpread = isHappy ? 1.2 : isDying ? 0.6 : isDead ? 0.3 : 1.0;
  const rotation = isDead ? "rotate(180deg)" : isDying ? "rotate(15deg)" : "rotate(0deg)";

  return (
    <div
      className={`flex items-center justify-center w-full h-full ${animClass}`}
      style={{ transform: rotation, transition: "transform 1s ease-in-out" }}
    >
      <svg viewBox="0 0 200 200" width="180" height="180" xmlns="http://www.w3.org/2000/svg">
        {/* Left legs */}
        <line x1="70" y1="90" x2={70 - 50 * legSpread} y2={70 - 20 * legSpread} stroke={hairColor} strokeWidth="5" strokeLinecap="round" />
        <line x1={70 - 50 * legSpread} y1={70 - 20 * legSpread} x2={70 - 75 * legSpread} y2={60 - 10 * legSpread} stroke={hairColor} strokeWidth="4" strokeLinecap="round" />

        <line x1="70" y1="100" x2={70 - 55 * legSpread} y2={90 + 5 * legSpread} stroke={hairColor} strokeWidth="5" strokeLinecap="round" />
        <line x1={70 - 55 * legSpread} y1={90 + 5 * legSpread} x2={70 - 80 * legSpread} y2={85 + 10 * legSpread} stroke={hairColor} strokeWidth="4" strokeLinecap="round" />

        <line x1="70" y1="110" x2={70 - 52 * legSpread} y2={110 + 10 * legSpread} stroke={hairColor} strokeWidth="5" strokeLinecap="round" />
        <line x1={70 - 52 * legSpread} y1={110 + 10 * legSpread} x2={70 - 78 * legSpread} y2={115 + 20 * legSpread} stroke={hairColor} strokeWidth="4" strokeLinecap="round" />

        <line x1="72" y1="120" x2={72 - 48 * legSpread} y2={130 + 20 * legSpread} stroke={hairColor} strokeWidth="5" strokeLinecap="round" />
        <line x1={72 - 48 * legSpread} y1={130 + 20 * legSpread} x2={72 - 70 * legSpread} y2={145 + 30 * legSpread} stroke={hairColor} strokeWidth="4" strokeLinecap="round" />

        {/* Right legs */}
        <line x1="130" y1="90" x2={130 + 50 * legSpread} y2={70 - 20 * legSpread} stroke={hairColor} strokeWidth="5" strokeLinecap="round" />
        <line x1={130 + 50 * legSpread} y1={70 - 20 * legSpread} x2={130 + 75 * legSpread} y2={60 - 10 * legSpread} stroke={hairColor} strokeWidth="4" strokeLinecap="round" />

        <line x1="130" y1="100" x2={130 + 55 * legSpread} y2={90 + 5 * legSpread} stroke={hairColor} strokeWidth="5" strokeLinecap="round" />
        <line x1={130 + 55 * legSpread} y1={90 + 5 * legSpread} x2={130 + 80 * legSpread} y2={85 + 10 * legSpread} stroke={hairColor} strokeWidth="4" strokeLinecap="round" />

        <line x1="130" y1="110" x2={130 + 52 * legSpread} y2={110 + 10 * legSpread} stroke={hairColor} strokeWidth="5" strokeLinecap="round" />
        <line x1={130 + 52 * legSpread} y1={110 + 10 * legSpread} x2={130 + 78 * legSpread} y2={115 + 20 * legSpread} stroke={hairColor} strokeWidth="4" strokeLinecap="round" />

        <line x1="128" y1="120" x2={128 + 48 * legSpread} y2={130 + 20 * legSpread} stroke={hairColor} strokeWidth="5" strokeLinecap="round" />
        <line x1={128 + 48 * legSpread} y1={130 + 20 * legSpread} x2={128 + 70 * legSpread} y2={145 + 30 * legSpread} stroke={hairColor} strokeWidth="4" strokeLinecap="round" />

        {/* Abdomen */}
        <ellipse cx="100" cy="125" rx="28" ry="35" fill={bodyColor} />
        <ellipse cx="100" cy="121" rx="24" ry="30" fill={hairColor} opacity="0.4" />
        {petType === "golden_tarantula" && (
          <ellipse cx="100" cy="125" rx="14" ry="18" fill="#fbbf24" opacity="0.3" />
        )}

        {/* Cephalothorax */}
        <ellipse cx="100" cy="88" rx="22" ry="20" fill={bodyColor} />
        <ellipse cx="100" cy="86" rx="18" ry="16" fill={hairColor} opacity="0.35" />

        {/* Eyes */}
        <circle cx="93" cy="80" r="4" fill={eyeColor} />
        <circle cx="107" cy="80" r="4" fill={eyeColor} />
        <circle cx="88" cy="85" r="2.5" fill={eyeColor} opacity="0.7" />
        <circle cx="112" cy="85" r="2.5" fill={eyeColor} opacity="0.7" />
        <circle cx="94" cy="79" r="1.5" fill="white" opacity="0.8" />
        <circle cx="108" cy="79" r="1.5" fill="white" opacity="0.8" />

        {/* Fangs */}
        {!isDead && (
          <>
            <ellipse cx="96" cy="97" rx="3" ry="5" fill="#1a0a00" />
            <ellipse cx="104" cy="97" rx="3" ry="5" fill="#1a0a00" />
          </>
        )}

        {/* Dragon fire effect */}
        {petType === "dragon_spider" && !isDead && (
          <>
            <circle cx="100" cy="70" r="6" fill="#ef4444" opacity="0.6" className="animate-pulse" />
            <path d="M96 66 Q100 58 104 66" stroke="#f97316" strokeWidth="2" fill="none" />
          </>
        )}

        {/* Scorpion tail */}
        {petType === "scorpion" && (
          <path d="M100 95 Q130 85 140 70 Q145 55 135 50" stroke={hairColor} strokeWidth="6" fill="none" strokeLinecap="round" />
        )}

        {/* Dead X eyes */}
        {isDead && (
          <>
            <line x1="89" y1="76" x2="97" y2="84" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="97" y1="76" x2="89" y2="84" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="103" y1="76" x2="111" y2="84" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="111" y1="76" x2="103" y2="84" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" />
          </>
        )}
      </svg>
    </div>
  );
}
