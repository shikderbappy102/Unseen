import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, Loader2, ArrowLeft } from "lucide-react";

export default function MyVibe() {
  const [feeling, setFeeling] = useState("");
  const [sketch, setSketch] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const maxChars = 400;

  async function handleSubmit() {
    if (!feeling.trim() || loading) return;
    setLoading(true);
    setSketch(null);
    setError(null);
    try {
      const res = await fetch("/api/vibe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feeling: feeling.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      setSketch(data.sketch);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Couldn't connect. Try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setSketch(null);
    setFeeling("");
    setError(null);
  }

  return (
    <div className="min-h-screen bg-background flex flex-col px-4 pt-10 pb-28 max-w-lg mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <Eye className="w-4 h-4 text-primary/50" />
            <span className="text-xs font-mono text-primary/40 uppercase tracking-widest">just between us</span>
          </div>
          <h1 className="text-2xl font-serif font-bold text-foreground mb-2">What's in your head?</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Describe it — doesn't matter how messy. I'll just reflect it back, exactly as it is.
          </p>
        </div>

        <AnimatePresence mode="wait">
          {!sketch ? (
            <motion.div
              key="input"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col gap-4"
            >
              <div className="relative">
                <textarea
                  value={feeling}
                  onChange={(e) => setFeeling(e.target.value.slice(0, maxChars))}
                  placeholder="Everything feels heavy. I keep replaying the same thoughts and I can't tell if I'm overthinking or if something is actually wrong..."
                  className="w-full min-h-[180px] rounded-2xl bg-card border border-border focus:border-primary/30 focus:outline-none focus:ring-1 focus:ring-primary/20 text-foreground placeholder:text-muted-foreground/30 text-sm leading-relaxed resize-none p-4 transition-all duration-200"
                  disabled={loading}
                />
                <span className="absolute bottom-3 right-3 text-[10px] font-mono text-muted-foreground/25">
                  {feeling.length}/{maxChars}
                </span>
              </div>

              {error && (
                <p className="text-sm text-destructive/80 text-center px-2">{error}</p>
              )}

              <button
                onClick={handleSubmit}
                disabled={loading || feeling.trim().length < 3}
                className="w-full py-4 rounded-2xl bg-card border border-primary/20 text-foreground font-medium text-base flex items-center justify-center gap-2.5 hover:bg-primary/5 hover:border-primary/40 transition-all duration-300 disabled:opacity-30 disabled:pointer-events-none"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-primary/60" />
                    <span className="text-muted-foreground text-sm">Reading between the lines…</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4 text-primary/60" />
                    Show me what's inside
                  </>
                )}
              </button>

              <p className="text-center text-[11px] text-muted-foreground/30 font-mono">
                Nothing is stored. This is only for you.
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="flex flex-col gap-6"
            >
              {/* The sketch card — looks like a handwritten note, not a chatbot reply */}
              <div className="rounded-2xl bg-card border border-border/60 p-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-0.5 h-full bg-primary/20 rounded-full" />
                <p className="text-foreground text-[15px] leading-[1.8] font-serif pl-4">{sketch}</p>
              </div>

              <div className="flex flex-col gap-2">
                <button
                  onClick={handleReset}
                  className="w-full py-3 rounded-2xl border border-border/50 bg-transparent text-muted-foreground text-sm font-medium flex items-center justify-center gap-2 hover:border-primary/20 hover:text-foreground transition-all duration-300"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Write something else
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
