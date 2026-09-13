import { uploadJobPhotoAction } from "@/app/actions/marketplace";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/input";
import type { PhotoKind } from "@prisma/client";

const KINDS: { value: PhotoKind; label: string }[] = [
  { value: "BEFORE", label: "Before" },
  { value: "AFTER", label: "After" },
  { value: "DIAGNOSIS", label: "Diagnosis" },
  { value: "PARTS", label: "Parts" },
  { value: "OTHER", label: "Other" },
];

export function JobPhotos({
  jobId,
  photos,
  canUpload,
  surface = "customer",
}: {
  jobId: string;
  photos: { id: string; url: string; kind: PhotoKind; caption: string | null }[];
  canUpload: boolean;
  surface?: "customer" | "shop";
}) {
  return (
    <Card className={surface === "shop" ? "border-0 p-5" : "border-0 bg-[#f7f9fc] p-5 shadow-none"}>
      <h2 className="font-semibold text-navy">Photos</h2>
      {photos.length === 0 ? (
        <p className="mt-2 text-sm text-muted">No photos on this job yet.</p>
      ) : (
        <div className="mt-3 grid grid-cols-2 gap-3">
          {photos.map((photo) => (
            <figure key={photo.id} className="overflow-hidden rounded-xl bg-paper">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo.url} alt={photo.caption ?? photo.kind} className="h-32 w-full object-cover" />
              <figcaption className="px-2 py-1.5 text-[11px] text-muted">
                {KINDS.find((item) => item.value === photo.kind)?.label ?? photo.kind}
                {photo.caption ? ` · ${photo.caption}` : ""}
              </figcaption>
            </figure>
          ))}
        </div>
      )}
      {canUpload ? (
        <form action={uploadJobPhotoAction} encType="multipart/form-data" className="mt-4 space-y-3">
          <input type="hidden" name="jobId" value={jobId} />
          <Field label="Add a photo">
            <Input name="photo" type="file" accept="image/jpeg,image/png,image/webp,image/gif" required />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Kind">
              <Select name="kind" defaultValue="OTHER">
                {KINDS.map((kind) => (
                  <option key={kind.value} value={kind.value}>
                    {kind.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Caption (optional)">
              <Input name="caption" placeholder="Front rotor" />
            </Field>
          </div>
          <Button type="submit" name="uploadPhoto">Upload photo</Button>
        </form>
      ) : null}
    </Card>
  );
}
