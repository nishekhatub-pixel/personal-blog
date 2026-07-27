"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const STORAGE_KEY = "r7:petals";

type AtmosphereContextValue = {
  allowed: boolean;
  density: "high" | "low" | "medium";
  enabled: boolean;
  ready: boolean;
  toggle: () => void;
};

const AtmosphereContext = createContext<AtmosphereContextValue | null>(null);
const disabledAtmosphere: AtmosphereContextValue = {
  allowed: false,
  density: "low",
  enabled: false,
  ready: true,
  toggle: () => undefined,
};

export function AtmosphereProvider({
  adminEnabled,
  children,
  density,
}: {
  adminEnabled: boolean;
  children: React.ReactNode;
  density: "high" | "low" | "medium";
}) {
  const [enabled, setEnabled] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      if (!adminEnabled) {
        setEnabled(false);
        setReady(true);
        return;
      }

      let stored: string | null = null;
      try {
        stored = window.localStorage.getItem(STORAGE_KEY);
      } catch {
        stored = null;
      }
      setEnabled(stored !== "off");
      setReady(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [adminEnabled]);

  const toggle = useCallback(() => {
    if (!adminEnabled) return;
    setEnabled((current) => {
      const next = !current;
      try {
        window.localStorage.setItem(STORAGE_KEY, next ? "on" : "off");
      } catch {
        // The in-memory preference still works when storage is unavailable.
      }
      return next;
    });
  }, [adminEnabled]);

  const value = useMemo(
    () => ({
      allowed: adminEnabled,
      density,
      enabled: adminEnabled && enabled,
      ready,
      toggle,
    }),
    [adminEnabled, density, enabled, ready, toggle],
  );

  return (
    <AtmosphereContext.Provider value={value}>
      {children}
    </AtmosphereContext.Provider>
  );
}

export function useAtmosphere() {
  const context = useContext(AtmosphereContext);
  return context ?? disabledAtmosphere;
}
