import { NextResponse } from "next/server";
import { searchContent } from "@/lib/data";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = (searchParams.get("q") ?? "").trim();
  if (query.length < 2) {
    return NextResponse.json({ query, posts: [], projects: [], total: 0 });
  }
  return NextResponse.json(await searchContent(query, 30));
}
