"use client"

import { Moon, Sun } from "lucide-react"
import { useMounted } from "@/hooks/use-mounted"
import { useThemeStore } from "@/store/theme-store"
import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const mounted = useMounted()
  const theme = useThemeStore((state) => state.theme)
  const toggleTheme = useThemeStore((state) => state.toggleTheme)

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      className="text-muted-foreground hover:text-foreground"
    >
      {mounted &&
        (theme === "dark" ? (
          <Sun className="size-4" aria-hidden="true" />
        ) : (
          <Moon className="size-4" aria-hidden="true" />
        ))}
    </Button>
  )
}
