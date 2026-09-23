// Cities users pick from at registration and when posting a listing. Kept in
// sync with my-app/lib/locations.ts — stored values are these exact strings.
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
