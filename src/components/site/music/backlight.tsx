"use client";

import Image from "next/image";

export function Backlight({
  children,
  imageUrl,
}: {
  children: React.ReactNode;
  imageUrl: string | null;
}) {
  return (
    <div className="relative isolate">
      {imageUrl ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -inset-5 -z-10 overflow-hidden rounded-[1.75rem] opacity-30 blur-2xl"
        >
          <Image
            alt=""
            className="scale-110 object-cover"
            fill
            sizes="20rem"
            src={imageUrl}
          />
        </div>
      ) : (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -inset-5 -z-10 rounded-[1.75rem] bg-[var(--music-glow)] opacity-35 blur-2xl"
        />
      )}
      {children}
    </div>
  );
}
