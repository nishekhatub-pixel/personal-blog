import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const siteUrl = process.env.APP_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "R7｜在代码与生活之间，持续生长",
    template: "%s｜R7",
  },
  description:
    "R7 的中文个人博客，记录软件技术学习、Java、前端、MySQL、数据结构、项目实践与生活。",
  applicationName: "R7 数字花园",
  authors: [{ name: "R7", url: "/about" }],
  creator: "R7",
  publisher: "R7",
  keywords: [
    "R7",
    "数字花园",
    "软件技术",
    "Java",
    "JavaScript",
    "MySQL",
    "数据结构",
    "前端开发",
    "项目作品集",
    "学习档案",
    "音乐日记",
    "照片墙",
    "个人博客",
  ],
  alternates: {
    canonical: "/",
    types: {
      "application/rss+xml": "/rss.xml",
    },
  },
  openGraph: {
    type: "website",
    locale: "zh_CN",
    url: "/",
    siteName: "R7 数字花园",
    title: "R7｜在代码与生活之间，持续生长",
    description: "记录学习、项目与生活，持续更新中的学生开发者数字花园。",
  },
  twitter: {
    card: "summary_large_image",
    title: "R7｜在代码与生活之间，持续生长",
    description: "记录学习、项目与生活，持续更新中的学生开发者数字花园。",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8f1e5" },
    { media: "(prefers-color-scheme: dark)", color: "#1d1915" },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body>
        <a className="skip-link" href="#main-content">
          跳到主要内容
        </a>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
