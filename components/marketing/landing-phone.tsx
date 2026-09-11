import Link from "next/link";
import { Star } from "lucide-react";
import type { FeaturedShop } from "@/services/landing";

export function LandingPhone({ shops }: { shops: FeaturedShop[] }) {
  return (
    <div className="relative mx-auto w-[270px] shrink-0">
      <div className="rounded-[42px] border-[10px] border-[#1b1f24] bg-[#0b1220] p-2 shadow-[0_30px_80px_rgba(0,0,0,0.35)]">
        <div className="overflow-hidden rounded-[32px] bg-[#0b1a2c]">
          <div className="flex items-center justify-between px-5 pt-3 text-[10px] text-white/70">
            <span>9:41</span>
            <span className="h-4 w-20 rounded-full bg-black" />
            <span>5G</span>
          </div>
          <div className="px-4 pb-2 pt-3">
            <p className="text-center text-[11px] font-bold tracking-[0.18em] text-white">POCKET MECHANIC</p>
            <div className="mt-3 h-36 overflow-hidden rounded-2xl bg-[linear-gradient(180deg,#16324f_0%,#0d2138_100%)] relative">
              <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(255,255,255,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.12)_1px,transparent_1px)] [background-size:22px_22px]" />
              {(shops.length ? shops : [0, 1, 2, 3]).map((shop, index) => (
                <span
                  key={typeof shop === "number" ? shop : shop.slug}
                  className="absolute flex h-6 w-6 items-center justify-center rounded-full bg-[#2f7bff] text-[10px] font-bold text-white shadow-lg"
                  style={{ left: `${18 + (index % 3) * 28}%`, top: `${18 + (index % 2) * 36}%` }}
                >
                  {index + 1}
                </span>
              ))}
            </div>
            <p className="mt-3 text-sm font-semibold text-white">Shops Near You</p>
            <div className="mt-2 space-y-2 pb-4">
              {shops.slice(0, 3).map((shop) => (
                <Link
                  key={shop.slug}
                  href={`/mechanics/${shop.slug}`}
                  className="flex items-center gap-2 rounded-xl bg-white/5 px-2 py-2"
                >
                  <span className="h-9 w-9 overflow-hidden rounded-lg">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={shop.photo} alt="" className="h-full w-full object-cover" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-semibold text-white">{shop.businessName}</span>
                    <span className="flex items-center gap-1 text-[10px] text-white/60">
                      <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
                      {shop.averageRating.toFixed(1)}
                      <span>· {shop.distanceLabel}</span>
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
