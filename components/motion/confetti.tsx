"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";

const COLORS = ["#10b981", "#34d399", "#fbbf24", "#38bdf8", "#f472b6", "#a78bfa"];

// Pure, deterministic pseudo-random in [0,1) from a seed — keeps render pure.
function rand(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

/** A one-shot confetti burst that rains down over the viewport. */
export function Confetti({ count = 48 }: { count?: number }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => ({
        id: i,
        left: rand(i + 1) * 100,
        delay: rand(i * 1.3 + 2) * 0.4,
        duration: 1.8 + rand(i * 2.1 + 3) * 1.4,
        rotate: (rand(i * 3.7 + 4) - 0.5) * 720,
        color: COLORS[i % COLORS.length],
        size: 6 + rand(i * 1.7 + 5) * 6,
      })),
    [count],
  );

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {pieces.map((p) => (
        <motion.span
          key={p.id}
          className="absolute top-0 rounded-[2px]"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 1.4,
            background: p.color,
          }}
          initial={{ y: -30, opacity: 1, rotate: 0 }}
          animate={{ y: "105vh", rotate: p.rotate, opacity: [1, 1, 0.9, 0] }}
          transition={{ duration: p.duration, delay: p.delay, ease: "easeIn" }}
        />
      ))}
    </div>
  );
}
