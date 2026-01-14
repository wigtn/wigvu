"use client";

import { useCallback, useSyncExternalStore } from "react";
import { Sun, Moon } from "lucide-react";

type Theme = "light" | "dark";

// localStorage 기반 theme store
const themeStore = {
  listeners: new Set<() => void>(),

  getTheme(): Theme {
    if (typeof window === "undefined") return "light";
    const stored = localStorage.getItem("theme") as Theme | null;
    if (stored) return stored;
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  },

  setTheme(theme: Theme) {
    localStorage.setItem("theme", theme);
    document.documentElement.classList.toggle("dark", theme === "dark");
    this.listeners.forEach((listener) => listener());
  },

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  },
};

// 컴포넌트 마운트 시 초기 테마 적용
if (typeof window !== "undefined") {
  const initialTheme = themeStore.getTheme();
  document.documentElement.classList.toggle("dark", initialTheme === "dark");
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(
    (listener) => themeStore.subscribe(listener),
    () => themeStore.getTheme(),
    () => "light" as Theme // SSR에서는 항상 light
  );

  const toggleTheme = useCallback(() => {
    const newTheme = theme === "light" ? "dark" : "light";
    themeStore.setTheme(newTheme);
  }, [theme]);

  return (
    <button
      onClick={toggleTheme}
      className="w-10 h-10 flex items-center justify-center border border-border hover:bg-muted transition-colors"
      aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
    >
      {theme === "light" ? (
        <Moon className="w-5 h-5" />
      ) : (
        <Sun className="w-5 h-5" />
      )}
    </button>
  );
}
