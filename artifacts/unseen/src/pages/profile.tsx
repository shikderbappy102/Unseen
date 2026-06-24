import { useAuth, useClerk } from "@clerk/react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { LogIn, LogOut, Shield, Shuffle } from "lucide-react";
import { useIdentity } from "@/hooks/use-identity";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function Profile() {
  const { isSignedIn, isLoaded } = useAuth();
  const { signOut } = useClerk();
  const { data: identity } = useIdentity();
  const [, setLocation] = useLocation();

  if (!isLoaded) {
    return <div className="min-h-screen bg-background" />;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <motion.div
        className="relative z-10 w-full max-w-sm flex flex-col items-center gap-8"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-20 h-20 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shadow-[0_0_40px_rgba(168,85,247,0.15)]">
            <span className="text-3xl font-mono font-bold text-primary">
              {identity ? `#${String(identity.anonNumber).slice(-2)}` : "?"}
            </span>
          </div>

          <div className="flex flex-col items-center gap-1">
            <h1 className="text-2xl font-serif font-bold text-foreground">
              Anonymous #{identity?.anonNumber ?? "···"}
            </h1>
            <p className="text-xs font-mono text-muted-foreground/50 uppercase tracking-wider">
              your identity on UNSEEN
            </p>
          </div>
        </div>

        <div className={`w-full rounded-2xl border p-4 flex items-start gap-3 ${isSignedIn ? "border-primary/30 bg-primary/5" : "border-border/50 bg-card/40"}`}>
          {isSignedIn ? (
            <>
              <Shield className="w-5 h-5 text-primary mt-0.5 shrink-0" />
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-semibold text-primary">Permanent identity</span>
                <span className="text-xs text-muted-foreground leading-relaxed">
                  Your Anon # is saved to your account. It follows you across every device and browser.
                </span>
              </div>
            </>
          ) : (
            <>
              <Shuffle className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-semibold text-foreground">Temporary identity</span>
                <span className="text-xs text-muted-foreground leading-relaxed">
                  Your Anon # is tied to this network. Sign in with Google to lock it in permanently.
                </span>
              </div>
            </>
          )}
        </div>

        <div className="w-full flex flex-col gap-3">
          {isSignedIn ? (
            <button
              onClick={() => signOut({ redirectUrl: basePath || "/" })}
              className="w-full py-3.5 rounded-2xl border border-border/60 bg-card/50 text-foreground font-medium text-sm flex items-center justify-center gap-2.5 hover:bg-card hover:border-primary/30 transition-all duration-300"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          ) : (
            <button
              onClick={() => setLocation("/sign-in")}
              className="w-full py-3.5 rounded-2xl bg-primary text-primary-foreground font-bold text-base flex items-center justify-center gap-2.5 shadow-[0_0_25px_rgba(168,85,247,0.35)] hover:shadow-[0_0_35px_rgba(168,85,247,0.5)] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
            >
              <LogIn className="w-4 h-4" />
              Sign in to lock in your Anon #
            </button>
          )}

          <button
            onClick={() => setLocation("/")}
            className="w-full py-3 rounded-2xl text-muted-foreground text-sm font-medium hover:text-foreground transition-colors"
          >
            ← Back to feed
          </button>
        </div>
      </motion.div>
    </div>
  );
}
