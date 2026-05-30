import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

const themeOrder = ["light", "dark", "system"] as const;

const themeMeta = {
  light: {
    label: "Light",
    icon: Sun,
  },
  dark: {
    label: "Dark",
    icon: Moon,
  },
  system: {
    label: "System",
    icon: Monitor,
  },
};

export function ThemeToggle() {
  const { theme = "system", setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const safeTheme = themeOrder.includes(theme as (typeof themeOrder)[number])
    ? (theme as (typeof themeOrder)[number])
    : "system";
  const Icon = themeMeta[safeTheme].icon;

  const cycleTheme = () => {
    const currentIndex = themeOrder.indexOf(safeTheme);
    const nextTheme = themeOrder[(currentIndex + 1) % themeOrder.length];
    setTheme(nextTheme);
  };

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="h-9 w-9" disabled>
        <Monitor className="h-4 w-4" />
        <span className="sr-only">Theme</span>
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-9 w-9"
      onClick={cycleTheme}
      title={`Theme: ${themeMeta[safeTheme].label}`}
      aria-label={`Theme: ${themeMeta[safeTheme].label}`}
    >
      <Icon className="h-4 w-4" />
    </Button>
  );
}
