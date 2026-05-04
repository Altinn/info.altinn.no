export const BoxColors = {
  Blue: "blue",
  Beige: "beige",
} as const;

export type BoxColor = typeof BoxColors[keyof typeof BoxColors];

export const BoxTypes = {
  Link: "link",
  Modal: "modal",
} as const;

export type BoxType = typeof BoxTypes[keyof typeof BoxTypes];
