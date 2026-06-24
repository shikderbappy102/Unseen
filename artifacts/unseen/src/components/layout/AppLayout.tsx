import { Link, useLocation } from "wouter";
import { Home, Flame, Sparkles, Sun, Moon, PenLine } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIdentity } from "@/hooks/use-identity";
import { useTheme } from "@/hooks/use-theme";
import { useEffect, useRef, useState } from "react";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { data: identity } = useIdentity();
  const { theme, toggle } = useTheme();

  const [navVisible, setNavVisible] = useState(true);
  const lastScrollY = useRef(0);
  const scrollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      if (currentY > lastScrollY.current + 8) setNavVisible(false);
      else if (currentY < lastScrollY.current - 8) setNavVisible(true);
      lastScrollY.current = currentY;
      if (scrollTimer.current) clearTimeout(scrollTimer.current);
      scrollTimer.current = setTimeout(() => setNavVisible(true), 600);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (scrollTimer.current) clearTimeout(scrollTimer.current);
    };
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row max-w-2xl mx-auto">
      <main className="flex-1 w-full pb-24 md:pb-0 relative">
        {children}
      </main>

      <nav
        className={cn(
          "fixed bottom-0 left-0 right-0 border-t border-border bg-background/90 backdrop-blur-md md:static md:w-20 md:border-t-0 md:border-l md:bg-transparent md:backdrop-blur-none z-50 transition-transform duration-300",
          !navVisible && "translate-y-full md:translate-y-0"
        )}
      >
        {/* Mobile nav */}
        <div className="flex md:hidden flex-row items-center justify-between h-16 px-4 max-w-2xl mx-auto">
          <Link
            href="/"
            className={cn("flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all", location === "/" ? "text-primary" : "text-muted-foreground")}
          >
            <Home className="w-5 h-5" />
            <span className="text-[9px] font-mono uppercase tracking-wider">home</span>
          </Link>

          <Link
            href="/trending"
            className={cn("flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all", location === "/trending" ? "text-primary" : "text-muted-foreground")}
          >
            <Flame className="w-5 h-5" />
            <span className="text-[9px] font-mono uppercase tracking-wider">trending</span>
          </Link>

          {/* Center compose — big and prominent */}
          <Link
            href="/compose"
            className="flex items-center justify-center w-14 h-14 -mt-5 rounded-2xl bg-primary shadow-[0_0_24px_rgba(168,85,247,0.5)] hover:shadow-[0_0_32px_rgba(168,85,247,0.7)] transition-all duration-300 hover:scale-105 active:scale-95"
          >
            <PenLine className="w-6 h-6 text-white" />
          </Link>

          <Link
            href="/my-vibe"
            className={cn("flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all", location === "/my-vibe" ? "text-primary" : "text-muted-foreground")}
          >
            <Sparkles className="w-5 h-5" />
            <span className="text-[9px] font-mono uppercase tracking-wider">my vibe</span>
          </Link>

          <Link
            href="/profile"
            className={cn("flex flex-col items-center gap-0.5 px-2 py-2 rounded-xl transition-all group", location === "/profile" ? "text-primary" : "text-muted-foreground")}
          >
            <span className="font-mono font-bold text-sm leading-none">
              #{identity?.anonNumber ?? "···"}
            </span>
            <span className="text-[9px] font-mono uppercase tracking-wider">me</span>
          </Link>
        </div>

        {/* Desktop side nav */}
        <div className="hidden md:flex flex-col items-center justify-between h-screen py-6 w-full">
          <div className="flex flex-col gap-5 items-center">
            <Link href="/" className={cn("flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all", location === "/" ? "bg-primary/20 text-primary" : "text-muted-foreground hover:bg-muted")}>
              <Home className="w-5 h-5" />
              <span className="text-[9px] font-mono uppercase tracking-wider">home</span>
            </Link>
            <Link href="/trending" className={cn("flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all", location === "/trending" ? "bg-primary/20 text-primary" : "text-muted-foreground hover:bg-muted")}>
              <Flame className="w-5 h-5" />
              <span className="text-[9px] font-mono uppercase tracking-wider">trending</span>
            </Link>
            <Link href="/compose" className="flex flex-col items-center gap-0.5 px-3 py-2.5 rounded-xl bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 transition-all">
              <PenLine className="w-5 h-5" />
              <span className="text-[9px] font-mono uppercase tracking-wider">write</span>
            </Link>
            <Link href="/my-vibe" className={cn("flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all", location === "/my-vibe" ? "bg-primary/20 text-primary" : "text-muted-foreground hover:bg-muted")}>
              <Sparkles className="w-5 h-5" />
              <span className="text-[9px] font-mono uppercase tracking-wider">my vibe</span>
            </Link>
          </div>

          <div className="flex flex-col items-center gap-3">
            <button
              onClick={toggle}
              className="flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl text-muted-foreground hover:bg-muted transition-all"
              title={theme === "dark" ? "Light mode" : "Dark mode"}
            >
              {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              <span className="text-[9px] font-mono uppercase tracking-wider">{theme === "dark" ? "light" : "dark"}</span>
            </button>
            <Link href="/profile" className={cn("flex flex-col items-center gap-0.5 px-2 py-2 rounded-xl transition-all group", location === "/profile" ? "bg-primary/15 border border-primary/30" : "hover:bg-primary/10 border border-transparent")}>
              <span className={cn("font-mono font-bold text-sm leading-none", location === "/profile" ? "text-primary" : "text-primary/60 group-hover:text-primary")}>
                #{identity?.anonNumber ?? "···"}
              </span>
              <span className="text-[9px] font-mono text-muted-foreground/40 uppercase tracking-wider">profile</span>
            </Link>
          </div>
        </div>
      </nav>
    </div>
  );
}
