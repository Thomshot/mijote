import { useMemo } from "react";

const HEARTS = ["❤️", "💖", "💕", "💗", "💘", "🥰", "💞"];

/** 🤫 */
export function LoveEgg({ onClose }: { onClose: () => void }) {
  const hearts = useMemo(
    () =>
      Array.from({ length: 36 }, (_, i) => ({
        e: HEARTS[i % HEARTS.length],
        left: Math.random() * 100,
        delay: Math.random() * 4,
        dur: 4 + Math.random() * 4,
        size: 18 + Math.random() * 30,
      })),
    [],
  );
  return (
    <div className="love" onClick={onClose} role="dialog" aria-label="Message secret">
      {hearts.map((h, i) => (
        <span
          key={i}
          className="love__heart"
          style={{ left: `${h.left}%`, animationDelay: `${h.delay}s`, animationDuration: `${h.dur}s`, fontSize: h.size }}
        >
          {h.e}
        </span>
      ))}
      <div className="love__card">
        <div className="love__big">💝</div>
        <p className="love__text">Je t'aime mon bebew</p>
        <small>touche pour fermer</small>
      </div>
    </div>
  );
}
