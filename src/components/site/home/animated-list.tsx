"use client";

import { Children } from "react";
import { motion, useReducedMotion } from "motion/react";

export function AnimatedList({
  children,
  className = "",
  itemClassName = "",
}: {
  children: React.ReactNode;
  className?: string;
  itemClassName?: string;
}) {
  const reduced = useReducedMotion();
  const items = Children.toArray(children);

  return (
    <ul className={className}>
      {items.map((item, index) => (
        <motion.li
          className={itemClassName}
          initial={reduced ? false : { opacity: 0, y: index % 3 === 1 ? 22 : 12 }}
          key={index}
          transition={{
            delay: index * 0.055,
            duration: index % 2 === 0 ? 0.52 : 0.68,
            ease: [0.16, 1, 0.3, 1],
          }}
          viewport={{ amount: 0.15, once: true }}
          whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
        >
          {item}
        </motion.li>
      ))}
    </ul>
  );
}
