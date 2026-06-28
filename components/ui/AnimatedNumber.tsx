"use client";

import { animate, useInView } from "motion/react";
import { useEffect, useRef, useState } from "react";

interface Props {
  value: number;
  duration?: number;
  delay?: number;
  /** Format the in-flight numeric value into the displayed string. */
  format?: (v: number) => string;
  className?: string;
  /** Start value for the very first animation. */
  from?: number;
}

export function AnimatedNumber({
  value,
  duration = 1.1,
  delay = 0,
  format,
  className,
  from = 0,
}: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-8% 0px" });
  const prev = useRef(from);
  const [display, setDisplay] = useState(from);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(prev.current, value, {
      duration,
      delay,
      ease: [0.2, 0.8, 0.2, 1],
      onUpdate: (v) => setDisplay(v),
    });
    prev.current = value;
    return () => controls.stop();
  }, [inView, value, duration, delay]);

  return (
    <span ref={ref} className={className}>
      {format ? format(display) : Math.round(display).toLocaleString("en-US")}
    </span>
  );
}

export const fmt = {
  euro: (v: number) => `€${Math.round(v).toLocaleString("en-US")}`,
  euroSigned: (v: number) => `+€${Math.round(v).toLocaleString("en-US")}`,
  pct: (v: number) => `${Math.round(v)}%`,
  days: (v: number) => `${Math.round(v)}`,
  int: (v: number) => Math.round(v).toLocaleString("en-US"),
};
