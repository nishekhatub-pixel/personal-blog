import { Save, ShieldCheck } from "lucide-react";
import { SubmitButton } from "@/components/admin/AdminControls";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { MediaAssetPicker } from "@/components/admin/MediaAssetPicker";
import { SettingsActionForm } from "@/components/admin/SettingsActionForm";
import { db } from "@/lib/db";

const inputClass =
  "min-h-11 border border-[var(--line)] bg-transparent px-3 outline-none focus:border-[var(--accent)]";
const textareaClass =
  "resize-y border border-[var(--line)] bg-transparent p-3 leading-7 outline-none focus:border-[var(--accent)]";

function SectionIntro({
  index,
  title,
  description,
  id,
}: {
  description: string;
  id: string;
  index: string;
  title: string;
}) {
  return (
    <div>
      <p className="font-mono text-[11px] text-[var(--accent)]">{index}</p>
      <h2 className="mt-2 text-lg font-semibold" id={id}>
        {title}
      </h2>
      <p className="mt-2 text-xs leading-5 text-[var(--muted)]">{description}</p>
    </div>
  );
}

function Toggle({
  defaultChecked,
  description,
  label,
  name,
}: {
  defaultChecked: boolean;
  description: string;
  label: string;
  name: string;
}) {
  return (
    <label className="flex min-h-14 items-center justify-between gap-5 border-b border-[var(--line)] py-3 text-sm last:border-b-0">
      <span>
        {label}
        <span className="mt-1 block text-xs leading-5 text-[var(--muted)]">
          {description}
        </span>
      </span>
      <input
        className="size-5 shrink-0 accent-[var(--accent)]"
        defaultChecked={defaultChecked}
        name={name}
        type="checkbox"
        value="true"
      />
    </label>
  );
}

export default async function AdminSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const [{ saved }, records, mediaOptions] = await Promise.all([
    searchParams,
    db.siteSetting.findMany({
      orderBy: [{ group: "asc" }, { key: "asc" }],
    }),
    db.media.findMany({
      orderBy: { createdAt: "desc" },
      select: { alt: true, id: true, originalName: true, url: true },
    }),
  ]);
  const settings = Object.fromEntries(records.map((item) => [item.key, item.value]));
  const field = (key: string, fallback = "") => settings[key] ?? fallback;
  const enabled = (key: string, fallback = true) =>
    field(key, String(fallback)) === "true";

  return (
    <>
      <AdminHeader
        description="统一维护公开站点身份、个人资料、环境信息和功能开关；保存后会刷新相关公开页面。"
        eyebrow="SYSTEM / SETTINGS"
        title="站点设置"
      />

      {saved === "1" ? (
        <p
          className="mb-8 border border-[color-mix(in_srgb,var(--success)_42%,var(--line))] bg-[color-mix(in_srgb,var(--success)_7%,var(--canvas))] px-4 py-3 text-sm leading-6 text-[var(--success)]"
          role="status"
        >
          站点设置已保存并开始生效。
        </p>
      ) : null}

      <SettingsActionForm className="grid gap-12">
        <section aria-labelledby="basic-heading">
          <div className="grid gap-6 lg:grid-cols-[13rem_minmax(0,1fr)]">
            <SectionIntro
              description="兼容现有元数据字段，同时维护数字花园的新名称与副标题。"
              id="basic-heading"
              index="01"
              title="基本信息"
            />
            <div className="grid gap-5 md:grid-cols-2">
              <label className="grid gap-2 text-sm">
                <span>站点标题</span>
                <input
                  className={inputClass}
                  defaultValue={field("siteTitle")}
                  maxLength={70}
                  name="siteTitle"
                  required
                />
              </label>
              <label className="grid gap-2 text-sm">
                <span>站点 URL</span>
                <input
                  className={inputClass}
                  defaultValue={field("siteUrl")}
                  name="siteUrl"
                  required
                  type="url"
                />
              </label>
              <label className="grid gap-2 text-sm md:col-span-2">
                <span>站点描述</span>
                <textarea
                  className={`${textareaClass} min-h-28`}
                  defaultValue={field("siteDescription")}
                  maxLength={180}
                  name="siteDescription"
                  required
                />
              </label>
              <label className="grid gap-2 text-sm">
                <span>花园名称</span>
                <input
                  className={inputClass}
                  defaultValue={field("siteName", field("siteTitle"))}
                  maxLength={100}
                  name="siteName"
                  required
                />
              </label>
              <label className="grid gap-2 text-sm">
                <span>上线日期</span>
                <input
                  className={inputClass}
                  defaultValue={field("siteLaunchDate")}
                  name="siteLaunchDate"
                  type="date"
                />
              </label>
              <label className="grid gap-2 text-sm md:col-span-2">
                <span>花园副标题</span>
                <input
                  className={inputClass}
                  defaultValue={field("siteSubtitle", field("siteDescription"))}
                  maxLength={180}
                  name="siteSubtitle"
                  required
                />
              </label>
              <label className="grid gap-2 text-sm md:col-span-2">
                <span>页脚短句</span>
                <input
                  className={inputClass}
                  defaultValue={field("footerNote")}
                  maxLength={160}
                  name="footerNote"
                />
              </label>
            </div>
          </div>
        </section>

        <section className="border-t border-[var(--line)] pt-8" aria-labelledby="profile-heading">
          <div className="grid gap-6 lg:grid-cols-[13rem_minmax(0,1fr)]">
            <SectionIntro
              description="旧版作者字段继续保留，新版资料用于花园首页和个人卡片。"
              id="profile-heading"
              index="02"
              title="个人资料"
            />
            <div className="grid gap-5 md:grid-cols-2">
              <label className="grid gap-2 text-sm">
                <span>作者名称</span>
                <input
                  className={inputClass}
                  defaultValue={field("authorName")}
                  maxLength={80}
                  name="authorName"
                  required
                />
              </label>
              <label className="grid gap-2 text-sm">
                <span>花园展示名称</span>
                <input
                  className={inputClass}
                  defaultValue={field("profileName", field("authorName"))}
                  maxLength={80}
                  name="profileName"
                  required
                />
              </label>
              <label className="grid gap-2 text-sm md:col-span-2">
                <span>作者简介</span>
                <textarea
                  className={`${textareaClass} min-h-28`}
                  defaultValue={field("authorBio")}
                  maxLength={800}
                  name="authorBio"
                />
              </label>
              <label className="grid gap-2 text-sm md:col-span-2">
                <span>花园个人简介</span>
                <textarea
                  className={`${textareaClass} min-h-28`}
                  defaultValue={field("profileBio", field("authorBio"))}
                  maxLength={800}
                  name="profileBio"
                />
              </label>
              <div className="min-w-0 md:col-span-2">
                <MediaAssetPicker
                  description="直接上传头像，或从博客媒体库选择。推荐使用清晰的方形图片。"
                  initialValue={field("profileAvatar")}
                  label="个人头像"
                  mediaOptions={mediaOptions}
                  name="profileAvatar"
                />
              </div>
              <label className="grid gap-2 text-sm md:col-span-2">
                <span>Now 页面内容</span>
                <textarea
                  className={`${textareaClass} min-h-40`}
                  defaultValue={field("nowText")}
                  maxLength={3000}
                  name="nowText"
                  placeholder="最近正在学习、构建和思考什么？"
                />
              </label>
            </div>
          </div>
        </section>

        <section className="border-t border-[var(--line)] pt-8" aria-labelledby="appearance-heading">
          <div className="grid gap-6 lg:grid-cols-[13rem_minmax(0,1fr)]">
            <SectionIntro
              description="控制轻量装饰与站点通知，不改变内容本身。"
              id="appearance-heading"
              index="03"
              title="外观"
            />
            <div className="grid gap-5">
              <label className="grid gap-2 text-sm">
                <span>站点通知</span>
                <textarea
                  className={`${textareaClass} min-h-24`}
                  defaultValue={field("noticeText")}
                  maxLength={300}
                  name="noticeText"
                />
              </label>
              <fieldset className="border-y border-[var(--line)]">
                <legend className="sr-only">外观开关</legend>
                <Toggle
                  defaultChecked={enabled("petalsEnabled")}
                  description="在允许动效的设备上显示低干扰花瓣效果。"
                  label="花瓣动效"
                  name="petalsEnabled"
                />
              </fieldset>
              <label className="grid gap-2 text-sm">
                <span>花瓣密度</span>
                <select
                  className={`${inputClass} bg-[var(--canvas)]`}
                  defaultValue={field("petalsDensity", "low")}
                  name="petalsDensity"
                >
                  <option value="low">低</option>
                  <option value="medium">中</option>
                  <option value="high">高</option>
                </select>
              </label>
            </div>
          </div>
        </section>

        <section className="border-t border-[var(--line)] pt-8" aria-labelledby="location-heading">
          <div className="grid gap-6 lg:grid-cols-[13rem_minmax(0,1fr)]">
            <SectionIntro
              description="位置用于天气展示；坐标为空时不应请求具体地点天气。"
              id="location-heading"
              index="04"
              title="天气和位置"
            />
            <div className="grid gap-5 md:grid-cols-2">
              <label className="grid gap-2 text-sm md:col-span-2">
                <span>位置名称</span>
                <input
                  className={inputClass}
                  defaultValue={field("locationName")}
                  maxLength={120}
                  name="locationName"
                />
              </label>
              <label className="grid gap-2 text-sm">
                <span>纬度</span>
                <input
                  className={`${inputClass} font-mono`}
                  defaultValue={field("latitude")}
                  max={90}
                  min={-90}
                  name="latitude"
                  step="any"
                  type="number"
                />
              </label>
              <label className="grid gap-2 text-sm">
                <span>经度</span>
                <input
                  className={`${inputClass} font-mono`}
                  defaultValue={field("longitude")}
                  max={180}
                  min={-180}
                  name="longitude"
                  step="any"
                  type="number"
                />
              </label>
              <label className="grid gap-2 text-sm md:col-span-2">
                <span>IANA 时区</span>
                <input
                  className={`${inputClass} font-mono`}
                  defaultValue={field("timezone", "Asia/Shanghai")}
                  name="timezone"
                  required
                />
              </label>
              <fieldset className="border-y border-[var(--line)] md:col-span-2">
                <legend className="sr-only">天气功能</legend>
                <Toggle
                  defaultChecked={enabled("weatherEnabled")}
                  description="允许公开页面根据上方配置显示天气。"
                  label="天气卡片"
                  name="weatherEnabled"
                />
              </fieldset>
              <label className="grid gap-2 text-sm md:col-span-2">
                <span>天气数据模式</span>
                <select
                  className={inputClass}
                  defaultValue={field("weatherMode", "auto")}
                  name="weatherMode"
                >
                  <option value="auto">自动 · Open-Meteo</option>
                  <option value="manual">手动 · 使用下方内容</option>
                </select>
                <span className="text-xs leading-5 text-[var(--muted)]">
                  自动模式需要城市、经纬度和时区；手动模式不会请求第三方天气服务。
                </span>
              </label>
              <label className="grid gap-2 text-sm">
                <span>手动天气状态</span>
                <select
                  className={inputClass}
                  defaultValue={field("manualWeatherCondition", "晴天")}
                  name="manualWeatherCondition"
                >
                  {[
                    "晴天",
                    "多云",
                    "阴天",
                    "小雨",
                    "大雨",
                    "雷雨",
                    "有雪",
                    "有雾",
                  ].map((condition) => (
                    <option key={condition} value={condition}>
                      {condition}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2 text-sm">
                <span>手动温度（°C）</span>
                <input
                  className={`${inputClass} font-mono`}
                  defaultValue={field("manualWeatherTemperature")}
                  max={100}
                  min={-100}
                  name="manualWeatherTemperature"
                  step="0.1"
                  type="number"
                />
              </label>
              <label className="grid gap-2 text-sm md:col-span-2">
                <span>手动天气描述</span>
                <textarea
                  className={textareaClass}
                  defaultValue={field("manualWeatherDescription")}
                  maxLength={240}
                  name="manualWeatherDescription"
                  placeholder="例如：午后有短时小雨，晚些时候转凉。"
                  rows={3}
                />
              </label>
            </div>
          </div>
        </section>

        <section className="border-t border-[var(--line)] pt-8" aria-labelledby="music-heading">
          <div className="grid gap-6 lg:grid-cols-[13rem_minmax(0,1fr)]">
            <SectionIntro
              description="曲目内容在音乐管理中维护，此处只决定是否开放公开入口。"
              id="music-heading"
              index="05"
              title="音乐"
            />
            <fieldset className="border-y border-[var(--line)]">
              <legend className="sr-only">音乐功能</legend>
              <Toggle
                defaultChecked={enabled("musicEnabled")}
                description="在公开站点展示已发布曲目和歌单。"
                label="音乐花园"
                name="musicEnabled"
              />
            </fieldset>
          </div>
        </section>

        <section className="border-t border-[var(--line)] pt-8" aria-labelledby="interaction-heading">
          <div className="grid gap-6 lg:grid-cols-[13rem_minmax(0,1fr)]">
            <SectionIntro
              description="提交内容仍会经过校验和审核；关闭入口不会删除已有数据。"
              id="interaction-heading"
              index="06"
              title="互动功能"
            />
            <fieldset className="border-y border-[var(--line)]">
              <legend className="sr-only">互动功能开关</legend>
              <Toggle
                defaultChecked={enabled("commentsEnabled")}
                description="文章新评论仍需审核后显示。"
                label="文章评论"
                name="commentsEnabled"
              />
              <Toggle
                defaultChecked={enabled("newsletterEnabled")}
                description="开放订阅地址提交，不自动发送邮件。"
                label="邮件订阅"
                name="newsletterEnabled"
              />
              <Toggle
                defaultChecked={enabled("guestbookEnabled")}
                description="开放留言墙提交入口，留言默认进入待审核。"
                label="留言墙"
                name="guestbookEnabled"
              />
              <Toggle
                defaultChecked={enabled("friendsEnabled")}
                description="展示已发布友链，并允许访问友链页面。"
                label="友链"
                name="friendsEnabled"
              />
            </fieldset>
          </div>
        </section>

        <section className="border-t border-[var(--line)] pt-8" aria-labelledby="social-heading">
          <div className="grid gap-6 lg:grid-cols-[13rem_minmax(0,1fr)]">
            <SectionIntro
              description="公开社交资料与管理联系邮箱分开维护。"
              id="social-heading"
              index="07"
              title="社交链接"
            />
            <div className="grid gap-5">
              <label className="grid gap-2 text-sm">
                <span>GitHub URL</span>
                <input
                  className={`${inputClass} font-mono text-sm`}
                  defaultValue={field("githubUrl")}
                  name="githubUrl"
                  placeholder="https://github.com/..."
                  type="url"
                />
              </label>
              <label className="grid gap-2 text-sm">
                <span>公开邮箱</span>
                <input
                  className={inputClass}
                  defaultValue={field("email")}
                  name="email"
                  type="email"
                />
              </label>
              <label className="grid gap-2 text-sm">
                <span>联系邮箱（兼容旧字段）</span>
                <input
                  className={inputClass}
                  defaultValue={field("contactEmail")}
                  name="contactEmail"
                  type="email"
                />
              </label>
            </div>
          </div>
        </section>

        <div className="sticky bottom-20 z-20 flex flex-col gap-3 border border-[var(--line)] bg-[color-mix(in_srgb,var(--canvas)_94%,transparent)] p-4 backdrop-blur-md sm:flex-row sm:items-center sm:justify-between lg:bottom-4">
          <p className="flex items-center gap-2 text-xs text-[var(--muted)]">
            <ShieldCheck aria-hidden="true" className="text-[var(--accent)]" size={15} />
            保存前会校验 URL、邮箱、坐标、时区和内容长度。
          </p>
          <SubmitButton pendingLabel="正在保存设置…">
            <span className="inline-flex items-center gap-2">
              <Save aria-hidden="true" size={16} />
              保存设置
            </span>
          </SubmitButton>
        </div>
      </SettingsActionForm>
    </>
  );
}
