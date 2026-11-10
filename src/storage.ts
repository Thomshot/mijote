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
