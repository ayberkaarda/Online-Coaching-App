'use client'

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Hydration hatasını önlemek için bileşenin yüklenmesini bekliyoruz
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="fixed bottom-6 right-6 w-14 h-14 flex items-center justify-center rounded-full bg-white dark:bg-[#16161d] shadow-2xl border border-gray-200 dark:border-zinc-800 text-2xl hover:scale-110 transition-all z-50"
      title="Karanlık/Aydınlık Mod"
    >
      {theme === "dark" ? "☀️" : "🌙"}
    </button>
  )
}