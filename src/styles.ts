export const WEIGHT_NAME_MAP: Record<number, string> = {
  200: "ExtraLight",
  300: "Light",
  400: "Regular",
  600: "SemiBold",
  700: "Bold"
};

export function weightToName(weight: number): string {
  const name = WEIGHT_NAME_MAP[weight];
  if (!name) {
    throw new Error(`Unsupported weight: ${weight}`);
  }
  return name;
}

export function styleName(weight: number, italic: boolean): string {
  const base = weightToName(weight);
  if (!italic) {
    return base;
  }
  if (base === "Regular") {
    return "Italic";
  }
  return `${base}Italic`;
}
