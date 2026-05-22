import { useEffect, useState, useRef } from "react";

type Props = { text: string | null; x: number; y: number; behavior: string };

export default function SpeechBubble({ text, x, y, behavior }: Props) {
  const [shown, setShown] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!text) return;
    if (text === shown && visible) return;
    setShown(text);
    setVisible(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    const dur = behavior === "rage" || behavior === "angry" ? 1800 : 2500;
    timerRef.current = setTimeout(() => setVisible(false), dur);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [text]);

  if (!visible || !shown) return null;

  const isAngry = behavior === "angry" || behavior === "rage" || behavior === "screen_bite";
  const isSleeping = behavior === "sleep" || behavior === "curl_up";
  const isPlay = behavior === "play" || behavior === "eat_food";

  const bg = isAngry ? "rgba(60,0,0,0.92)" : isSleeping ? "rgba(18,14,45,0.88)" : isPlay ? "rgba(10,30,10,0.88)" : "rgba(15,12,28,0.88)";
  const fg = isAngry ? "#ff7070" : isSleeping ? "#b0a0ff" : isPlay ? "#7eff7e" : "#e0d4b0";
  const bdr = isAngry ? "rgba(180,30,30,0.7)" : isSleeping ? "rgba(80,60,180,0.5)" : "rgba(100,80,40,0.4)";
  const shadow = isAngry ? "0 0 16px rgba(200,20,20,0.45)" : "0 2px 10px rgba(0,0,0,0.55)";

  return (
    <div style={{ position: "fixed", left: x - 50, top: y - 78, pointerEvents: "none", zIndex: 50, animation: "bubbleIn 0.2s ease-out" }}>
      <div style={{
        background: bg, border: `1px solid ${bdr}`, borderRadius: 10,
        padding: "4px 12px", color: fg, fontFamily: "'Courier New', monospace",
        fontSize: isAngry ? 14 : 12, fontWeight: isAngry ? "bold" : "normal",
        whiteSpace: "nowrap", backdropFilter: "blur(6px)", boxShadow: shadow,
      }}>
        {shown}
      </div>
      <div style={{ width: 0, height: 0, marginLeft: 18, borderLeft: "6px solid transparent", borderRight: "6px solid transparent", borderTop: `6px solid ${bg}` }} />
    </div>
  );
}
