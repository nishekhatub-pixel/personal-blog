import { NextResponse } from "next/server";
import { subscribe } from "@/lib/actions/public";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const formData = new FormData();
    for (const key of ["email", "company"]) {
      const value = payload?.[key];
      if (typeof value === "string") formData.set(key, value);
    }
    const result = await subscribe(formData);
    return NextResponse.json(result, { status: result.ok ? 201 : result.message.includes("频繁") ? 429 : 400 });
  } catch {
    return NextResponse.json({ ok: false, message: "请求内容不是有效的 JSON。" }, { status: 400 });
  }
}
