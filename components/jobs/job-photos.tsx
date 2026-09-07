import { addJobPhotoAction } from "@/app/actions/phase2";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/input";
import type { PhotoKind } from "@prisma/client";

export function JobPhotoGallery({
  photos,
  jobId,
  canUpload,
}: {
  photos: { id: string; url: string; kind: PhotoKind; caption: string | null }[];
  jobId: string;
  canUpload?: boolean;
}) {
  return (
    <Card className="p-5">
      <h2 className="font-semibold text-ink">Photo documentation</h2>
      <p className="mt-1 text-sm text-muted">Before, diagnosis, parts, and after photos stay with the job record.</p>
      {photos.length ? (
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
          {photos.map((photo) => (
            <figure key={photo.id} className="overflow-hidden rounded-xl border border-line bg-navy-soft">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo.url} alt={photo.caption ?? photo.kind} className="h-32 w-full object-cover" />
              <figcaption className="px-2 py-1.5 text-xs text-muted">
                {photo.kind.toLowerCase()}
                {photo.caption ? ` · ${photo.caption}` : ""}
              </figcaption>
            </figure>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm text-muted">No photos yet.</p>
      )}
      {canUpload ? (
        <form action={addJobPhotoAction} className="mt-4 space-y-3">
          <input type="hidden" name="jobId" value={jobId} />
          <Field label="Photo type">
            <Select name="kind" defaultValue="BEFORE">
              <option value="BEFORE">Before</option>
              <option value="DIAGNOSIS">Diagnosis</option>
              <option value="PARTS">Parts</option>
              <option value="AFTER">After</option>
              <option value="OTHER">Other</option>
            </Select>
          </Field>
          <Field label="Upload">
            <Input name="file" type="file" accept="image/*" />
          </Field>
          <Field label="Or paste a photo URL">
            <Input name="url" placeholder="https://" />
          </Field>
          <Field label="Caption">
            <Input name="caption" placeholder="Worn pad, inner side" />
          </Field>
          <Button type="submit" variant="secondary" size="sm">
            Add photo
          </Button>
        </form>
      ) : null}
    </Card>
  );
}
