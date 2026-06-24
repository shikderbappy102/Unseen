import { useState, useRef, useEffect, useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Filter, Loader2, Waves } from "lucide-react";
import { listPosts, getListPostsQueryKey } from "@workspace/api-client-react";
import { PostCard } from "@/components/post/PostCard";
import { useIntersectionObserver } from "@/hooks/use-intersection-observer";
import { cn } from "@/lib/utils";

export default function Home() {
  const [emotionFilter, setEmotionFilter] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<"thought" | "worst_experience" | null>(null);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading
  } = useInfiniteQuery({
    queryKey: [...getListPostsQueryKey({ emotion: emotionFilter, type: typeFilter }), "infinite"],
    queryFn: ({ pageParam }) => listPosts({
      ...(emotionFilter ? { emotion: emotionFilter } : {}),
      ...(typeFilter ? { type: typeFilter } : {}),
      ...(pageParam != null ? { cursor: pageParam as number } : {}),
    }),
    initialPageParam: null as number | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? null,
  });

  const loadMoreRef = useRef<HTMLDivElement>(null);
  const isIntersecting = useIntersectionObserver(loadMoreRef, { threshold: 0.1 });

  useEffect(() => {
    if (isIntersecting && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [isIntersecting, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const posts = useMemo(() => {
    return data?.pages.flatMap((page) => page.posts) ?? [];
  }, [data]);

  const emotions = ["sad", "angry", "lonely", "happy", "stressed", "grateful"];

  const isFirstVisit = !localStorage.getItem("unseen_has_read_feed");
  if (isFirstVisit) localStorage.setItem("unseen_has_read_feed", "1");

  return (
    <div className="pt-6 pb-24 px-4">
      <header className="mb-6 mt-2 flex items-center justify-between">
        <h1 className="text-3xl font-serif font-bold tracking-tighter text-primary drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]">UNSEEN</h1>
        <p className="text-xs font-mono text-muted-foreground/50 uppercase tracking-wider">Tap to resonate</p>
      </header>

      {isFirstVisit && (
        <div className="mb-6 rounded-2xl bg-primary/5 border border-primary/15 px-5 py-4 flex items-start gap-3">
          <span className="text-lg mt-0.5">👁️</span>
          <div>
            <p className="text-sm font-medium text-foreground mb-0.5">You're completely anonymous here.</p>
            <p className="text-xs text-muted-foreground leading-relaxed">Read what others feel. Tap the ✏️ button below to share your own — no name, no face, no judgment.</p>
          </div>
        </div>
      )}

      <div className="mb-6 space-y-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/50 text-xs font-medium text-muted-foreground mr-2 shrink-0">
            <Filter className="w-3 h-3" />
            Filters
          </div>
          
          <button
            onClick={() => setTypeFilter(typeFilter === "worst_experience" ? null : "worst_experience")}
            className={cn(
              "shrink-0 px-3 py-1.5 rounded-full text-xs font-mono font-bold transition-all border",
              typeFilter === "worst_experience" 
                ? "bg-red-500/20 border-red-500/30 text-red-400" 
                : "bg-card border-border hover:bg-muted text-muted-foreground"
            )}
          >
            WORST EXPERIENCE
          </button>

          {emotions.map((em) => (
            <button
              key={em}
              onClick={() => setEmotionFilter(emotionFilter === em ? null : em)}
              className={cn(
                "shrink-0 px-3 py-1.5 rounded-full text-xs font-mono font-bold uppercase transition-all border",
                emotionFilter === em 
                  ? `bg-emotion-${em} emotion-glow-${em}` 
                  : "bg-card border-border hover:bg-muted text-muted-foreground"
              )}
            >
              {em}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="flex flex-col gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 bg-card/50 rounded-2xl animate-pulse border border-border/50" />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20 px-4">
            <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center mb-4 opacity-50">
              <Waves className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-serif mb-2">The void is quiet.</h3>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto">No voices found matching these whispers. Be the first to speak into the dark.</p>
          </div>
        ) : (
          posts.map((post) => <PostCard key={post.id} post={post} />)
        )}
      </div>

      <div ref={loadMoreRef} className="py-8 flex justify-center">
        {isFetchingNextPage && <Loader2 className="w-6 h-6 animate-spin text-primary opacity-50" />}
      </div>
    </div>
  );
}
