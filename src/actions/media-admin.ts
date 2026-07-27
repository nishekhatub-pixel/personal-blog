"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { deleteMediaAndFiles } from "@/lib/media-storage";
import { assertSameOrigin } from "@/lib/security";
import { identifierSchema, stringValue } from "@/lib/validation";

export async function deleteMedia(formData: FormData) {
  await assertSameOrigin();
  await requireAdmin();
  const id = identifierSchema.parse(stringValue(formData, "id"));
  await deleteMediaAndFiles(id);
  revalidatePath("/admin/media");
}
