import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Link } from "wouter";
import { Heart, MessageCircle, AlertTriangle, Share2, Waves } from "lucide-react";
import { Post, ReportInputReason } from "@workspace/api-client-react";
import { useToggleLike, useReportPost } from "@workspace/api-client-react";
import { useSession } from "@/hooks/use-session";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { getListPostsQueryKey, getGetPostQueryKey } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { ResonateDrawer } from "./ResonateDrawer";

export function PostCard({ post, isDetail = false }: { post: Post; isDetail?: boolean }) {
  const sessionId = useSession();
  const toggleLike = useToggleLike();
  const reportPost = useReportPost();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [resonateOpen, setResonateOpen] = useState(false);

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!sessionId) return;

    toggleLike.mutate(
      { id: post.id, data: { sessionId } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListPostsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetPostQueryKey(post.id) });
        },
      }
    );
  };

  const handleReport = (e: React.MouseEvent) => {
    e.preventDefault();
    if (confirm("Are you sure you want to report this?")) {
      reportPost.mutate(
        { id: post.id, data: { reason: ReportInputReason.other } },
        {
          onSuccess: () => {
            toast({ title: "Reported", description: "This whisper has been flagged to the void." });
          },
        }
      );
    }
  };

  const emotionClass = post.emotion ? `emotion-glow-${post.emotion}` : "";
  const bgEmotionClass = post.emotion ? `bg-emotion-${post.emotion}` : "";

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "p-5 rounded-2xl mb-4 transition-all duration-300 border border-border/50",
          post.type === "worst_experience" ? "type-worst_experience" : "bg-card hover:bg-card/80",
          isDetail ? "shadow-lg bg-card/90" : "hover:shadow-md"
        )}
      >
        <Link href={`/post/${post.id}`} className="block cursor-pointer">
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center gap-2">
              {post.type === "worst_experience" && (
                <span className="text-[10px] uppercase tracking-widest text-red-400 font-mono font-bold bg-red-500/10 px-2 py-1 rounded-md">
                  Worst Experience
                </span>
              )}
              {post.emotion && (
                <span className={cn("text-[10px] uppercase tracking-widest font-mono font-bold px-2 py-1 rounded-md border", emotionClass, bgEmotionClass)}>
                  {post.emotion}
                </span>
              )}
            </div>
            <span className="text-xs text-muted-foreground font-mono opacity-50">
              {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
            </span>
          </div>

          <p className={cn("text-foreground whitespace-pre-wrap leading-relaxed", isDetail ? "text-lg md:text-xl font-serif" : "text-base")}>
            {post.content}
          </p>
        </Link>

        <div className="flex items-center justify-between mt-5 pt-4 border-t border-border/30">
          <div className="flex gap-4">
            <button
              onClick={handleLike}
              className={cn("flex items-center gap-1.5 text-sm transition-colors", post.isLiked ? "text-primary" : "text-muted-foreground hover:text-foreground")}
            >
              <Heart className={cn("w-5 h-5 transition-transform", post.isLiked && "fill-primary scale-110")} />
              <span className="font-mono">{post.likeCount}</span>
            </button>
            <Link href={`/post/${post.id}`} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <MessageCircle className="w-5 h-5" />
              <span className="font-mono">{post.commentCount}</span>
            </Link>
          </div>

          <div className="flex gap-3 items-center">
            <button
              onClick={(e) => { e.preventDefault(); setResonateOpen(true); }}
              className="flex items-center gap-1.5 text-xs font-mono font-bold uppercase text-primary/60 hover:text-primary border border-primary/20 hover:border-primary/50 px-3 py-1.5 rounded-full transition-all hover:shadow-[0_0_10px_rgba(168,85,247,0.2)]"
            >
              <Waves className="w-3.5 h-3.5" />
              I felt this
            </button>
            <button
              className="text-muted-foreground hover:text-foreground transition-colors"
              onClick={(e) => {
                e.preventDefault();
                navigator.clipboard.writeText(window.location.origin + `/post/${post.id}`);
                toast({ title: "Copied link" });
              }}
            >
              <Share2 className="w-4 h-4 opacity-50 hover:opacity-100" />
            </button>
            <button onClick={handleReport} className="text-muted-foreground hover:text-destructive transition-colors">
              <AlertTriangle className="w-4 h-4 opacity-50 hover:opacity-100" />
            </button>
          </div>
        </div>
      </motion.div>

      <ResonateDrawer post={post} open={resonateOpen} onClose={() => setResonateOpen(false)} />
    </>
  );
}
