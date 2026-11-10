import type { Recipe, ShoppingItem } from "./types";
import { uid } from "./storage";

const GRADIENTS = [
  ["#F6C9A8", "#E9876B"],
  ["#CFE3C3", "#8DB580"],
  ["#F7E1A1", "#E6B655"],
  ["#F3C6CF", "#DC8396"],
  ["#C9DDEB", "#7FA7C7"],
  ["#E3D3F0", "#A98BC9"],
  ["#F4D6B9", "#C98F5B"],
];

export function gradientFor(seed: string) {
  let h = 0;
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const [a, b] = GRADIENTS[h % GRADIENTS.length];
  return `linear-gradient(135deg, ${a}, ${b})`;
}

export function formatQty(q: number) {
  if (!q) return "";
  if (q >= 10) return String(Math.round(q));
  const rounded = Math.round(q * 4) / 4;
  const whole = Math.floor(rounded);
  const frac = rounded - whole;
  const fracStr = frac === 0.25 ? "¼" : frac === 0.5 ? "½" : frac === 0.75 ? "¾" : "";
  if (!whole && fracStr) return fracStr;
  return `${whole || ""}${fracStr}` || String(Math.round(q * 10) / 10);
}

export const euros = (n: number) => n.toLocaleString("fr-FR", { style: "currency", currency: "EUR" });

export const totalMinutes = (r: Recipe) => r.prepMinutes + r.cookMinutes;

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim();

/** Ajoute les ingrédients d'une ou plusieurs recettes à la liste, en fusionnant les doublons. */
export function mergeIntoShopping(list: ShoppingItem[], recipes: { recipe: Recipe; servings?: number }[]) {
  const totals = new Map<string, { name: string; unit: string; qty: number; aisle: ShoppingItem["aisle"]; note: string }>();
  for (const { recipe, servings } of recipes) {
    const factor = (servings ?? recipe.servings) / recipe.servings;
    for (const ing of recipe.ingredients) {
      const key = `${norm(ing.name)}|${ing.unit}`;
      const cur = totals.get(key);
      if (cur) cur.qty += ing.quantity * factor;
      else totals.set(key, { name: ing.name, unit: ing.unit, qty: ing.quantity * factor, aisle: ing.aisle, note: ing.glutenNote });
    }
  }
  const next = [...list];
  for (const t of totals.values()) {
    const quantity = `${formatQty(t.qty)} ${t.unit}`.trim();
    const existing = next.find((x) => !x.checked && norm(x.name) === norm(t.name));
    if (existing) {
      existing.quantity = existing.quantity ? `${existing.quantity} + ${quantity}` : quantity;
    } else {
      next.push({ id: uid(), name: t.name, quantity, aisle: t.aisle, checked: false, glutenNote: t.note });
    }
  }
  return next;
}

export function haptic() {
  try {
    navigator.vibrate?.(10);
  } catch {
    /* pas de vibration sur iOS */
  }
}

export function beep() {
  try {
    const ctx = new AudioContext();
    [0, 0.35, 0.7].forEach((t) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.frequency.value = 880;
      g.gain.setValueAtTime(0.25, ctx.currentTime + t);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.3);
      o.connect(g).connect(ctx.destination);
      o.start(ctx.currentTime + t);
      o.stop(ctx.currentTime + t + 0.3);
    });
  } catch {
    /* audio indisponible */
  }
}
