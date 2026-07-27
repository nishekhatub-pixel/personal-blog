"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useAtmosphere } from "@/components/site/atmosphere/atmosphere-provider";

type PetalStyle = CSSProperties & {
  "--petal-delay": string;
  "--petal-drift": string;
  "--petal-duration": string;
  "--petal-rotate": string;
  "--petal-rotate-end": string;
  "--petal-scale": string;
  "--petal-x": string;
};

function seedNumber(value: string) {
  let hash = 2166136261;
  for (const character of value) {
    hash ^= character.codePointAt(0) ?? 0;
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function randomFactory(seed: number) {
  let value = seed;
  return () => {
    value += 0x6d2b79f5;
    let next = value;
    next = Math.imul(next ^ (next >>> 15), next | 1);
    next ^= next + Math.imul(next ^ (next >>> 7), next | 61);
    return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
  };
}

function createPetals(seed: string, count: number) {
  const random = randomFactory(seedNumber(seed));
  return Array.from({ length: count }, (_, index) => {
    const rotation = Math.round(random() * 300 + 80);
    return {
      id: `${seed}-${index}`,
      style: {
        "--petal-delay": `${(-random() * 18).toFixed(2)}s`,
        "--petal-drift": `${(random() * 24 - 12).toFixed(2)}vw`,
        "--petal-duration": `${(14 + random() * 11).toFixed(2)}s`,
        "--petal-rotate": `${rotation}deg`,
        "--petal-rotate-end": `${Math.round(rotation * 1.7)}deg`,
        "--petal-scale": `${(0.62 + random() * 0.7).toFixed(2)}`,
        "--petal-x": `${(random() * 100).toFixed(2)}vw`,
      } as PetalStyle,
    };
  });
}

export function PetalField({
  className = "",
  seed = "r7-garden",
}: {
  className?: string;
  seed?: string;
}) {
  const { density, enabled, ready } = useAtmosphere();
  const [device, setDevice] = useState({
    mobile: true,
    ready: false,
    reduced: true,
  });

  useEffect(() => {
    const mobileQuery = window.matchMedia("(max-width: 767px)");
    const reducedQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () =>
      setDevice({
        mobile: mobileQuery.matches,
        ready: true,
        reduced: reducedQuery.matches,
      });
    update();
    mobileQuery.addEventListener("change", update);
    reducedQuery.addEventListener("change", update);
    return () => {
      mobileQuery.removeEventListener("change", update);
      reducedQuery.removeEventListener("change", update);
    };
  }, []);

  const count = device.mobile
    ? { high: 8, low: 5, medium: 7 }[density]
    : { high: 24, low: 16, medium: 20 }[density];
  const petals = useMemo(() => createPetals(seed, count), [count, seed]);

  if (!ready || !device.ready || !enabled || device.reduced) return null;

  return (
    <div
      aria-hidden="true"
      className={`petal-field pointer-events-none fixed inset-0 overflow-hidden ${className}`}
    >
      {petals.map((petal) => (
        <span className="petal-field__petal" key={petal.id} style={petal.style} />
      ))}
    </div>
  );
}
