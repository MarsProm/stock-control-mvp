export const BRAND_COLORS = [
  { name: "Pizarra", value: "#334155" },
  { name: "Gris", value: "#475569" },
  { name: "Azul", value: "#1D4ED8" },
  { name: "Índigo", value: "#4338CA" },
  { name: "Violeta", value: "#6D28D9" },
  { name: "Fucsia", value: "#A21CAF" },
  { name: "Rosa", value: "#BE123C" },
  { name: "Rojo", value: "#B91C1C" },
  { name: "Naranja", value: "#C2410C" },
  { name: "Ámbar", value: "#92400E" },
  { name: "Esmeralda", value: "#047857" },
  { name: "Turquesa", value: "#0F766E" },
  { name: "Cian", value: "#0E7490" },
] as const;

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
