"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import type { SearchParams } from "@/types/search";
import { CATEGORIES } from "@/lib/categories";
import { brandsFor, makes, modelsFor, productModelsFor, toSearchParams } from "@/lib/search/params";
import { SORT_OPTIONS } from "@/types/search";

const YEARS = Array.from({ length: 16 }, (_, i) => 2025 - i);
const BODY_STYLES = ["Pickup", "SUV", "Sedan", "Coupe", "Wagon", "Convertible"];
const DRIVETRAINS = ["4WD", "AWD", "RWD", "FWD"];
const TRANSMISSIONS = ["Automatic", "Manual", "CVT"];
const FUELS = ["Gasoline", "Diesel", "Hybrid", "PHEV", "Electric"];

type Props = {
  values: SearchParams;
  compact?: boolean;
};

export function FilterForm({ values, compact = false }: Props) {
  const router = useRouter();
  const isVehicle = values.category === "Vehicles";
  const makeOptions = isVehicle ? makes() : brandsFor(values.category);
  const modelOptions = isVehicle ? modelsFor(values.make) : productModelsFor(values.category, values.make);

  function update(next: Partial<SearchParams>) {
    const merged = { ...values, ...next, page: 1 };
    if (next.category && next.category !== values.category) {
      merged.make = undefined;
      merged.model = undefined;
      merged.yearMin = undefined;
      merged.yearMax = undefined;
      merged.mileageMin = undefined;
      merged.mileageMax = undefined;
      merged.bodyStyle = undefined;
      merged.drivetrain = undefined;
      merged.transmission = undefined;
      merged.fuelType = undefined;
    }
    if (next.make && next.make !== values.make) merged.model = undefined;
    const params = toSearchParams(merged);
    router.push(`/search?${params.toString()}`);
  }

  return (
    <div className={compact ? "space-y-4" : "space-y-5"}>
      <Field label="Category">
        <select
          value={values.category ?? ""}
          onChange={(event) => update({ category: event.target.value || undefined })}
          className="select"
        >
          <option value="">All categories</option>
          {CATEGORIES.map((category) => (
            <option key={category}>{category}</option>
          ))}
        </select>
      </Field>
      {makeOptions.length > 0 ? (
        <Field label={isVehicle ? "Make" : "Brand"}>
          <select
            value={values.make ?? ""}
            onChange={(event) => update({ make: event.target.value || undefined })}
            className="select"
          >
            <option value="">{isVehicle ? "Any make" : "Any brand"}</option>
            {makeOptions.map((make) => (
              <option key={make}>{make}</option>
            ))}
          </select>
        </Field>
      ) : null}
      {makeOptions.length > 0 ? (
        <Field label="Model">
          <select
            value={values.model ?? ""}
            onChange={(event) => update({ model: event.target.value || undefined })}
            className="select"
          >
            <option value="">Any model</option>
            {modelOptions.map((model) => (
              <option key={model}>{model}</option>
            ))}
          </select>
        </Field>
      ) : null}
      {isVehicle ? (
        <div className="grid grid-cols-2 gap-3">
          <Field label="Year min">
            <select
              value={values.yearMin ?? ""}
              onChange={(event) =>
                update({ yearMin: event.target.value ? Number(event.target.value) : undefined })
              }
              className="select"
            >
              <option value="">Any</option>
              {YEARS.map((year) => (
                <option key={year}>{year}</option>
              ))}
            </select>
          </Field>
          <Field label="Year max">
            <select
              value={values.yearMax ?? ""}
              onChange={(event) =>
                update({ yearMax: event.target.value ? Number(event.target.value) : undefined })
              }
              className="select"
            >
              <option value="">Any</option>
              {YEARS.map((year) => (
                <option key={year}>{year}</option>
              ))}
            </select>
          </Field>
        </div>
      ) : null}
      <div className="grid grid-cols-2 gap-3">
        <Field label="Price min">
          <input
            type="number"
            min={0}
            placeholder="0"
            value={values.priceMin ?? ""}
            onChange={(event) =>
              update({ priceMin: event.target.value ? Number(event.target.value) : undefined })
            }
            className="select"
          />
        </Field>
        <Field label="Price max">
          <input
            type="number"
            min={0}
            placeholder="40000"
            value={values.priceMax ?? ""}
            onChange={(event) =>
              update({ priceMax: event.target.value ? Number(event.target.value) : undefined })
            }
            className="select"
          />
        </Field>
      </div>
      {isVehicle ? (
        <div className="grid grid-cols-2 gap-3">
          <Field label="Miles min">
            <input
              type="number"
              min={0}
              value={values.mileageMin ?? ""}
              onChange={(event) =>
                update({ mileageMin: event.target.value ? Number(event.target.value) : undefined })
              }
              className="select"
            />
          </Field>
          <Field label="Miles max">
            <input
              type="number"
              min={0}
              value={values.mileageMax ?? ""}
              onChange={(event) =>
                update({ mileageMax: event.target.value ? Number(event.target.value) : undefined })
              }
              className="select"
            />
          </Field>
        </div>
      ) : null}
      <Field label="Location">
        <input
          value={values.location ?? ""}
          placeholder="Salt Lake City"
          onChange={(event) => update({ location: event.target.value || undefined })}
          className="select"
        />
      </Field>
      <Field label="Radius (miles)">
        <input
          type="number"
          min={1}
          value={values.radius ?? ""}
          placeholder="100"
          onChange={(event) =>
            update({ radius: event.target.value ? Number(event.target.value) : undefined })
          }
          className="select"
        />
      </Field>
      {isVehicle ? (
        <>
          <Field label="Body style">
            <select
              value={values.bodyStyle ?? ""}
              onChange={(event) => update({ bodyStyle: event.target.value || undefined })}
              className="select"
            >
              <option value="">Any</option>
              {BODY_STYLES.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </Field>
          <Field label="Drivetrain">
            <select
              value={values.drivetrain ?? ""}
              onChange={(event) => update({ drivetrain: event.target.value || undefined })}
              className="select"
            >
              <option value="">Any</option>
              {DRIVETRAINS.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </Field>
          <Field label="Transmission">
            <select
              value={values.transmission ?? ""}
              onChange={(event) => update({ transmission: event.target.value || undefined })}
              className="select"
            >
              <option value="">Any</option>
              {TRANSMISSIONS.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </Field>
          <Field label="Fuel">
            <select
              value={values.fuelType ?? ""}
              onChange={(event) => update({ fuelType: event.target.value || undefined })}
              className="select"
            >
              <option value="">Any</option>
              {FUELS.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </Field>
        </>
      ) : null}
      <Field label="Seller">
        <select
          value={values.sellerType ?? ""}
          onChange={(event) =>
            update({
              sellerType: (event.target.value || undefined) as SearchParams["sellerType"],
            })
          }
          className="select"
        >
          <option value="">Any</option>
          <option value="private">Private</option>
          <option value="dealer">Dealer</option>
        </select>
      </Field>
      <Field label="Sort">
        <select
          value={values.sort ?? "newest"}
          onChange={(event) =>
            update({ sort: event.target.value as (typeof SORT_OPTIONS)[number] })
          }
          className="select"
        >
          {SORT_OPTIONS.filter((option) => isVehicle || (option !== "mileageLow" && option !== "yearNewest")).map(
            (option) => (
              <option key={option} value={option}>
                {sortLabel(option)}
              </option>
            ),
          )}
        </select>
      </Field>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.16em] text-muted">
        {label}
      </span>
      {children}
    </label>
  );
}

function sortLabel(value: string) {
  const labels: Record<string, string> = {
    newest: "Newest",
    oldest: "Oldest",
    priceLow: "Price: low to high",
    priceHigh: "Price: high to low",
    mileageLow: "Lowest mileage",
    yearNewest: "Newest year",
    dealScore: "Deal score",
  };
  return labels[value] ?? value;
}
