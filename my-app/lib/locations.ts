// Kept in sync with backend/src/utils/somaliCities.ts — the backend only
// accepts these exact values for a user's city and a listing's city.
export const SOMALI_CITIES = [
  "Mogadishu",
  "Afgooye",
  "Baidoa",
  "Balcad",
  "Beledweyne",
  "Berbera",
  "Borama",
  "Bosaso",
  "Burao",
  "Dhusamareb",
  "Erigavo",
  "Galkayo",
  "Garowe",
  "Hargeisa",
  "Jowhar",
  "Kismayo",
  "Las Anod",
  "Marka",
] as const;

export type SomaliCity = (typeof SOMALI_CITIES)[number];

export function isSomaliCity(value: string | null | undefined): value is SomaliCity {
  return (SOMALI_CITIES as readonly string[]).includes(value ?? "");
}

// Suggestions for neighborhood inputs (free text is still allowed).
export const MOGADISHU_DISTRICTS = [
  "Abdiaziz",
  "Bondhere",
  "Daynile",
  "Dharkenley",
  "Hamar Jajab",
  "Hamar Weyne",
  "Hawl-Wadaag",
  "Heliwaa",
  "Hodan",
  "Kaaraan",
  "Kaxda",
  "Shangani",
  "Shibis",
  "Waberi",
  "Wadajir",
  "Wardhigley",
  "Yaqshid",
];
