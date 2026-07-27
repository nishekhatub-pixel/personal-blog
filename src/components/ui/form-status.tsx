import { AlertCircle, CheckCircle2, LoaderCircle } from "lucide-react";

type Status = "idle" | "loading" | "success" | "error";

export function FormStatus({
  status,
  message,
}: {
  status: Status;
  message?: string;
}) {
  if (status === "idle" || !message) return null;
  const Icon =
    status === "success"
      ? CheckCircle2
      : status === "loading"
        ? LoaderCircle
        : AlertCircle;

  return (
    <p className={`form-status form-status--${status}`} role={status === "error" ? "alert" : "status"}>
      <Icon
        aria-hidden="true"
        className={status === "loading" ? "spin" : undefined}
        size={17}
      />
      {message}
    </p>
  );
}
