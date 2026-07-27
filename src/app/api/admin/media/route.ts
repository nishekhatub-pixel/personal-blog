import { listMediaResponse, uploadMediaResponse } from "@/lib/media-api";

export const runtime = "nodejs";

export const GET = listMediaResponse;
export const POST = uploadMediaResponse;
