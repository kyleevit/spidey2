import { useState } from "react";
import { Minus, X, Pin, PinOff } from "lucide-react";

declare global {
  interface Window {
    windowAPI?: {
      minimize: () => void;
      close: () => void;
      togglePin: (pin: boolean) => void;
    };
  }
}

export default function WindowControls() {
  const [pinned, setPinned] = useState(true);

  const togglePin = () => {
    const next = !pinned;
    setPinned(next);
    window.windowAPI?.togglePin(next);
  };

  return (
    <div className="flex items-center gap-1 no-drag">
      <button
        onClick={togglePin}
        className="w-6 h-6 rounded flex items-center justify-center text-yellow-400 hover:bg-white/10 transition-colors"
        title={pinned ? "Unpin from top" : "Pin always on top"}
      >
        {pinned ? <Pin size={12} /> : <PinOff size={12} />}
      </button>
      <button
        onClick={() => window.windowAPI?.minimize()}
        className="w-6 h-6 rounded flex items-center justify-center text-gray-400 hover:bg-white/10 transition-colors"
        title="Minimize"
      >
        <Minus size={12} />
      </button>
      <button
        onClick={() => window.windowAPI?.close()}
        className="w-6 h-6 rounded flex items-center justify-center text-gray-400 hover:bg-red-500/70 transition-colors"
        title="Hide to tray"
      >
        <X size={12} />
      </button>
    </div>
  );
}
