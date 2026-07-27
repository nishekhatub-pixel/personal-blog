import Link from "next/link";

export function TactileButton({
  children,
  className = "",
  href,
  variant = "primary",
}: {
  children: React.ReactNode;
  className?: string;
  href: string;
  variant?: "primary" | "secondary";
}) {
  return (
    <Link
      className={`tactile-button tactile-button--${variant} ${className}`}
      href={href}
    >
      {children}
    </Link>
  );
}
