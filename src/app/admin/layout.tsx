import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "R7 编辑室",
    template: "%s · R7 编辑室",
  },
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function AdminRootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
