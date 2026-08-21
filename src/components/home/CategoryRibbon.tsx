import Link from "next/link";
import { Car, Grid2x2, Hammer, Home, Shirt, Smartphone, Trophy, Watch } from "lucide-react";

const CATEGORIES = [
  { href: "/search", label: "All Categories", icon: Grid2x2, color: "text-violet-400" },
  { href: "/search", label: "Electronics", icon: Smartphone, color: "text-sky-400" },
  { href: "/search?bodyStyle=Pickup", label: "Vehicles", icon: Car, color: "text-emerald-400" },
  { href: "/search", label: "Tools", icon: Hammer, color: "text-amber-400" },
  { href: "/search", label: "Home", icon: Home, color: "text-rose-400" },
  { href: "/search", label: "Sports", icon: Trophy, color: "text-orange-400" },
  { href: "/search", label: "Collectibles", icon: Watch, color: "text-fuchsia-400" },
  { href: "/search", label: "Fashion", icon: Shirt, color: "text-cyan-400" },
];

export function CategoryRibbon() {
  return (
    <div className="border-y border-white/5 bg-white">
      <div className="mx-auto flex max-w-6xl gap-2 overflow-x-auto px-4 py-4">
        {CATEGORIES.map((category) => {
          const Icon = category.icon;
          return (
            <Link
              key={category.label}
              href={category.href}
              className="flex min-w-[108px] flex-col items-center gap-2 rounded-xl px-3 py-2 text-slate-700 hover:bg-slate-100"
            >
              <Icon className={`h-5 w-5 ${category.color}`} />
              <span className="text-[11px] font-medium">{category.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
