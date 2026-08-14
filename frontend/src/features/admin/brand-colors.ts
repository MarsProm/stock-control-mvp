export const BRAND_COLORS = [
  { name: "Azul profesional", value: "#1D4ED8" },
  { name: "Verde comercio", value: "#047857" },
  { name: "Índigo", value: "#4338CA" },
  { name: "Bordó", value: "#B91C1C" },
  { name: "Gris azulado", value: "#334155" },
] as const;

export const DEFAULT_BRAND_COLOR = "#334155";

export function normalizeBrandColor(value: string) {
  const normalizedValue = value.toUpperCase();
  return BRAND_COLORS.some((color) => color.value === normalizedValue)
    ? normalizedValue
    : DEFAULT_BRAND_COLOR;
}

export function contrastWithWhite(hexColor: string) {
  const channels = [1, 3, 5].map((position) =>
    linearChannel(Number.parseInt(hexColor.slice(position, position + 2), 16) / 255),
  );
  const luminance =
    0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
  return 1.05 / (luminance + 0.05);
}

function linearChannel(value: number) {
  return value <= 0.03928
    ? value / 12.92
    : Math.pow((value + 0.055) / 1.055, 2.4);
}
