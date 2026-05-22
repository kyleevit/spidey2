import { useState, useEffect, useCallback } from "react";
import { api, type Pet, type User } from "@/api";
import Home from "@/pages/Home";
import Shop from "@/pages/Shop";
import Pets from "@/pages/Pets";
import WindowControls from "@/components/WindowControls";
import { Home as HomeIcon, ShoppingBag, Spider } from "lucide-react";

type Tab = "home" | "shop" | "pets";

function SpiderIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <ellipse cx="12" cy="12" rx="4" ry="5" />
      <ellipse cx="12" cy="8" rx="3" ry="2.5" />
      <line x1="12" y1="9" x2="5" y2="6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="12" y1="11" x2="4" y2="11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="12" y1="13" x2="5" y2="16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="12" y1="9" x2="19" y2="6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="12" y1="11" x2="20" y2="11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="12" y1="13" x2="19" y2="16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export default function App() {
  const [tab, setTab] = useState<Tab>("home");
  const [pet, setPet] = useState<Pet | null>(null);
  const [user, setUser] = useState<User | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [petData, userData] = await Promise.all([api.getPet(), api.getUser()]);
      setPet(petData);
      setUser(userData);
    } catch {
      // server may not be ready yet
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const isEatingScreen = pet && pet.screenEatPercent > 0 && !pet.isDead;

  return (
    <div
      className="w-full h-full flex flex-col overflow-hidden"
      style={{
        background: "linear-gradient(160deg, #0f0c18 0%, #0a0a0f 60%, #0c0812 100%)",
        borderRadius: "12px",
        border: "1px solid rgba(60, 40, 90, 0.5)",
        boxShadow: isEatingScreen
          ? "0 0 30px rgba(120, 30, 30, 0.6), 0 0 60px rgba(60, 0, 0, 0.3)"
          : "0 0 20px rgba(60, 20, 100, 0.4), 0 4px 40px rgba(0,0,0,0.8)",
        transition: "box-shadow 1s ease",
      }}
    >
      {/* Title bar */}
      <div
        className="drag-region flex items-center justify-between px-3 py-2 shrink-0"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
      >
        <div className="flex items-center gap-1.5 no-drag">
          <SpiderIcon size={14} />
          <span className="text-xs font-bold text-amber-300 tracking-wider">SPIDEY</span>
          {user && (
            <span className="ml-2 text-xs text-amber-600 font-mono">{user.coins}c</span>
          )}
          {user?.isPremium && (
            <span className="text-xs text-amber-400 ml-1">PREMIUM</span>
          )}
        </div>
        <WindowControls />
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 relative">
        {tab === "home" && <Home pet={pet} user={user} onRefresh={fetchData} />}
        {tab === "shop" && <Shop user={user} onRefresh={fetchData} />}
        {tab === "pets" && <Pets user={user} onRefresh={fetchData} />}
      </div>

      {/* Hunger warning flash */}
      {isEatingScreen && (
        <div
          className="absolute inset-0 pointer-events-none rounded-xl"
          style={{
            border: `2px solid rgba(220, 38, 38, ${(pet.screenEatPercent / 100) * 0.8})`,
            animation: "pulse-glow 1.5s ease-in-out infinite",
            boxShadow: `inset 0 0 ${pet.screenEatPercent}px rgba(220, 38, 38, 0.15)`,
          }}
        />
      )}

      {/* Bottom nav */}
      <div
        className="flex items-center border-t shrink-0"
        style={{ borderColor: "rgba(255,255,255,0.04)", background: "rgba(0,0,0,0.3)" }}
      >
        {([
          { id: "home", icon: <SpiderIcon size={14} />, label: "Pet" },
          { id: "shop", icon: <ShoppingBag size={14} />, label: "Shop" },
          { id: "pets", icon: <SpiderIcon size={14} />, label: "Pets" },
        ] as const).map(({ id, icon, label }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex-1 flex flex-col items-center py-2 gap-0.5 no-drag transition-colors ${
              tab === id ? "text-amber-400" : "text-gray-600 hover:text-gray-400"
            }`}
            data-testid={`nav-${id}`}
          >
            {icon}
            <span className="text-xs" style={{ fontSize: "9px" }}>{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
