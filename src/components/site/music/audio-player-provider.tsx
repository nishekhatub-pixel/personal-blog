"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

export type AudioTrack = {
  id: string;
  title: string;
  artist: string | null;
  album: string | null;
  audioUrl: string;
  durationSeconds: number | null;
  coverUrl: string | null;
  coverAlt: string | null;
  lyrics: string | null;
  note: string | null;
};

export type AudioLoopMode = "off" | "all" | "one";

type AudioPlayerContextValue = {
  tracks: AudioTrack[];
  queue: AudioTrack[];
  currentTrack: AudioTrack | null;
  currentIndex: number;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  loopMode: AudioLoopMode;
  shuffle: boolean;
  error: string | null;
  play: () => Promise<void>;
  pause: () => void;
  toggle: () => Promise<void>;
  next: () => Promise<void>;
  previous: () => Promise<void>;
  seek: (seconds: number) => void;
  setVolume: (volume: number) => void;
  cycleLoopMode: () => void;
  toggleShuffle: () => void;
  selectTrack: (trackId: string, playImmediately?: boolean) => Promise<void>;
  setQueue: (trackIds: string[], startTrackId?: string) => void;
};

const AudioPlayerContext = createContext<AudioPlayerContextValue | null>(null);

const STORAGE = {
  currentTrack: "r7.audio.current-track",
  loopMode: "r7.audio.loop-mode",
  queue: "r7.audio.queue",
  shuffle: "r7.audio.shuffle",
  volume: "r7.audio.volume",
} as const;

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function safeStoredJson(value: string | null) {
  if (!value) return null;
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
}

function chooseShuffleIndex(length: number, currentIndex: number) {
  if (length <= 1) return currentIndex;
  const next = Math.floor(Math.random() * (length - 1));
  return next >= currentIndex ? next + 1 : next;
}

export function AudioPlayerProvider({
  children,
  tracks,
}: {
  children: React.ReactNode;
  tracks: AudioTrack[];
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [queueIds, setQueueIds] = useState(() => tracks.map((track) => track.id));
  const [currentTrackId, setCurrentTrackId] = useState(() => tracks[0]?.id ?? "");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(() => tracks[0]?.durationSeconds ?? 0);
  const [volumeState, setVolumeState] = useState(0.72);
  const [loopMode, setLoopMode] = useState<AudioLoopMode>("off");
  const [shuffle, setShuffle] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hydratedRef = useRef(false);

  const trackMap = useMemo(
    () => new Map(tracks.map((track) => [track.id, track])),
    [tracks],
  );
  const queue = useMemo(
    () =>
      queueIds
        .map((id) => trackMap.get(id))
        .filter((track): track is AudioTrack => Boolean(track)),
    [queueIds, trackMap],
  );
  const currentIndex = Math.max(
    0,
    queue.findIndex((track) => track.id === currentTrackId),
  );
  const currentTrack =
    queue.find((track) => track.id === currentTrackId) ?? queue[0] ?? null;

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const storedQueue = safeStoredJson(
        window.localStorage.getItem(STORAGE.queue),
      );
      const restoredQueue =
        Array.isArray(storedQueue)
          ? storedQueue.filter(
              (id): id is string => typeof id === "string" && trackMap.has(id),
            )
          : [];
      if (restoredQueue.length > 0) setQueueIds(restoredQueue);

      const storedTrack = window.localStorage.getItem(STORAGE.currentTrack);
      if (storedTrack && trackMap.has(storedTrack)) {
        setCurrentTrackId(storedTrack);
      }

      const storedVolume = Number(window.localStorage.getItem(STORAGE.volume));
      if (Number.isFinite(storedVolume)) {
        setVolumeState(clamp(storedVolume, 0, 1));
      }

      const storedLoop = window.localStorage.getItem(STORAGE.loopMode);
      if (
        storedLoop === "off" ||
        storedLoop === "all" ||
        storedLoop === "one"
      ) {
        setLoopMode(storedLoop);
      }
      setShuffle(window.localStorage.getItem(STORAGE.shuffle) === "true");
      hydratedRef.current = true;
    });
    return () => window.cancelAnimationFrame(frame);
  }, [trackMap]);

  useEffect(() => {
    if (!hydratedRef.current) return;
    window.localStorage.setItem(STORAGE.queue, JSON.stringify(queueIds));
  }, [queueIds]);

  useEffect(() => {
    if (!hydratedRef.current) return;
    window.localStorage.setItem(STORAGE.currentTrack, currentTrack?.id ?? "");
  }, [currentTrack?.id]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = volumeState;
    if (hydratedRef.current) {
      window.localStorage.setItem(STORAGE.volume, String(volumeState));
    }
  }, [volumeState]);

  useEffect(() => {
    if (!hydratedRef.current) return;
    window.localStorage.setItem(STORAGE.loopMode, loopMode);
  }, [loopMode]);

  useEffect(() => {
    if (!hydratedRef.current) return;
    window.localStorage.setItem(STORAGE.shuffle, String(shuffle));
  }, [shuffle]);

  const play = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;
    try {
      await audio.play();
      setIsPlaying(true);
      setError(null);
    } catch {
      setIsPlaying(false);
      setError("浏览器未能播放这段音频，请再次点击播放或检查音频地址。");
    }
  }, [currentTrack]);

  const pause = useCallback(() => {
    audioRef.current?.pause();
    setIsPlaying(false);
  }, []);

  const toggle = useCallback(async () => {
    if (audioRef.current?.paused ?? true) {
      await play();
    } else {
      pause();
    }
  }, [pause, play]);

  const seek = useCallback((seconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    const safeDuration = Number.isFinite(audio.duration) ? audio.duration : 0;
    const nextTime = clamp(
      seconds,
      0,
      safeDuration || Math.max(0, seconds),
    );
    audio.currentTime = nextTime;
    setCurrentTime(nextTime);
  }, []);

  const playIndex = useCallback(
    async (index: number, shouldPlay: boolean) => {
      const target = queue[index];
      if (!target) return;
      const audio = audioRef.current;
      setCurrentTrackId(target.id);
      setCurrentTime(0);
      setError(null);
      await new Promise<void>((resolve) => {
        window.requestAnimationFrame(() => resolve());
      });
      audio?.load();
      if (shouldPlay) await play();
    },
    [play, queue],
  );

  const next = useCallback(async () => {
    if (!queue.length) return;
    const shouldPlay = !(audioRef.current?.paused ?? true) || isPlaying;
    if (shuffle) {
      await playIndex(chooseShuffleIndex(queue.length, currentIndex), shouldPlay);
      return;
    }
    const nextIndex = currentIndex + 1;
    if (nextIndex < queue.length) {
      await playIndex(nextIndex, shouldPlay);
    } else if (loopMode === "all") {
      await playIndex(0, shouldPlay);
    } else {
      pause();
      seek(0);
    }
  }, [
    currentIndex,
    isPlaying,
    loopMode,
    pause,
    playIndex,
    queue.length,
    seek,
    shuffle,
  ]);

  const previous = useCallback(async () => {
    const audio = audioRef.current;
    if (audio && audio.currentTime > 4) {
      audio.currentTime = 0;
      setCurrentTime(0);
      return;
    }
    if (!queue.length) return;
    const shouldPlay = !(audio?.paused ?? true) || isPlaying;
    const previousIndex =
      currentIndex > 0
        ? currentIndex - 1
        : loopMode === "all"
          ? queue.length - 1
          : 0;
    await playIndex(previousIndex, shouldPlay);
  }, [currentIndex, isPlaying, loopMode, playIndex, queue.length]);

  const setVolume = useCallback((volume: number) => {
    setVolumeState(clamp(volume, 0, 1));
  }, []);

  const cycleLoopMode = useCallback(() => {
    setLoopMode((current) =>
      current === "off" ? "all" : current === "all" ? "one" : "off",
    );
  }, []);

  const toggleShuffle = useCallback(() => {
    setShuffle((current) => !current);
  }, []);

  const selectTrack = useCallback(
    async (trackId: string, playImmediately = false) => {
      const index = queue.findIndex((track) => track.id === trackId);
      if (index < 0) return;
      await playIndex(index, playImmediately);
    },
    [playIndex, queue],
  );

  const setQueue = useCallback(
    (trackIds: string[], startTrackId?: string) => {
      const unique = Array.from(
        new Set(trackIds.filter((trackId) => trackMap.has(trackId))),
      );
      const resolved = unique.length ? unique : tracks.map((track) => track.id);
      setQueueIds(resolved);
      const first =
        (startTrackId && resolved.includes(startTrackId) && startTrackId) ||
        resolved[0] ||
        "";
      setCurrentTrackId(first);
      pause();
      setCurrentTime(0);
    },
    [pause, trackMap, tracks],
  );

  const handleEnded = useCallback(async () => {
    if (loopMode === "one" && audioRef.current) {
      audioRef.current.currentTime = 0;
      await play();
      return;
    }
    await next();
  }, [loopMode, next, play]);

  const contextValue = useMemo<AudioPlayerContextValue>(
    () => ({
      tracks,
      queue,
      currentTrack,
      currentIndex,
      isPlaying,
      currentTime,
      duration,
      volume: volumeState,
      loopMode,
      shuffle,
      error,
      play,
      pause,
      toggle,
      next,
      previous,
      seek,
      setVolume,
      cycleLoopMode,
      toggleShuffle,
      selectTrack,
      setQueue,
    }),
    [
      tracks,
      queue,
      currentTrack,
      currentIndex,
      isPlaying,
      currentTime,
      duration,
      volumeState,
      loopMode,
      shuffle,
      error,
      play,
      pause,
      toggle,
      next,
      previous,
      seek,
      setVolume,
      cycleLoopMode,
      toggleShuffle,
      selectTrack,
      setQueue,
    ],
  );

  return (
    <AudioPlayerContext.Provider value={contextValue}>
      {children}
      <audio
        aria-hidden="true"
        onDurationChange={(event) => {
          const nextDuration = event.currentTarget.duration;
          if (Number.isFinite(nextDuration)) setDuration(nextDuration);
        }}
        onEnded={() => void handleEnded()}
        onError={() => {
          setIsPlaying(false);
          setError("音频暂时无法读取，请检查文件或 HTTPS 直链。");
        }}
        onPause={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
        onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
        preload="metadata"
        ref={audioRef}
        src={currentTrack?.audioUrl}
      />
    </AudioPlayerContext.Provider>
  );
}

export function useAudioPlayer() {
  const context = useContext(AudioPlayerContext);
  if (!context) {
    throw new Error("useAudioPlayer 必须在 AudioPlayerProvider 内使用。");
  }
  return context;
}
