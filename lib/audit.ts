import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

export async function audit(input: {
  actorId?: string | null;
  action: string;
  targetType: string;
  targetId: string;
  reason?: string;
  metadata?: Prisma.InputJsonValue;
}) {
  await prisma.auditEvent.create({
    data: {
      actorId: input.actorId ?? undefined,
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId,
      reason: input.reason,
      metadata: input.metadata ?? undefined,
    },
  });
}
