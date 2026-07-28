"use client";

import { useState } from "react";

export type GardenActionResult = {
  message: string;
  ok: boolean;
};

type GardenAction = (
  formData: FormData,
) => Promise<GardenActionResult | void>;

type GardenActionFormProps = {
  action: GardenAction;
  children: React.ReactNode;
  className?: string;
  successMessage: string;
};

export function GardenActionForm({
  action,
  children,
  className,
  successMessage,
}: GardenActionFormProps) {
  const [notice, setNotice] = useState<{
    kind: "error" | "success";
    message: string;
  } | null>(null);

  async function submit(formData: FormData) {
    setNotice(null);
    try {
      const result = await action(formData);
      if (result && !result.ok) {
        setNotice({ kind: "error", message: result.message });
        return;
      }
      setNotice({
        kind: "success",
        message: result?.message || successMessage,
      });
    } catch {
      setNotice({
        kind: "error",
        message: "操作没有完成，请检查填写内容并稍后重试。",
      });
    }
  }

  return (
    <form action={submit} className={className}>
      {children}
      {notice ? (
        <p
          aria-live={notice.kind === "error" ? "assertive" : "polite"}
          className={[
            "fixed inset-x-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-[90] border px-4 py-3 text-sm leading-6 shadow-[var(--shadow-raised)] sm:left-auto sm:right-6 sm:max-w-md",
            notice.kind === "error"
              ? "border-[color-mix(in_srgb,var(--danger)_42%,var(--line))] bg-[color-mix(in_srgb,var(--danger)_7%,transparent)] text-[var(--danger)]"
              : "border-[color-mix(in_srgb,var(--success)_42%,var(--line))] bg-[color-mix(in_srgb,var(--success)_7%,transparent)] text-[var(--success)]",
          ].join(" ")}
          role={notice.kind === "error" ? "alert" : "status"}
        >
          {notice.message}
        </p>
      ) : null}
    </form>
  );
}
