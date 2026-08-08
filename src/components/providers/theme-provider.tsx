"use client"

import { useEffect } from "react"
import { useThemeStore } from "@/store/theme-store"

const STORAGE_KEY = "nexus-theme"

/**
 * Applies the persisted theme class before React hydrates,
 * preventing a flash of the wrong color scheme.
 */
export function ThemeInitScript() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `(function(){try{var s=localStorage.getItem(${JSON.stringify(STORAGE_KEY)});var t=s?JSON.parse(s).state.theme:"dark";document.documentElement.classList.toggle("dark",t==="dark");document.documentElement.classList.toggle("light",t==="light");}catch(e){document.documentElement.classList.add("dark")}})();`,
      }}
    />
  )
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useThemeStore((state) => state.theme)

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle("dark", theme === "dark")
    root.classList.toggle("light", theme === "light")
  }, [theme])

  return <>{children}</>
}
