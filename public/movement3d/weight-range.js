// One range for controls, stored suggestions and the visual model (kg per dumbbell).
export const MAX_KG=60;
export function normalizeKg(value,fallback=8){const n=Number(value);return Number.isFinite(n)?Math.max(0,Math.min(MAX_KG,Math.round(n*2)/2)):fallback;}
