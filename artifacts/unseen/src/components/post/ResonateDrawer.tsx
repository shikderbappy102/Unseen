import { useState } from "react";
import { X, Send, Waves } from "lucide-react";
import { useCreatePost, Post, PostInputEmotion } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { getListPostsQueryKey } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

interface ResonateDrawerProps {
  post: Post;
  open: boolean;
  onClose: () => void;
}

export function ResonateDrawer({ post, open, onClose }: ResonateDrawerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createPost = useCreatePost();

  const [content, setContent] = useState("");
  const [emotion, setEmotion] = useState<PostInputEmotion | null>(
    post.emotion as PostInputEmotion | null
  );

  const emotions: PostInputEmotion[] = ["sad", "angry", "lonely", "happy", "stressed", "grateful"];

  const handleSubmit = () => {
    if (!content.trim()) return;
    if (content.length > 2000) {
      toast({ title: "Too long", description: "Keep it under 2000 characters.", variant: "destructive" });
      return;
    }

    createPost.mutate(
      {
        data: {
          content: content.trim(),
          type: post.type,
          emotion: emotion || undefined,
          relatedToId: post.id,
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListPostsQueryKey() });
          toast({ title: "Your experience echoes in the void", description: "Someone out there feels exactly this." });
          setContent("");
          onClose();
        },
        onError: () => {
          toast({ title: "Something went wrong", description: "Could not send to the void.", variant: "destructive" });
        },
      }
    );
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed inset-x-0 bottom-0 z-50 bg-background rounded-t-3xl border-t border-border/50 max-w-2xl mx-auto"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
          >
            <div className="px-5 pt-5 pb-8 flex flex-col gap-4 max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-primary">
                  <Waves className="w-4 h-4" />
                  <span className="text-sm font-mono font-bold uppercase tracking-wider">I felt this too</span>
                </div>
                <button onClick={onClose} className="p-1.5 rounded-full hover:bg-muted text-muted-foreground transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-muted/30 border border-border/40 rounded-xl p-4">
                <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground/60 mb-2">Resonating with</p>
                <p className="text-sm text-muted-foreground/80 italic line-clamp-3 leading-relaxed">
                  "{post.content}"
                </p>
              </div>

              <div className="flex flex-col gap-1">
                <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground/60">
                  What happened to you?
                </p>
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Share your similar experience... no one will know it's you"
                  className="resize-none bg-transparent border border-border/40 rounded-xl text-base font-serif leading-relaxed placeholder:text-muted-foreground/30 focus-visible:ring-1 focus-visible:ring-primary/50 min-h-[120px] p-4"
                  autoFocus
                />
                <span className={cn("text-xs font-mono text-right transition-colors", content.length > 1800 ? "text-red-400" : "text-muted-foreground/30")}>
                  {content.length}/2000
                </span>
              </div>

              <div>
                <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground/60 mb-2">Emotion (optional)</p>
                <div className="flex flex-wrap gap-2">
                  {emotions.map((em) => (
                    <button
                      key={em}
                      onClick={() => setEmotion(emotion === em ? null : em)}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-xs font-mono font-bold uppercase transition-all border",
                        emotion === em
                          ? `bg-emotion-${em} emotion-glow-${em}`
                          : "bg-card border-border hover:bg-muted text-muted-foreground"
                      )}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>

              <Button
                onClick={handleSubmit}
                disabled={!content.trim() || createPost.isPending}
                className="w-full py-6 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-base shadow-[0_0_20px_rgba(168,85,247,0.3)] transition-all rounded-xl"
              >
                {createPost.isPending ? (
                  <span className="animate-pulse">Sending into the void...</span>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Release your echo
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
