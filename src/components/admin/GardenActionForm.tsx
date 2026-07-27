"use client";

import { useState } from "react";

type GardenAction = (formData: FormData) => Promise<void>;

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
  const [message, setMessage] = useState("");

  async function submit(formData: FormData) {
    setMessage("");
    await action(formData);
    setMessage(successMessage);
  }

  return (
    <form action={submit} className={className}>
      {children}
      <p aria-live="polite" className="sr-only">
        {message}
      </p>
    </form>
  );
}
