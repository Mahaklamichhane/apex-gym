"use client";

import { useEffect } from "react";
import { animate, motion, useMotionValue, useTransform } from "framer-motion";

/** Animated number that counts up to `value` on mount/update. */
export function CountUp({
  value,
  format,
  className,
}: {
  value: number;
  format?: (n: number) => string;
  className?: string;
}) {
  const mv = useMotionValue(0);
  const text = useTransform(mv, (v) =>
    format ? format(v) : Math.round(v).toLocaleString(),
  );

  useEffect(() => {
    const controls = animate(mv, value, { duration: 0.9, ease: [0.16, 1, 0.3, 1] });
    return () => controls.stop();
  }, [mv, value]);

  return <motion.span className={className}>{text}</motion.span>;
}
