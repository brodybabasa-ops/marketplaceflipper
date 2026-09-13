import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { nanoid } from "nanoid";

const ALLOWED = new Map([
  ["image/jpeg", "jpg"],
  ["image/jpg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/gif", "gif"],
]);

const MAX_BYTES = 8 * 1024 * 1024;

export async function savePublicUpload(file: File, folder: string) {
  const type = file.type.toLowerCase();
  const ext = ALLOWED.get(type);
  if (!ext) throw new Error("Use a JPG, PNG, WebP, or GIF photo.");
  if (file.size <= 0) throw new Error("That photo is empty.");
  if (file.size > MAX_BYTES) throw new Error("Photos must be under 8 MB.");
  const dir = path.join(process.cwd(), "public", "uploads", folder);
  await mkdir(dir, { recursive: true });
  const name = `${nanoid(12)}.${ext}`;
  await writeFile(path.join(dir, name), Buffer.from(await file.arrayBuffer()));
  return `/uploads/${folder}/${name}`;
}
