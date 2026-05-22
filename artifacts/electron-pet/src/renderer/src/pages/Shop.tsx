import { useState, useEffect } from "react";
import { api, type ShopItem, type ShopPet, type User } from "@/api";
import { Lock, Crown, ShoppingBag } from "lucide-react";

type Props = { user: User | null; onRefresh: () => void };

export default function Shop({ user, onRefresh }: Props) {
  const [items, setItems] = useState<ShopItem[]>([]);
  const [pets, setPets] = useState<ShopPet[]>([]);
  const [tab, setTab] = useState<"items" | "pets" | "premium">("items");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [earnLoading, setEarnLoading] = useState(false);

  useEffect(() => {
    api.getShopItems().then(setItems).catch(() => {});
    api.getShopPets().then(setPets).catch(() => {});
  }, []);

  const showMsg = (text: string) => {
    setMsg(text);
    setTimeout(() => setMsg(null), 3000);
  };

  const purchase = async (itemId: string | null, petId: string | null) => {
    if (loading) return;
    setLoading(true);
    try {
      const result = await api.purchaseItem(itemId, petId);
      showMsg(result.message);
      onRefresh();
    } catch (e: unknown) {
      showMsg(e instanceof Error ? e.message : "Purchase failed");
    } finally {
      setLoading(false);
    }
  };

  const earnCoins = async (source: "daily" | "ad") => {
    if (earnLoading) return;
    setEarnLoading(true);
    try {
      await api.earnCoins(source);
      showMsg(source === "daily" ? `Daily reward claimed!` : "+20 coins earned!");
      onRefresh();
    } catch (e: unknown) {
      showMsg(e instanceof Error ? e.message : "Could not earn coins");
    } finally {
      setEarnLoading(false);
    }
  };

  const upgradePremium = async () => {
    try {
      await api.upgradePremium();
      showMsg("Welcome to Premium!");
      onRefresh();
    } catch {
      showMsg("Upgrade failed");
    }
  };

  const canClaimDaily = !user?.dailyRewardClaimedAt || (() => {
    const lastClaim = new Date(user.dailyRewardClaimedAt);
    return (Date.now() - lastClaim.getTime()) / 3600000 >= 24;
  })();

  const rarityColors: Record<string, string> = {
    common: "text-gray-400",
    rare: "text-blue-400",
    legendary: "text-amber-400",
  };

  const tabItems = items.filter(i => i.category === "food" || i.category === "medicine" || i.category === "accessory");

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {msg && (
        <div className="mx-3 mt-2 px-3 py-1.5 bg-amber-900/40 border border-amber-700/50 rounded text-amber-300 text-xs text-center">
          {msg}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-white/5 px-3 pt-2 gap-1">
        {(["items", "pets", "premium"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-1.5 text-xs font-mono rounded-t capitalize transition-colors no-drag ${
              tab === t ? "bg-amber-900/40 text-amber-300 border-b border-amber-500" : "text-gray-500 hover:text-gray-300"
            }`}
            data-testid={`tab-${t}`}
          >
            {t === "premium" ? <Crown size={12} className="inline mr-1" /> : <ShoppingBag size={12} className="inline mr-1" />}
            {t}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
        {tab === "items" && tabItems.map(item => {
          const owned = user?.ownedItemIds.includes(item.id);
          const locked = item.isPremium && !user?.isPremium;
          const canAfford = (user?.coins ?? 0) >= item.price;
          return (
            <div key={item.id} className="bg-black/30 border border-white/5 rounded-lg p-2.5 flex items-center gap-2" data-testid={`item-${item.id}`}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <span className="text-xs font-bold text-amber-200 truncate">{item.name}</span>
                  {item.isPremium && <Crown size={10} className="text-amber-400 shrink-0" />}
                </div>
                <div className="text-xs text-gray-500 truncate">{item.description}</div>
                <div className="flex gap-2 mt-1 text-xs">
                  {item.hungerBoost > 0 && <span className="text-amber-600">+{item.hungerBoost}H</span>}
                  {item.happinessBoost > 0 && <span className="text-purple-600">+{item.happinessBoost}J</span>}
                  {item.healthBoost > 0 && <span className="text-green-700">+{item.healthBoost}HP</span>}
                </div>
              </div>
              <div className="shrink-0">
                {locked ? (
                  <div className="flex items-center gap-1 text-xs text-gray-600"><Lock size={10} />Premium</div>
                ) : owned ? (
                  <div className="text-xs text-green-600">Owned</div>
                ) : item.price === 0 ? (
                  <div className="text-xs text-gray-500">Free</div>
                ) : (
                  <button
                    onClick={() => purchase(item.id, null)}
                    disabled={loading || !canAfford}
                    className={`btn-action text-xs px-2 py-1 ${canAfford ? "bg-amber-900/50 text-amber-300 border-amber-700/40 hover:bg-amber-800/50" : "bg-gray-900/40 text-gray-600 border-gray-700/30"}`}
                    data-testid={`buy-${item.id}`}
                  >
                    {item.price}c
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {tab === "pets" && pets.map(pet => {
          const owned = user?.ownedPetIds.includes(pet.id);
          const locked = pet.isPremium && !user?.isPremium;
          const canAfford = (user?.coins ?? 0) >= pet.price;
          return (
            <div key={pet.id} className="bg-black/30 border border-white/5 rounded-lg p-2.5" data-testid={`pet-${pet.id}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold text-amber-200">{pet.name}</span>
                    {pet.isPremium && <Crown size={10} className="text-amber-400" />}
                    <span className={`text-xs ${rarityColors[pet.rarity] ?? "text-gray-500"} capitalize`}>{pet.rarity}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">{pet.description}</div>
                </div>
                <div className="shrink-0">
                  {locked ? (
                    <div className="flex items-center gap-1 text-xs text-gray-600"><Lock size={10} />Premium</div>
                  ) : owned ? (
                    <div className="text-xs text-green-600">Owned</div>
                  ) : pet.price === 0 ? (
                    <div className="text-xs text-gray-500">Free</div>
                  ) : (
                    <button
                      onClick={() => purchase(null, pet.id)}
                      disabled={loading || !canAfford}
                      className={`btn-action text-xs px-2 py-1 ${canAfford ? "bg-amber-900/50 text-amber-300 border-amber-700/40 hover:bg-amber-800/50" : "bg-gray-900/40 text-gray-600 border-gray-700/30"}`}
                      data-testid={`buy-pet-${pet.id}`}
                    >
                      {pet.price}c
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {tab === "premium" && (
          <div className="space-y-3 py-2">
            {user?.isPremium ? (
              <div className="text-center py-4">
                <Crown size={28} className="text-amber-400 mx-auto mb-2" />
                <div className="text-amber-300 font-bold text-sm">You are Premium</div>
                <div className="text-gray-500 text-xs mt-1">Enjoy all perks, keeper.</div>
              </div>
            ) : (
              <>
                <div className="bg-amber-900/20 border border-amber-700/30 rounded-lg p-3 text-center">
                  <Crown size={24} className="text-amber-400 mx-auto mb-2" />
                  <div className="text-amber-300 font-bold text-xs mb-1">Go Premium</div>
                  <div className="text-gray-400 text-xs mb-3">Unlock all pets, premium food, better daily rewards, and free revives.</div>
                  <button onClick={upgradePremium} className="btn-action bg-amber-700/60 text-amber-100 border-amber-600/50 hover:bg-amber-600/60 w-full" data-testid="button-upgrade-premium">
                    Upgrade to Premium
                  </button>
                </div>
                <div className="space-y-1 text-xs text-gray-500 px-1">
                  <div>+ Access to Dragon Spider &amp; Golden Tarantula</div>
                  <div>+ Premium food items (Dubia Roach, Liquid Gold)</div>
                  <div>+ Free revives when your pet dies</div>
                  <div>+ 75 coins daily reward (vs 30)</div>
                </div>
              </>
            )}

            <div className="border-t border-white/5 pt-3 space-y-2">
              <div className="text-xs text-gray-500 uppercase tracking-wider">Earn Coins</div>
              <button
                onClick={() => earnCoins("daily")}
                disabled={!canClaimDaily || earnLoading}
                className={`btn-action w-full text-xs ${canClaimDaily ? "bg-green-900/40 text-green-300 border-green-700/40 hover:bg-green-800/50" : "bg-gray-900/30 text-gray-600 border-gray-800/30"}`}
                data-testid="button-daily-reward"
              >
                {canClaimDaily ? `Claim Daily Reward (+${user?.isPremium ? "75" : "30"} coins)` : "Daily Reward Claimed"}
              </button>
              <button
                onClick={() => earnCoins("ad")}
                disabled={earnLoading}
                className="btn-action w-full text-xs bg-blue-900/30 text-blue-300 border-blue-700/30 hover:bg-blue-800/40"
                data-testid="button-earn-ad"
              >
                Watch Ad (+20 coins)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
