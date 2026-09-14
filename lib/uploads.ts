import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { nanoid } from "nanoid";

const IMAGE_TYPES = new Map([
  ["image/jpeg", "jpg"],
  ["image/jpg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/gif", "gif"],
]);

const MAX_BYTES = 8 * 1024 * 1024;

export async function savePublicUpload(file: File, folder: string, options?: { pdf?: boolean }) {
  const type = file.type.toLowerCase();
  const allowed = new Map(IMAGE_TYPES);
  if (options?.pdf) allowed.set("application/pdf", "pdf");
  const ext = allowed.get(type);
  if (!ext) throw new Error(options?.pdf ? "Use a photo or PDF." : "Use a JPG, PNG, WebP, or GIF photo.");
  if (file.size <= 0) throw new Error("That file is empty.");
  if (file.size > MAX_BYTES) throw new Error("Files must be under 8 MB.");
  const dir = path.join(process.cwd(), "public", "uploads", folder);
  await mkdir(dir, { recursive: true });
  const name = `${nanoid(12)}.${ext}`;
  await writeFile(path.join(dir, name), Buffer.from(await file.arrayBuffer()));
  return `/uploads/${folder}/${name}`;
}
