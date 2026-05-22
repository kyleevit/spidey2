import type { FoodItem as FoodItemType, ToyItem } from "../state/petState";
import { FOOD_STATS, TOY_EMOJI } from "../state/petState";

export function FoodItemEl({ food }: { food: FoodItemType }) {
  const info = FOOD_STATS[food.kind];
  return (
    <div
      style={{
        position: "fixed",
        left: food.x - 20,
        top: food.y - 20,
        width: 40,
        height: 40,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 26,
        pointerEvents: "none",
        zIndex: 30,
        animation: "foodBounce 0.9s ease-in-out infinite",
        filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.55))",
        userSelect: "none",
      }}
      title={info.label}
    >
      {info.emoji}
    </div>
  );
}

export function ToyItemEl({ toy }: { toy: ToyItem }) {
  return (
    <div
      style={{
        position: "fixed",
        left: toy.x - 18,
        top: toy.y - 18,
        width: 36,
        height: 36,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 24,
        pointerEvents: "none",
        zIndex: 28,
        filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.5))",
        userSelect: "none",
        transition: "left 0.1s linear, top 0.1s linear",
      }}
    >
      {TOY_EMOJI[toy.kind]}
    </div>
  );
}
