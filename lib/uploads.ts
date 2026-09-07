import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

const ALLOWED = new Set(["jpg", "jpeg", "png", "webp", "gif"]);

export async function saveUpload(file: File) {
  const ext = (file.name.split(".").pop() ?? "jpg").toLowerCase();
  if (!ALLOWED.has(ext)) throw new Error("Use a JPG, PNG, or WebP image.");
  if (file.size > 5_000_000) throw new Error("Images must be 5MB or smaller.");
  const name = `${randomUUID()}.${ext}`;
  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), Buffer.from(await file.arrayBuffer()));
  return `/uploads/${name}`;
}
