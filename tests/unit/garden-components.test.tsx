import type { AnchorHTMLAttributes, ReactNode } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const navigationMocks = vi.hoisted(() => ({
  pathname: "/",
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
    children: ReactNode;
    href: string | { pathname?: string };
  }) => (
    <a
      href={typeof href === "string" ? href : (href.pathname ?? "")}
      {...props}
    >
      {children}
    </a>
  ),
}));

vi.mock("next/image", () => ({
  default: ({ alt }: { alt: string }) => (
    <span aria-label={alt} role="img" />
  ),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => navigationMocks.pathname,
}));

import { AtmosphereProvider } from "@/components/site/atmosphere/atmosphere-provider";
import { AtmosphereToggle } from "@/components/site/atmosphere/atmosphere-toggle";
import { PetalField } from "@/components/site/atmosphere/petal-field";
import { ContentCalendar } from "@/components/site/home/content-calendar";
import { TimezoneClock } from "@/components/site/home/timezone-clock";
import {
  CompactAudioPlayer,
  FullAudioPlayer,
} from "@/components/site/music/audio-player";
import {
  AudioPlayerProvider,
  type AudioTrack,
} from "@/components/site/music/audio-player-provider";
import { MobileDock } from "@/components/site/navigation/mobile-dock";

const originalMatchMedia = window.matchMedia;

function mediaQueryList(query: string, matches: boolean): MediaQueryList {
  return {
    matches,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(() => false),
  };
}

describe("time and calendar widgets", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("formats the isolated clock with the configured IANA time zone", () => {
    render(
      <TimezoneClock
        initialIso="2026-01-01T00:00:00.000Z"
        timeZone="America/New_York"
      />,
    );

    expect(
      screen.getByLabelText("America/New_York 当前时间"),
    ).toBeInTheDocument();
    expect(screen.getByText("19:00:00")).toBeInTheDocument();
  });

  it("loads and displays the next calendar month", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ markers: [], month: 8, year: 2026 }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(
      <ContentCalendar
        initialMarkers={[]}
        initialMonth={7}
        initialYear={2026}
        todayKey="2026-07-15"
      />,
    );

    expect(screen.getByText("2026年7月")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "下一个月" }));

    await waitFor(() =>
      expect(screen.getByText("2026年8月")).toBeInTheDocument(),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/calendar?year=2026&month=8",
      expect.objectContaining({ cache: "no-store" }),
    );
  });
});

describe("global audio player", () => {
  const track: AudioTrack = {
    id: "test-track",
    title: "测试音频",
    artist: "R7 测试",
    album: null,
    audioUrl: "https://media.example.test/test.mp3",
    durationSeconds: 90,
    coverUrl: null,
    coverAlt: null,
    lyrics: null,
    note: null,
  };

  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("never autoplays and exposes a working user-initiated play button", async () => {
    const play = vi
      .spyOn(HTMLMediaElement.prototype, "play")
      .mockResolvedValue(undefined);
    vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
    vi.spyOn(HTMLMediaElement.prototype, "load").mockImplementation(() => {});

    const { container } = render(
      <AudioPlayerProvider tracks={[track]}>
        <CompactAudioPlayer />
      </AudioPlayerProvider>,
    );

    const audio = container.querySelector("audio");
    expect(audio).not.toHaveAttribute("autoplay");
    expect(play).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "播放音乐" }));
    await waitFor(() => expect(play).toHaveBeenCalledOnce());
  });

  it("follows LRC timestamps and marks the current lyric line", async () => {
    const timedTrack: AudioTrack = {
      ...track,
      lyrics: "[00:00.00]第一行歌词\n[00:05.00]第二行歌词",
    };
    const scrollTo = vi.fn();
    Object.defineProperty(HTMLElement.prototype, "scrollTo", {
      configurable: true,
      value: scrollTo,
    });
    const { container } = render(
      <AudioPlayerProvider tracks={[timedTrack]}>
        <FullAudioPlayer />
      </AudioPlayerProvider>,
    );
    const audio = container.querySelector("audio");
    expect(audio).not.toBeNull();
    Object.defineProperty(audio, "currentTime", {
      configurable: true,
      value: 6,
    });
    fireEvent.timeUpdate(audio!);

    await waitFor(() =>
      expect(screen.getByText("第二行歌词")).toHaveAttribute(
        "aria-current",
        "true",
      ),
    );
    expect(screen.getByText("第一行歌词")).not.toHaveAttribute("aria-current");
    delete (HTMLElement.prototype as { scrollTo?: unknown }).scrollTo;
  });
});

describe("atmosphere and mobile navigation", () => {
  beforeEach(() => {
    window.localStorage.clear();
    navigationMocks.pathname = "/";
  });

  afterEach(() => {
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: originalMatchMedia,
    });
  });

  it("does not render petals when reduced motion is requested", async () => {
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: (query: string) =>
        mediaQueryList(
          query,
          query === "(prefers-reduced-motion: reduce)",
        ),
    });

    const { container } = render(
      <AtmosphereProvider adminEnabled density="high">
        <AtmosphereToggle />
        <PetalField seed="reduced-motion-test" />
      </AtmosphereProvider>,
    );

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "关闭花瓣效果" }),
      ).toBeEnabled(),
    );
    expect(container.querySelector(".petal-field")).toBeNull();
  });

  it("uses only real routes in the five-entry mobile Dock", () => {
    render(<MobileDock />);

    const dock = screen.getByRole("navigation", { name: "移动端快捷导航" });
    const links = Array.from(dock.querySelectorAll("a"));
    expect(links).toHaveLength(5);
    expect(links.map((link) => link.getAttribute("href"))).toEqual([
      "/",
      "/blog",
      "/photos",
      "/moments",
      "/music",
    ]);
    expect(links.every((link) => link.getAttribute("href") !== "#")).toBe(true);
  });
});
