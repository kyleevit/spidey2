import { useState, useEffect, useCallback } from "react";
import { api, type Pet, type User } from "@/api";
import Tarantula from "@/components/Tarantula";
import ScreenEater from "@/components/ScreenEater";

type Props = { pet: Pet | null; user: User | null; onRefresh: () => void };

type FloatMsg = { id: number; text: string; x: number };

const MOOD_LABELS: Record<string, string> = {
  happy: "Thriving",
  content: "Content",
  hungry: "Getting hungry...",
  angry: "HUNGRY AND ANGRY",
  eating_screen: "EATING YOUR SCREEN",
  dying: "CRITICAL — FEED NOW",
  dead: "She is gone...",
};

const MOOD_COLORS: Record<string, string> = {
  happy: "text-green-400",
  content: "text-purple-300",
  hungry: "text-yellow-400",
  angry: "text-orange-400",
  eating_screen: "text-red-400",
  dying: "text-red-500",
  dead: "text-gray-500",
};

export default function Home({ pet, user, onRefresh }: Props) {
  const [floatMsgs, setFloatMsgs] = useState<FloatMsg[]>([]);
  const [cooldowns, setCooldowns] = useState({ feed: false, play: false, clean: false });
  const [loading, setLoading] = useState({ feed: false, play: false, clean: false, revive: false });
  const [selectedFood, setSelectedFood] = useState<string>("kibble_basic");
  const [error, setError] = useState<string | null>(null);

  const addFloat = (text: string) => {
    const id = Date.now();
    const x = 30 + Math.random() * 40;
    setFloatMsgs(prev => [...prev, { id, text, x }]);
    setTimeout(() => setFloatMsgs(prev => prev.filter(m => m.id !== id)), 1500);
  };

  const setCooldown = (action: "feed" | "play" | "clean") => {
    setCooldowns(prev => ({ ...prev, [action]: true }));
    setTimeout(() => setCooldowns(prev => ({ ...prev, [action]: false })), 3000);
  };

  const handleFeed = async () => {
    if (cooldowns.feed || loading.feed) return;
    setLoading(l => ({ ...l, feed: true }));
    setError(null);
    try {
      await api.feedPet(selectedFood === "kibble_basic" ? null : selectedFood);
      addFloat("+Hunger");
      setCooldown("feed");
      onRefresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to feed");
    } finally {
      setLoading(l => ({ ...l, feed: false }));
    }
  };

  const handlePlay = async () => {
    if (cooldowns.play || loading.play) return;
    setLoading(l => ({ ...l, play: true }));
    setError(null);
    try {
      await api.playWithPet();
      addFloat("+Happiness");
      setCooldown("play");
      onRefresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to play");
    } finally {
      setLoading(l => ({ ...l, play: false }));
    }
  };

  const handleClean = async () => {
    if (cooldowns.clean || loading.clean) return;
    setLoading(l => ({ ...l, clean: true }));
    setError(null);
    try {
      await api.cleanPet();
      addFloat("+Clean");
      setCooldown("clean");
      onRefresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to clean");
    } finally {
      setLoading(l => ({ ...l, clean: false }));
    }
  };

  const handleRevive = async () => {
    if (loading.revive) return;
    setLoading(l => ({ ...l, revive: true }));
    setError(null);
    try {
      await api.revivePet();
      addFloat("Revived!");
      onRefresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Cannot revive");
    } finally {
      setLoading(l => ({ ...l, revive: false }));
    }
  };

  const formatAge = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h ${m}m`;
  };

  const ownedFoods = user
    ? ["kibble_basic", ...user.ownedItemIds.filter(id => ["cricket_live", "moth_premium", "roach_dubia"].includes(id))]
    : ["kibble_basic"];

  const foodNames: Record<string, string> = {
    kibble_basic: "Basic Kibble",
    cricket_live: "Live Cricket",
    moth_premium: "Giant Moth",
    roach_dubia: "Dubia Roach",
  };

  if (!pet) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500 text-sm font-mono animate-pulse">Loading Spidey...</div>
      </div>
    );
  }

  const moodColor = MOOD_COLORS[pet.mood] || "text-gray-400";
  const moodLabel = MOOD_LABELS[pet.mood] || pet.mood;

  return (
    <div className="relative flex flex-col h-full overflow-hidden">
      <ScreenEater percent={pet.screenEatPercent} />

      {/* Floating messages */}
      {floatMsgs.map(msg => (
        <div
          key={msg.id}
          className="absolute z-50 text-xs font-bold pointer-events-none animate-[float-up_1.5s_ease-out_forwards]"
          style={{ left: `${msg.x}%`, top: "30%", color: "#d97706" }}
        >
          {msg.text}
        </div>
      ))}

      {/* Pet terrarium */}
      <div className="relative flex-1 flex items-center justify-center overflow-hidden" style={{ minHeight: 0 }}>
        <div className="relative w-48 h-48">
          <Tarantula mood={pet.mood} petType={pet.petType} />
        </div>
      </div>

      {/* Mood */}
      <div className="text-center pb-1">
        <div className={`text-xs font-bold uppercase tracking-widest ${moodColor} animate-[flicker_4s_ease_infinite]`}>
          {moodLabel}
        </div>
        <div className="text-gray-600 text-xs mt-0.5">Age: {formatAge(pet.age)}</div>
      </div>

      {/* Stat bars */}
      <div className="px-4 pb-2 space-y-1.5">
        <StatBar label="Hunger" value={pet.hunger} colorClass="stat-hunger" />
        <StatBar label="Happy" value={pet.happiness} colorClass="stat-happiness" />
        <StatBar label="Health" value={pet.health} colorClass="stat-health" />
        <StatBar label="Clean" value={pet.cleanliness} colorClass="stat-cleanliness" />
      </div>

      {/* Error */}
      {error && (
        <div className="mx-4 mb-2 px-3 py-1.5 bg-red-900/40 border border-red-700/50 rounded text-red-300 text-xs text-center">
          {error}
        </div>
      )}

      {/* Action buttons */}
      {pet.isDead ? (
        <div className="px-4 pb-4">
          <div className="text-center text-gray-500 text-xs mb-2">
            {user?.isPremium ? "Revive free (Premium)" : "Revive for 150 coins"}
          </div>
          <button
            onClick={handleRevive}
            disabled={loading.revive || (!user?.isPremium && (user?.coins ?? 0) < 150)}
            className="btn-action w-full bg-red-900/60 border-red-700/50 text-red-300 hover:bg-red-800/60"
            data-testid="button-revive"
          >
            {loading.revive ? "Reviving..." : "Revive Spidey"}
          </button>
        </div>
      ) : (
        <div className="px-4 pb-4 space-y-2">
          {/* Food selector */}
          {ownedFoods.length > 1 && (
            <select
              value={selectedFood}
              onChange={e => setSelectedFood(e.target.value)}
              className="w-full bg-black/40 border border-amber-900/40 rounded px-2 py-1 text-xs text-amber-200 no-drag"
              data-testid="select-food"
            >
              {ownedFoods.map(id => (
                <option key={id} value={id}>{foodNames[id] ?? id}</option>
              ))}
            </select>
          )}

          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={handleFeed}
              disabled={cooldowns.feed || loading.feed}
              className="btn-action bg-amber-900/40 border-amber-700/50 text-amber-300 hover:bg-amber-800/50"
              data-testid="button-feed"
            >
              {cooldowns.feed ? "..." : loading.feed ? "Feeding" : "Feed"}
            </button>
            <button
              onClick={handlePlay}
              disabled={cooldowns.play || loading.play}
              className="btn-action bg-purple-900/40 border-purple-700/50 text-purple-300 hover:bg-purple-800/50"
              data-testid="button-play"
            >
              {cooldowns.play ? "..." : loading.play ? "Playing" : "Play"}
            </button>
            <button
              onClick={handleClean}
              disabled={cooldowns.clean || loading.clean}
              className="btn-action bg-blue-900/40 border-blue-700/50 text-blue-300 hover:bg-blue-800/50"
              data-testid="button-clean"
            >
              {cooldowns.clean ? "..." : loading.clean ? "Cleaning" : "Clean"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function StatBar({ label, value, colorClass }: { label: string; value: number; colorClass: string }) {
  const pct = Math.max(0, Math.min(100, value));
  const isLow = pct < 25;
  return (
    <div className="flex items-center gap-2">
      <span className="text-gray-500 text-xs w-10 shrink-0">{label}</span>
      <div className="flex-1 bg-black/40 rounded-full h-1.5 overflow-hidden border border-white/5">
        <div
          className={`stat-bar ${colorClass} ${isLow ? "animate-pulse" : ""}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={`text-xs w-7 text-right ${isLow ? "text-red-400" : "text-gray-500"}`}>{pct}</span>
    </div>
  );
}
