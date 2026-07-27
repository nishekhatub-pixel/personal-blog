import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "R7 数字花园",
    short_name: "R7",
    description: "记录学习、项目、音乐、照片与生活的温暖型个人数字花园。",
    start_url: "/",
    display: "standalone",
    background_color: "#f8f1e5",
    theme_color: "#a84f00",
    lang: "zh-CN",
    icons: [
      {
        src: "/icon",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
