import { ThemedBoard } from "@/components/layout/themed-board";
import { VinImportForm } from "@/components/vehicles/vin-import-form";
import { requireSession } from "@/lib/guards";
import { prisma } from "@/lib/db";
import Link from "next/link";

export const metadata = { title: "Import a vehicle" };

export default async function ImportVehiclePage({
  searchParams,
}: {
  searchParams: Promise<{ vin?: string; year?: string; modelId?: string; make?: string; model?: string; error?: string }>;
}) {
  await requireSession("CUSTOMER");
  const params = await searchParams;
  const makes = await prisma.vehicleMake.findMany({
    include: { models: { orderBy: { name: "asc" } } },
    orderBy: { name: "asc" },
  });
  return (
    <ThemedBoard
      eyebrow="IMPORT A VEHICLE"
      title="Add by"
      accent="VIN."
      subtitle="Decode a VIN into year, make, and model. HINs and unmatched VINs still use the catalog picker."
      script="Good Machines Lead to Great Days."
      image="/landing/cat-automotive.png"
      wide={false}
    >
      <VinImportForm
        key={`${params.vin ?? ""}-${params.modelId ?? ""}-${params.error ?? ""}`}
        makes={makes}
        initial={{
          vin: params.vin,
          year: params.year,
          modelId: params.modelId,
          make: params.make,
          model: params.model,
          error: params.error,
        }}
      />
      <p className="mt-6 text-sm">
        Prefer typing it in?{" "}
        <Link href="/vehicles/new" className="font-semibold text-[#2f7bff]">
          Manual entry
        </Link>
      </p>
    </ThemedBoard>
  );
}
