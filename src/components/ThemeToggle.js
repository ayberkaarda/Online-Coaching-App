'use client'

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="fixed top-4 right-4 p-2.5 rounded-full bg-white shadow-md dark:bg-zinc-800 text-sm font-medium border border-gray-200 dark:border-zinc-700 z-50 transition-all"
    >
      {theme === 'dark' ? '☀️ Aydınlık Mod' : '🌙 Karanlık Mod'}
    </button>
  );
}