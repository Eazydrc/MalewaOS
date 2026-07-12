import { useTheme, AppTheme } from "@/lib/useTheme";
import { cn } from "@/lib/cn";

const THEME_META: Record<AppTheme, { label: string; emoji: string; next: string }> = {
  ocean:  { label: "Océan",  emoji: "🌊", next: "→ Abysse" },
  abysse: { label: "Abysse", emoji: "🌑", next: "→ Aurore" },
  aurore: { label: "Aurore", emoji: "🌅", next: "→ Océan"  },
};

interface ThemeToggleProps {
  className?: string;
  /** Afficher les 3 chips au lieu du bouton cycle */
  expanded?: boolean;
}

export function ThemeToggle({ className, expanded = false }: ThemeToggleProps) {
  const { theme, set, cycle } = useTheme();
  const meta = THEME_META[theme];

  if (expanded) {
    return (
      <div className={cn("flex gap-1.5", className)}>
        {(Object.keys(THEME_META) as AppTheme[]).map((key) => {
          const t = THEME_META[key];
          const active = theme === key;
          return (
            <button
              key={key}
              onClick={() => set(key)}
              title={t.label}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold no-tap",
                "border transition-all duration-150",
                active
                  ? "bg-accent/15 border-accent/40 text-accent"
                  : "bg-surface-2 border-border text-text-3 hover:border-border-strong hover:text-text-2",
              )}
            >
              <span className="text-sm leading-none">{t.emoji}</span>
              {t.label}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <button
      onClick={cycle}
      aria-label={`Thème actuel : ${meta.label} — cliquer pour ${meta.next}`}
      title={`${meta.label} · clic → ${meta.next}`}
      className={cn(
        "relative inline-flex items-center justify-center w-9 h-9 rounded-xl no-tap",
        "bg-surface-2 border border-border text-text-2",
        "hover:bg-surface-3 hover:border-border-strong hover:text-text",
        "transition-all duration-150 active:scale-95",
        className,
      )}
    >
      <span className="text-base leading-none select-none">{meta.emoji}</span>
    </button>
  );
}
