export const KENYAN_CITIES = [
  "Nairobi", "Mombasa", "Kisumu", "Nakuru", "Eldoret", "Thika",
  "Malindi", "Kitale", "Garissa", "Kakamega", "Nyeri", "Machakos", "Meru",
] as const;

export const PROPERTY_TYPES = [
  { value: "single_room", label: "Single Room" },
  { value: "bedsitter", label: "Bedsitter" },
  { value: "one_br", label: "1 Bedroom" },
  { value: "two_br", label: "2 Bedroom" },
  { value: "three_br", label: "3 Bedroom" },
  { value: "four_br_plus", label: "4 Bedroom+" },
] as const;

export const propertyTypeLabel = (v: string) =>
  PROPERTY_TYPES.find((t) => t.value === v)?.label ?? v;

export const formatKES = (n: number) =>
  `KES ${new Intl.NumberFormat("en-KE").format(n)}`;
