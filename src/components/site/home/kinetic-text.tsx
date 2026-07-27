"use client";

import { motion, useReducedMotion } from "motion/react";

export function KineticText({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const reduced = useReducedMotion();

  return (
    <motion.span
      animate={reduced ? undefined : { opacity: 1, y: 0 }}
      className={`inline-block ${className}`}
      initial={reduced ? false : { opacity: 0, y: 18 }}
      transition={{ duration: 0.72, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.span>
  );
}
