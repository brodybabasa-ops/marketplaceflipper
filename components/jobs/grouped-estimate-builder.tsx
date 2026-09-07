"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createGroupedEstimateAction } from "@/app/actions/master";

type Line = { description: string; kind: "LABOR" | "PARTS" | "SHOP_SUPPLIES" | "OTHER"; quantity: number; unitPrice: string };

type GroupDraft = { title: string; recommended: boolean; lines: Line[] };

const emptyLine = (): Line => ({ description: "", kind: "PARTS", quantity: 1, unitPrice: "" });

export function GroupedEstimateBuilder({
  jobId,
  defaultType = "PRIMARY",
  lockedSupplemental = false,
}: {
  jobId: string;
  defaultType?: "PRIMARY" | "CHANGE_ORDER";
  lockedSupplemental?: boolean;
}) {
  const [groups, setGroups] = useState<GroupDraft[]>([{ title: "", recommended: true, lines: [emptyLine()] }]);

  function addGroup() {
    setGroups((g) => [...g, { title: "", recommended: true, lines: [emptyLine()] }]);
  }

  return (
    <form
      action={createGroupedEstimateAction}
      className="space-y-4"
    >
      <input type="hidden" name="jobId" value={jobId} />
      <input type="hidden" name="groups" value={JSON.stringify(groups)} />
      {lockedSupplemental ? (
        <input type="hidden" name="type" value="CHANGE_ORDER" />
      ) : (
        <select name="type" defaultValue={defaultType} className="h-11 rounded-xl border border-white/10 bg-navy-soft px-3 text-sm text-ink">
          <option value="PRIMARY">Estimate</option>
          <option value="CHANGE_ORDER">Supplemental estimate</option>
        </select>
      )}
      {lockedSupplemental ? (
        <p className="text-sm text-muted">This job already has an authorization. Additional work is sent as Supplemental Estimate / Version 2 and does not rewrite the original.</p>
      ) : null}
      {groups.map((group, gi) => (
        <div key={gi} className="rounded-2xl border border-white/10 bg-navy p-4">
          <div className="mb-3 flex items-center gap-3">
            <Input
              value={group.title}
              onChange={(e) =>
                setGroups((rows) => rows.map((r, i) => (i === gi ? { ...r, title: e.target.value } : r)))
              }
              placeholder="Repair group name"
            />
            <label className="flex items-center gap-2 text-xs text-muted">
              <input
                type="checkbox"
                checked={group.recommended}
                onChange={(e) =>
                  setGroups((rows) => rows.map((r, i) => (i === gi ? { ...r, recommended: e.target.checked } : r)))
                }
              />
              Recommended
            </label>
          </div>
          {group.lines.map((line, li) => (
            <div key={li} className="mb-2 grid gap-2 md:grid-cols-4">
              <Input
                value={line.description}
                onChange={(e) =>
                  setGroups((rows) =>
                    rows.map((r, i) =>
                      i === gi ? { ...r, lines: r.lines.map((l, j) => (j === li ? { ...l, description: e.target.value } : l)) } : r
                    )
                  )
                }
                placeholder="Line item"
              />
              <select
                className="h-11 rounded-xl border border-white/10 bg-navy-soft px-3 text-sm text-ink"
                value={line.kind}
                onChange={(e) =>
                  setGroups((rows) =>
                    rows.map((r, i) =>
                      i === gi
                        ? { ...r, lines: r.lines.map((l, j) => (j === li ? { ...l, kind: e.target.value as Line["kind"] } : l)) }
                        : r
                    )
                  )
                }
              >
                <option value="PARTS">Parts</option>
                <option value="LABOR">Labor</option>
                <option value="SHOP_SUPPLIES">Shop supplies</option>
                <option value="OTHER">Other</option>
              </select>
              <Input
                type="number"
                step="0.1"
                value={line.quantity}
                onChange={(e) =>
                  setGroups((rows) =>
                    rows.map((r, i) =>
                      i === gi
                        ? { ...r, lines: r.lines.map((l, j) => (j === li ? { ...l, quantity: Number(e.target.value) } : l)) }
                        : r
                    )
                  )
                }
              />
              <Input
                value={line.unitPrice}
                onChange={(e) =>
                  setGroups((rows) =>
                    rows.map((r, i) =>
                      i === gi
                        ? { ...r, lines: r.lines.map((l, j) => (j === li ? { ...l, unitPrice: e.target.value } : l)) }
                        : r
                    )
                  )
                }
                placeholder="Unit price"
              />
            </div>
          ))}
          <Button
            type="button"
            variant="ghost"
            onClick={() =>
              setGroups((rows) => rows.map((r, i) => (i === gi ? { ...r, lines: [...r.lines, emptyLine()] } : r)))
            }
          >
            Add line
          </Button>
        </div>
      ))}
      <div className="flex gap-2">
        <Button type="button" variant="secondary" onClick={addGroup}>
          Add repair group
        </Button>
        <Button type="submit">Send grouped estimate</Button>
      </div>
    </form>
  );
}
