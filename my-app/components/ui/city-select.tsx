"use client";

import { cn } from "@/lib/cn";
import { SOMALI_CITIES } from "@/lib/locations";

export const selectClass =
  "rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-zinc-900 outline-none transition-colors focus:border-rose-500 focus:ring-2 focus:ring-rose-100";

/** Dropdown of the cities the backend accepts. An empty value shows `placeholder`. */
export function CitySelect({
  label,
  value,
  onChange,
  placeholder,
  required,
  name = "city",
  className,
}: {
  label: string;
  value: string;
  onChange: (city: string) => void;
  placeholder: string;
  required?: boolean;
  name?: string;
  className?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium text-zinc-700">{label}</span>
      <select
        name={name}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(selectClass, !value && "text-zinc-400", className)}
      >
        {/* Disabled when required so the browser forces a real choice. */}
        <option value="" disabled={required}>
          {placeholder}
        </option>
        {SOMALI_CITIES.map((city) => (
          <option key={city} value={city} className="text-zinc-900">
            {city}
          </option>
        ))}
      </select>
    </label>
  );
}
