import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useTheme } from "@/components/theme-provider";

export function ModeToggle() {
  const { theme, setTheme } = useTheme();
  const isDark = theme !== "light";
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setTheme(isDark ? "light" : "dark")}
          aria-label={`Switch to ${isDark ? "light" : "dark"} theme`}
        >
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{isDark ? "Light mode" : "Dark mode"}</TooltipContent>
    </Tooltip>
  );
}
