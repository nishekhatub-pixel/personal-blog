"use client";

import { ListPlus } from "lucide-react";
import { useState } from "react";
import { useAudioPlayer } from "@/components/site/music/audio-player-provider";

export function PlaylistQueueButton({
  title,
  trackIds,
}: {
  title: string;
  trackIds: string[];
}) {
  const { setQueue, tracks } = useAudioPlayer();
  const [message, setMessage] = useState("");
  const playableIds = trackIds.filter((id) =>
    tracks.some((track) => track.id === id),
  );

  const loadQueue = () => {
    if (!playableIds.length) return;
    setQueue(playableIds, playableIds[0]);
    setMessage(`已载入 ${playableIds.length} 首，播放器保持暂停。`);
  };

  return (
    <div>
      <button
        type="button"
        disabled={!playableIds.length}
        onClick={loadQueue}
        className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[var(--line-strong)] px-4 text-sm font-semibold text-[var(--accent)] transition-colors hover:bg-[var(--accent-soft)] disabled:cursor-not-allowed disabled:opacity-45"
        aria-label={`把歌单“${title}”载入播放队列`}
      >
        <ListPlus aria-hidden size={17} />
        载入播放队列
      </button>
      {message ? (
        <p aria-live="polite" className="mt-2 text-xs text-[var(--muted)]">
          {message}
        </p>
      ) : null}
    </div>
  );
}
