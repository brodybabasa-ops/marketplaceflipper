import { nanoid } from "nanoid";
import { formatDenverDateInput } from "@/lib/datetime";
import { prisma } from "@/lib/db";

export async function nextRepairOrderNumber() {
  return nextDocumentNumber("RO", async (number) => {
    const existing = await prisma.job.findUnique({ where: { repairOrderNumber: number }, select: { id: true } });
    return !existing;
  });
}

export async function nextInvoiceNumber() {
  return nextDocumentNumber("INV", async (number) => {
    const existing = await prisma.invoice.findUnique({ where: { number }, select: { id: true } });
    return !existing;
  });
}

async function nextDocumentNumber(kind: "RO" | "INV", available: (number: string) => Promise<boolean>) {
  const day = formatDenverDateInput(new Date()).replaceAll("-", "");
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const number = `${kind}-${day}-${nanoid(4).toUpperCase()}`;
    if (await available(number)) return number;
  }
  return `${kind}-${day}-${nanoid(8).toUpperCase()}`;
}
