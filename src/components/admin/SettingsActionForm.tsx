"use client";

import { useActionState } from "react";
import {
  updateSettings,
  type SettingsActionState,
} from "@/actions/admin";

type SettingsActionFormProps = {
  children: React.ReactNode;
  className?: string;
};

export function SettingsActionForm({
  children,
  className,
}: SettingsActionFormProps) {
  const [notice, submit] = useActionState<SettingsActionState, FormData>(
    updateSettings,
    null,
  );

  return (
    <form action={submit} className={className}>
      {children}
      {notice ? (
        <p
          aria-live={notice.ok ? "polite" : "assertive"}
          className={[
            "fixed inset-x-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-[90] border px-4 py-3 text-sm leading-6 shadow-[var(--shadow-raised)] sm:left-auto sm:right-6 sm:max-w-md",
            notice.ok
              ? "border-[color-mix(in_srgb,var(--success)_42%,var(--line))] bg-[color-mix(in_srgb,var(--success)_7%,var(--canvas))] text-[var(--success)]"
              : "border-[color-mix(in_srgb,var(--danger)_42%,var(--line))] bg-[color-mix(in_srgb,var(--danger)_7%,var(--canvas))] text-[var(--danger)]",
          ].join(" ")}
          role={notice.ok ? "status" : "alert"}
        >
          {notice.message}
        </p>
      ) : null}
    </form>
  );
}
