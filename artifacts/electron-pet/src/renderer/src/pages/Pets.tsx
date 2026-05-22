import { useState, useEffect } from "react";
import { api, type ShopPet, type User } from "@/api";
import Tarantula from "@/components/Tarantula";

type Props = { user: User | null; onRefresh: () => void };

export default function Pets({ user, onRefresh }: Props) {
  const [shopPets, setShopPets] = useState<ShopPet[]>([]);
  const [switching, setSwitching] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    api.getShopPets().then(setShopPets).catch(() => {});
  }, []);

  const showMsg = (text: string) => {
    setMsg(text);
    setTimeout(() => setMsg(null), 2500);
  };

  const handleSelect = async (petId: string) => {
    setSwitching(petId);
    try {
      await api.selectPet(parseInt(petId));
      showMsg("Active pet changed!");
      onRefresh();
    } catch (e: unknown) {
      showMsg(e instanceof Error ? e.message : "Failed to switch pet");
    } finally {
      setSwitching(null);
    }
  };

  const ownedPets = shopPets.filter(p => user?.ownedPetIds.includes(p.id));
  const lockedPets = shopPets.filter(p => !user?.ownedPetIds.includes(p.id));

  const rarityColors: Record<string, string> = {
    common: "border-gray-700/30",
    rare: "border-blue-700/30",
    legendary: "border-amber-700/40",
  };

  const petTypeMoods: Record<string, string> = {
    tarantula: "happy",
    scorpion: "content",
    dragon_spider: "angry",
    golden_tarantula: "happy",
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {msg && (
        <div className="mx-3 mt-2 px-3 py-1.5 bg-amber-900/40 border border-amber-700/50 rounded text-amber-300 text-xs text-center">
          {msg}
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
        {ownedPets.length > 0 && (
          <>
            <div className="text-xs text-gray-600 uppercase tracking-wider px-1">Your Collection</div>
            {ownedPets.map(pet => (
              <div key={pet.id} className={`bg-black/30 border ${rarityColors[pet.rarity] ?? "border-white/5"} rounded-lg p-2.5 flex items-center gap-3`} data-testid={`owned-pet-${pet.id}`}>
                <div className="w-12 h-12 shrink-0">
                  <Tarantula mood={petTypeMoods[pet.petType] ?? "content"} petType={pet.petType} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-amber-200 truncate">{pet.name}</div>
                  <div className="text-xs text-gray-500 capitalize">{pet.rarity}</div>
                </div>
                <button
                  onClick={() => handleSelect(pet.id)}
                  disabled={switching === pet.id}
                  className="btn-action text-xs px-2 py-1 bg-purple-900/40 text-purple-300 border-purple-700/30 hover:bg-purple-800/40"
                  data-testid={`select-pet-${pet.id}`}
                >
                  {switching === pet.id ? "..." : "Switch"}
                </button>
              </div>
            ))}
          </>
        )}

        {lockedPets.length > 0 && (
          <>
            <div className="text-xs text-gray-600 uppercase tracking-wider px-1 pt-2">Locked</div>
            {lockedPets.map(pet => (
              <div key={pet.id} className={`bg-black/20 border ${rarityColors[pet.rarity] ?? "border-white/5"} rounded-lg p-2.5 flex items-center gap-3 opacity-50`} data-testid={`locked-pet-${pet.id}`}>
                <div className="w-12 h-12 shrink-0 grayscale">
                  <Tarantula mood="content" petType={pet.petType} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-gray-400 truncate">{pet.name}</div>
                  <div className="text-xs text-gray-600">{pet.price === 0 ? "Free" : `${pet.price} coins`} {pet.isPremium ? "• Premium" : ""}</div>
                </div>
                <div className="text-xs text-gray-600">Locked</div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
