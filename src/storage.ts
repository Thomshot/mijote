import { useCallback, useEffect, useState } from "react";

const PREFIX = "mijote:";

export function readStored<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeStored<T>(key: string, value: T) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    /* stockage plein ou indisponible : on ignore */
  }
}

/** useState persistant dans le localStorage du téléphone. */
export function useStored<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => readStored(key, initial));
  useEffect(() => {
    writeStored(key, value);
  }, [key, value]);
  const set = useCallback((v: T | ((prev: T) => T)) => setValue(v), []);
  return [value, set] as const;
}

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

/** Toutes les données de l'appli, pour la sauvegarde. */
export function exportAll() {
  const data: Record<string, unknown> = {};
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith(PREFIX)) data[k.slice(PREFIX.length)] = JSON.parse(localStorage.getItem(k) ?? "null");
    }
  } catch {
    /* stockage indisponible */
  }
  return { app: "mijote", version: 1, exportedAt: new Date().toISOString(), data };
}

/** Restaure une sauvegarde. Renvoie le nombre d'éléments restaurés. */
export function importAll(json: string) {
  const parsed = JSON.parse(json);
  if (parsed?.app !== "mijote" || typeof parsed.data !== "object") throw new Error("Ce fichier n'est pas une sauvegarde Mijote.");
  let n = 0;
  for (const [k, v] of Object.entries(parsed.data as Record<string, unknown>)) {
    localStorage.setItem(PREFIX + k, JSON.stringify(v));
    n++;
  }
  return n;
}
