import {
  Disc3,
  Heart,
  ListMusic,
  LockKeyhole,
  Music2,
  NotebookText,
  Star,
} from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import { FullAudioPlayer } from "@/components/site/music/audio-player";
import { PlaylistQueueButton } from "@/components/site/music/playlist-queue-button";
import { getSiteSettings } from "@/lib/data";
import {
  getPublishedMusicTracks,
  getPublishedPlaylists,
} from "@/lib/garden-data";

export const metadata: Metadata = {
  title: "音乐",
  description: "R7 的真实音乐播放队列、歌单与曲目随记。",
  alternates: { canonical: "/music" },
};
export const dynamic = "force-dynamic";

function enabled(value: string | undefined) {
  return value?.trim().toLocaleLowerCase("en-US") !== "false";
}

function formatDuration(value: number | null) {
  if (!value || value < 1) return null;
  const minutes = Math.floor(value / 60);
  const seconds = value % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export default async function MusicPage() {
  const [settings, tracks, playlists] = await Promise.all([
    getSiteSettings(),
    getPublishedMusicTracks({ pageSize: 50 }),
    getPublishedPlaylists({ pageSize: 24 }),
  ]);
  const musicEnabled = enabled(settings.musicEnabled);
  const diaryTracks = tracks.items.filter(
    (track) => track.note?.trim() || track.lyrics?.trim(),
  );

  return (
    <main id="main-content">
      <header className="px-[var(--page-gutter)] pb-12 pt-[clamp(3.5rem,8vw,7rem)]">
        <div className="mx-auto max-w-[var(--content-max)]">
          <p className="mb-4 text-sm font-semibold text-[var(--accent)]">
            Music diary
          </p>
          <h1 className="max-w-4xl text-[clamp(3rem,7vw,6rem)] font-black leading-[.92] tracking-[-.07em]">
            音乐
          </h1>
          <div className="mt-6 flex flex-wrap items-end justify-between gap-5">
            <p className="max-w-[58ch] text-lg leading-8 text-[var(--muted)]">
              这里保存真实曲目、播放清单与听歌时写下的只言片语。播放只会在你主动操作后开始。
            </p>
            <p className="font-mono text-sm text-[var(--muted)]">
              {tracks.total} 首公开曲目
            </p>
          </div>
        </div>
      </header>

      <div className="px-[var(--page-gutter)] pb-[clamp(5rem,10vw,9rem)]">
        <div className="mx-auto max-w-[var(--content-max)]">
          {!musicEnabled ? (
            <section className="grid min-h-[28rem] place-items-center rounded-[var(--radius-panel,1.125rem)] border border-[var(--line)] bg-[var(--surface)] px-6 text-center shadow-[var(--shadow)]">
              <div className="max-w-lg">
                <LockKeyhole
                  aria-hidden
                  className="mx-auto text-[var(--accent)]"
                  size={36}
                  strokeWidth={1.4}
                />
                <h2 className="mt-6 text-[clamp(2rem,4vw,3rem)] font-semibold tracking-[-.05em]">
                  音乐空间暂时关闭
                </h2>
                <p className="mt-4 leading-8 text-[var(--muted)]">
                  播放功能已停用。重新开放后，真实曲目和歌单会在这里恢复。
                </p>
              </div>
            </section>
          ) : tracks.items.length || playlists.items.length ? (
            <>
              {tracks.items.length ? (
                <section aria-labelledby="music-player-heading">
                  <h2 id="music-player-heading" className="sr-only">
                    音乐播放器
                  </h2>
                  <FullAudioPlayer />
                </section>
              ) : (
                <section className="rounded-[var(--radius-panel,1.125rem)] border border-dashed border-[var(--line)] bg-[var(--surface)] p-7">
                  <Music2
                    aria-hidden
                    className="text-[var(--accent)]"
                    size={28}
                    strokeWidth={1.5}
                  />
                  <h2 className="mt-5 text-2xl font-semibold">暂时没有可播放曲目</h2>
                  <p className="mt-2 leading-7 text-[var(--muted)]">
                    已发布歌单仍会如实列出，但播放器只接收真实公开音频。
                  </p>
                </section>
              )}

              <section
                aria-labelledby="playlist-heading"
                className="mt-[clamp(4rem,8vw,7rem)]"
              >
                <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--line)] pb-5">
                  <div>
                    <p className="text-sm font-semibold text-[var(--accent)]">
                      Playlists
                    </p>
                    <h2
                      id="playlist-heading"
                      className="mt-2 text-[clamp(2rem,4vw,3.6rem)] font-semibold tracking-[-.055em]"
                    >
                      播放清单
                    </h2>
                  </div>
                  <p className="font-mono text-sm text-[var(--muted)]">
                    {playlists.total} 份
                  </p>
                </div>

                {playlists.items.length ? (
                  <div className="mt-7 grid gap-5 lg:grid-cols-2">
                    {playlists.items.map((playlist) => (
                      <article
                        key={playlist.id}
                        className="grid min-w-0 gap-5 rounded-[var(--radius-panel,1.125rem)] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[var(--shadow)] sm:grid-cols-[9rem_minmax(0,1fr)]"
                      >
                        <div className="relative aspect-square overflow-hidden rounded-[var(--radius-media,.75rem)] bg-[var(--surface-strong)]">
                          {playlist.coverMedia ? (
                            <Image
                              src={playlist.coverMedia.url}
                              alt={playlist.coverMedia.alt || `${playlist.title} 封面`}
                              fill
                              sizes="144px"
                              className="object-cover"
                            />
                          ) : (
                            <div
                              role="img"
                              aria-label={`${playlist.title} 的唱片图形`}
                              className="grid size-full place-items-center bg-[radial-gradient(circle,var(--surface)_0_8%,var(--accent)_9%_13%,var(--ink)_14%_42%,var(--surface-strong)_43%)]"
                            >
                              <Disc3
                                aria-hidden
                                className="text-[var(--accent)]"
                                size={30}
                              />
                            </div>
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-2xl font-semibold tracking-[-.04em]">
                              {playlist.title}
                            </h3>
                            {playlist.featured ? (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--accent)]">
                                <Star aria-hidden size={14} />
                                精选
                              </span>
                            ) : null}
                          </div>
                          {playlist.description ? (
                            <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-[var(--muted)]">
                              {playlist.description}
                            </p>
                          ) : null}

                          {playlist.tracks.length ? (
                            <ol className="my-4 space-y-2 border-y border-[var(--line)] py-3">
                              {playlist.tracks.map(({ track }, index) => (
                                <li
                                  key={track.id}
                                  className="grid grid-cols-[1.75rem_minmax(0,1fr)_auto] items-baseline gap-2 text-sm"
                                >
                                  <span className="font-mono text-[10px] text-[var(--muted)]">
                                    {String(index + 1).padStart(2, "0")}
                                  </span>
                                  <span className="min-w-0 truncate font-medium">
                                    {track.title}
                                  </span>
                                  <span className="font-mono text-[10px] text-[var(--muted)]">
                                    {formatDuration(track.durationSeconds) ?? ""}
                                  </span>
                                </li>
                              ))}
                            </ol>
                          ) : (
                            <p className="my-4 border-y border-[var(--line)] py-3 text-sm text-[var(--muted)]">
                              这份歌单暂时没有公开曲目。
                            </p>
                          )}

                          <PlaylistQueueButton
                            title={playlist.title}
                            trackIds={playlist.tracks.map(({ track }) => track.id)}
                          />
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="mt-7 rounded-[var(--radius-panel,1.125rem)] border border-dashed border-[var(--line)] p-7 text-[var(--muted)]">
                    <ListMusic aria-hidden size={27} strokeWidth={1.5} />
                    <h3 className="mt-4 text-xl font-semibold text-[var(--ink)]">
                      还没有公开歌单
                    </h3>
                    <p className="mt-2 leading-7">
                      当前播放器会直接使用全部公开曲目作为队列。
                    </p>
                  </div>
                )}
              </section>

              {diaryTracks.length ? (
                <section
                  aria-labelledby="music-notes-heading"
                  className="mt-[clamp(4rem,8vw,7rem)]"
                >
                  <div className="border-b border-[var(--line)] pb-5">
                    <p className="text-sm font-semibold text-[var(--accent)]">
                      Notes & lyrics
                    </p>
                    <h2
                      id="music-notes-heading"
                      className="mt-2 text-[clamp(2rem,4vw,3.6rem)] font-semibold tracking-[-.055em]"
                    >
                      曲目手记
                    </h2>
                  </div>

                  <div className="mt-7 divide-y divide-[var(--line)] border-y border-[var(--line)]">
                    {diaryTracks.map((track) => (
                      <article
                        key={track.id}
                        className="grid gap-5 py-7 md:grid-cols-[minmax(12rem,.55fr)_minmax(0,1.45fr)]"
                      >
                        <header>
                          <div className="flex flex-wrap gap-2">
                            {track.featured ? (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--accent)]">
                                <Star aria-hidden size={13} />
                                精选
                              </span>
                            ) : null}
                            {track.favorite ? (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--accent)]">
                                <Heart aria-hidden size={13} />
                                喜欢
                              </span>
                            ) : null}
                          </div>
                          <h3 className="mt-2 text-2xl font-semibold tracking-[-.04em]">
                            {track.title}
                          </h3>
                          <p className="mt-2 text-sm text-[var(--muted)]">
                            {[track.artist, track.album]
                              .filter(Boolean)
                              .join(" / ") || "未填写艺人与专辑"}
                          </p>
                        </header>

                        <div className="min-w-0 space-y-3">
                          {track.note ? (
                            <div className="border-l-2 border-[var(--accent)] pl-4">
                              <p className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--accent)]">
                                <NotebookText aria-hidden size={14} />
                                随记
                              </p>
                              <p className="mt-2 whitespace-pre-wrap break-words leading-8 text-[var(--muted)]">
                                {track.note}
                              </p>
                            </div>
                          ) : null}

                          {track.lyrics ? (
                            <details>
                              <summary className="inline-flex min-h-11 cursor-pointer list-none items-center font-semibold text-[var(--accent)] [&::-webkit-details-marker]:hidden">
                                阅读歌词
                              </summary>
                              <p className="max-h-96 overflow-y-auto whitespace-pre-wrap break-words rounded-[var(--radius-control,.625rem)] bg-[var(--surface-strong)] p-5 font-mono text-sm leading-7 text-[var(--muted)]">
                                {track.lyrics}
                              </p>
                            </details>
                          ) : null}
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              ) : null}
            </>
          ) : (
            <section className="grid min-h-[30rem] place-items-center rounded-[var(--radius-panel,1.125rem)] border border-[var(--line)] bg-[var(--surface)] px-6 text-center shadow-[var(--shadow)]">
              <div className="max-w-lg">
                <Music2
                  aria-hidden
                  className="mx-auto text-[var(--accent)]"
                  size={38}
                  strokeWidth={1.35}
                />
                <h2 className="mt-6 text-[clamp(2rem,4vw,3rem)] font-semibold tracking-[-.05em]">
                  音乐日记还没有内容
                </h2>
                <p className="mt-4 leading-8 text-[var(--muted)]">
                  这里不会用试听样例或虚构歌单填充。第一首真实曲目发布后，播放器会在这里出现。
                </p>
              </div>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}
