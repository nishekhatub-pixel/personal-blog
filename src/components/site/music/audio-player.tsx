"use client";

import {
  ListMusic,
  Pause,
  Play,
  Repeat,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
  Volume1,
  Volume2,
  VolumeX,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback } from "react";
import { Backlight } from "@/components/site/music/backlight";
import { useAudioPlayer } from "@/components/site/music/audio-player-provider";

function formatTime(value: number) {
  if (!Number.isFinite(value) || value < 0) return "0:00";
  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60);
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function Cover({
  alt,
  compact = false,
  url,
}: {
  alt: string;
  compact?: boolean;
  url: string | null;
}) {
  return (
    <div
      className={[
        "relative shrink-0 overflow-hidden rounded-[var(--radius-media,0.75rem)] bg-[var(--surface-strong)]",
        compact ? "size-16" : "aspect-square w-full",
      ].join(" ")}
    >
      {url ? (
        <Image
          alt={alt}
          className="object-cover"
          fill
          sizes={compact ? "64px" : "(max-width: 768px) 80vw, 420px"}
          src={url}
        />
      ) : (
        <div
          aria-label="R7 音乐封面占位图形"
          className="grid size-full place-items-center bg-[radial-gradient(circle,var(--ink)_0_7%,transparent_8%_24%,var(--accent)_25%_31%,var(--ink)_32%_50%,var(--surface-strong)_51%)]"
          role="img"
        >
          <span className="rounded-full bg-[var(--surface)] px-2 py-1 font-mono text-[10px] font-bold text-[var(--ink)]">
            R7
          </span>
        </div>
      )}
    </div>
  );
}

function PlayButton({ compact = false }: { compact?: boolean }) {
  const { currentTrack, isPlaying, toggle } = useAudioPlayer();
  return (
    <button
      aria-label={isPlaying ? "暂停音乐" : "播放音乐"}
      className={[
        "grid shrink-0 place-items-center rounded-full bg-[var(--accent)] text-[var(--accent-ink)] shadow-[var(--shadow-raised)] transition-transform active:translate-y-px active:shadow-[var(--shadow-pressed)] disabled:cursor-not-allowed disabled:opacity-45",
        compact ? "size-11" : "size-14",
      ].join(" ")}
      disabled={!currentTrack}
      onClick={() => void toggle()}
      type="button"
    >
      {isPlaying ? (
        <Pause aria-hidden="true" fill="currentColor" size={compact ? 17 : 21} />
      ) : (
        <Play
          aria-hidden="true"
          fill="currentColor"
          size={compact ? 17 : 21}
        />
      )}
    </button>
  );
}

function TrackButtons({ compact = false }: { compact?: boolean }) {
  const { currentTrack, next, previous } = useAudioPlayer();
  const className = compact
    ? "grid size-11 place-items-center rounded-[var(--radius-control,0.625rem)] text-[var(--muted)] hover:text-[var(--ink)] disabled:opacity-35"
    : "grid size-12 place-items-center rounded-[var(--radius-control,0.625rem)] text-[var(--muted)] hover:bg-[var(--surface-strong)] hover:text-[var(--ink)] disabled:opacity-35";
  return (
    <>
      <button
        aria-label="上一首"
        className={className}
        disabled={!currentTrack}
        onClick={() => void previous()}
        type="button"
      >
        <SkipBack aria-hidden="true" size={compact ? 18 : 20} />
      </button>
      <PlayButton compact={compact} />
      <button
        aria-label="下一首"
        className={className}
        disabled={!currentTrack}
        onClick={() => void next()}
        type="button"
      >
        <SkipForward aria-hidden="true" size={compact ? 18 : 20} />
      </button>
    </>
  );
}

function Progress({ compact = false }: { compact?: boolean }) {
  const { currentTime, currentTrack, duration, seek } = useAudioPlayer();
  const maximum = Math.max(1, duration || currentTrack?.durationSeconds || 0);
  return (
    <div className={compact ? "mt-3" : "mt-6"}>
      <input
        aria-label="音乐播放进度"
        className="h-11 w-full cursor-pointer accent-[var(--accent)]"
        disabled={!currentTrack}
        max={maximum}
        min={0}
        onChange={(event) => seek(Number(event.currentTarget.value))}
        step={0.1}
        type="range"
        value={Math.min(currentTime, maximum)}
      />
      <div className="-mt-2 flex items-center justify-between font-mono text-[10px] text-[var(--muted)]">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration || currentTrack?.durationSeconds || 0)}</span>
      </div>
    </div>
  );
}

function VolumeControl({ compact = false }: { compact?: boolean }) {
  const { setVolume, volume } = useAudioPlayer();
  const VolumeIcon = volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;
  return (
    <label
      className={[
        "flex min-h-11 items-center gap-2 text-[var(--muted)]",
        compact ? "max-w-32" : "min-w-40",
      ].join(" ")}
    >
      <span className="sr-only">音量</span>
      <VolumeIcon aria-hidden="true" className="shrink-0" size={17} />
      <input
        aria-label="音量"
        className="h-11 min-w-0 flex-1 cursor-pointer accent-[var(--accent)]"
        max={1}
        min={0}
        onChange={(event) => setVolume(Number(event.currentTarget.value))}
        step={0.01}
        type="range"
        value={volume}
      />
    </label>
  );
}

function EmptyPlayer({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={[
        "border border-dashed border-[var(--line)] bg-[var(--surface)] text-[var(--muted)]",
        compact ? "rounded-[1.125rem] p-5" : "rounded-[1.125rem] p-8",
      ].join(" ")}
    >
      <ListMusic aria-hidden="true" size={compact ? 23 : 30} strokeWidth={1.5} />
      <p className="mt-3 font-medium text-[var(--ink)]">音乐还没有入住</p>
      <p className="mt-1 text-sm leading-6">
        管理员上传有权使用的音频或添加合法 HTTPS 直链后，这里会出现真实播放队列。
      </p>
    </div>
  );
}

function keyboardHandler(
  event: React.KeyboardEvent<HTMLElement>,
  controls: {
    currentTime: number;
    next: () => Promise<void>;
    previous: () => Promise<void>;
    seek: (value: number) => void;
    toggle: () => Promise<void>;
  },
) {
  if (
    event.target instanceof Element &&
    event.target.closest("a, button, input, select, textarea, [contenteditable='true']")
  ) {
    return;
  }
  if (event.key === " ") {
    event.preventDefault();
    void controls.toggle();
  } else if (event.key === "ArrowRight") {
    event.preventDefault();
    controls.seek(controls.currentTime + 5);
  } else if (event.key === "ArrowLeft") {
    event.preventDefault();
    controls.seek(controls.currentTime - 5);
  } else if (event.key === "PageDown") {
    event.preventDefault();
    void controls.next();
  } else if (event.key === "PageUp") {
    event.preventDefault();
    void controls.previous();
  }
}

export function CompactAudioPlayer({ className = "" }: { className?: string }) {
  const player = useAudioPlayer();
  const { currentTrack, error } = player;
  if (!currentTrack) return <EmptyPlayer compact />;

  return (
    <section
      aria-label="全站音乐播放器"
      className={[
        "rounded-[1.125rem] border border-[var(--line)] bg-[var(--surface)] p-4 shadow-[var(--shadow)]",
        className,
      ].join(" ")}
      onKeyDown={(event) => keyboardHandler(event, player)}
      tabIndex={0}
    >
      <div className="flex min-w-0 items-center gap-3">
        <Backlight
          imageUrl={currentTrack.coverUrl}
        >
          <Cover
            alt={currentTrack.coverAlt || `${currentTrack.title} 封面`}
            compact
            url={currentTrack.coverUrl}
          />
        </Backlight>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{currentTrack.title}</p>
          <p className="truncate text-xs text-[var(--muted)]">
            {currentTrack.artist || "个人音乐记录"}
          </p>
        </div>
      </div>
      <Progress compact />
      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex items-center">
          <TrackButtons compact />
        </div>
        <VolumeControl compact />
      </div>
      {error ? (
        <p aria-live="polite" className="mt-3 text-xs text-[var(--danger)]">
          {error}
        </p>
      ) : null}
      <Link
        className="mt-3 inline-flex min-h-11 items-center gap-2 text-xs font-semibold text-[var(--accent)]"
        href="/music"
      >
        <ListMusic aria-hidden="true" size={15} />
        打开音乐空间
      </Link>
    </section>
  );
}

export function FullAudioPlayer({ className = "" }: { className?: string }) {
  const player = useAudioPlayer();
  const {
    currentTrack,
    cycleLoopMode,
    error,
    isPlaying,
    loopMode,
    queue,
    selectTrack,
    shuffle,
    toggleShuffle,
  } = player;
  const select = useCallback(
    (trackId: string) => {
      void selectTrack(trackId, isPlaying);
    },
    [isPlaying, selectTrack],
  );

  if (!currentTrack) return <EmptyPlayer />;
  const LoopIcon = loopMode === "one" ? Repeat1 : Repeat;
  const loopLabel =
    loopMode === "off"
      ? "循环已关闭"
      : loopMode === "all"
        ? "列表循环"
        : "单曲循环";

  return (
    <section
      aria-label="音乐播放器与播放队列"
      className={[
        "grid gap-6 rounded-[1.125rem] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[var(--shadow)] lg:grid-cols-[minmax(15rem,0.8fr)_minmax(0,1.2fr)] lg:p-7",
        className,
      ].join(" ")}
      onKeyDown={(event) => keyboardHandler(event, player)}
      tabIndex={0}
    >
      <div className="min-w-0">
        <Backlight
          imageUrl={currentTrack.coverUrl}
        >
          <Cover
            alt={currentTrack.coverAlt || `${currentTrack.title} 封面`}
            url={currentTrack.coverUrl}
          />
        </Backlight>
        <div className="mt-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--accent)]">
            Now playing
          </p>
          <h2 className="mt-2 text-[clamp(1.6rem,4vw,2.7rem)] font-semibold">
            {currentTrack.title}
          </h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            {[currentTrack.artist, currentTrack.album].filter(Boolean).join(" · ") ||
              "个人音乐记录"}
          </p>
        </div>
        <Progress />
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center">
            <TrackButtons />
          </div>
          <div className="flex items-center gap-1">
            <button
              aria-label={shuffle ? "关闭随机播放" : "开启随机播放"}
              aria-pressed={shuffle}
              className={[
                "grid size-11 place-items-center rounded-[var(--radius-control,0.625rem)]",
                shuffle ? "bg-[var(--accent-soft)] text-[var(--accent)]" : "text-[var(--muted)]",
              ].join(" ")}
              onClick={toggleShuffle}
              type="button"
            >
              <Shuffle aria-hidden="true" size={18} />
            </button>
            <button
              aria-label={`切换循环模式，当前：${loopLabel}`}
              className={[
                "grid size-11 place-items-center rounded-[var(--radius-control,0.625rem)]",
                loopMode !== "off"
                  ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                  : "text-[var(--muted)]",
              ].join(" ")}
              onClick={cycleLoopMode}
              title={loopLabel}
              type="button"
            >
              <LoopIcon aria-hidden="true" size={18} />
            </button>
          </div>
        </div>
        <div className="mt-3">
          <VolumeControl />
        </div>
        {error ? (
          <p aria-live="polite" className="mt-3 text-sm text-[var(--danger)]">
            {error}
          </p>
        ) : null}
      </div>

      <div className="min-w-0 border-t border-[var(--line)] pt-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--accent)]">
              Queue
            </p>
            <h3 className="mt-2 text-xl font-semibold">播放队列</h3>
          </div>
          <span className="text-xs text-[var(--muted)]">{queue.length} 首</span>
        </div>
        <ol className="mt-4 max-h-[31rem] space-y-1 overflow-y-auto pr-1">
          {queue.map((track, index) => {
            const active = track.id === currentTrack.id;
            return (
              <li key={track.id}>
                <button
                  aria-current={active ? "true" : undefined}
                  className={[
                    "grid min-h-14 w-full grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-3 rounded-[var(--radius-control,0.625rem)] px-3 py-2 text-left transition-colors",
                    active
                      ? "bg-[var(--accent-soft)] text-[var(--ink)]"
                      : "hover:bg-[var(--surface-strong)]",
                  ].join(" ")}
                  onClick={() => select(track.id)}
                  type="button"
                >
                  <span className="font-mono text-[10px] text-[var(--muted)]">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">
                      {track.title}
                    </span>
                    <span className="block truncate text-xs text-[var(--muted)]">
                      {track.artist || "个人音乐记录"}
                    </span>
                  </span>
                  <span className="font-mono text-[10px] text-[var(--muted)]">
                    {formatTime(track.durationSeconds || 0)}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
        {currentTrack.note ? (
          <div className="mt-6 border-l-2 border-[var(--accent)] pl-4">
            <p className="text-xs font-semibold text-[var(--accent)]">音乐随记</p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-[var(--muted)]">
              {currentTrack.note}
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
