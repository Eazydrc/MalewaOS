import { ReactNode } from "react";
import { BottomNav } from "./BottomNav";
import { DesktopSidebar } from "./DesktopSidebar";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useIsDesktop } from "@/hooks/useIsDesktop";
import { PwaInstallPrompt } from "@/components/ui/PwaInstallPrompt";

interface AppLayoutProps {
  children: ReactNode;
  title?: string;
  showBack?: boolean;
  headerRight?: ReactNode;
  noPadding?: boolean;
  noHeader?: boolean;
}

export function AppLayout({ children, title, showBack = false, headerRight, noPadding = false, noHeader = false }: AppLayoutProps) {
  const isDesktop = useIsDesktop();

  // ── Layout Desktop ─────────────────────────────────────────────────────────
  if (isDesktop) {
    return (
      <div className="flex min-h-screen bg-surface">
        <DesktopSidebar />

        {/* Contenu principal — offset sidebar 240px */}
        <div className="flex-1 flex flex-col" style={{ marginLeft: '240px' }}>
          {/* Top bar desktop */}
          <header className="sticky top-0 z-20 bg-surface/95 backdrop-blur border-b border-border h-14 flex items-center justify-between px-6 gap-4">
            <div className="flex items-center gap-3 min-w-0">
              {showBack && (
                <button
                  onClick={() => window.history.back()}
                  className="w-8 h-8 flex items-center justify-center rounded-xl bg-surface-2 border border-border text-text-2 hover:text-text transition-all"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <polyline points="15 18 9 12 15 6"/>
                  </svg>
                </button>
              )}
              {title && (
                <h1 className="text-base font-bold text-text tracking-tight truncate">{title}</h1>
              )}
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {headerRight}
              <ThemeToggle />
            </div>
          </header>

          {/* Contenu */}
          <main className={noPadding ? "flex-1" : "flex-1 px-6 py-6 space-y-6 max-w-7xl w-full"}>
            {children}
          </main>
        </div>

        <PwaInstallPrompt />
      </div>
    );
  }

  // ── Layout Mobile (existant) ───────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-surface-gradient" style={{ maxWidth: "430px", margin: "0 auto", position: "relative" }}>
      {/* Header */}
      {!noHeader && <header className="sticky top-0 z-40 card-glass border-b border-border/60 rounded-none px-4 h-14 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {showBack ? (
            <button
              onClick={() => window.history.back()}
              className="w-8 h-8 flex items-center justify-center rounded-xl bg-surface-2 border border-border text-text-2 hover:text-text hover:bg-surface-3 transition-all no-tap active:scale-95 shrink-0"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
            </button>
          ) : (
            <a href="/home" className="shrink-0">
              <span className="text-xl font-black tracking-tighter text-text">
                Elen<span className="text-gradient-accent">gi</span>
              </span>
            </a>
          )}
          {title && (
            <h1 className="text-base font-bold text-text tracking-tight truncate">{title}</h1>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {headerRight}
          <ThemeToggle />
        </div>
      </header>}


      {/* Content */}
      <main className={noPadding ? "pb-24" : "px-4 py-5 pb-28 space-y-6"}>
        {children}
      </main>

      <BottomNav />
      <PwaInstallPrompt />
    </div>
  );
}
