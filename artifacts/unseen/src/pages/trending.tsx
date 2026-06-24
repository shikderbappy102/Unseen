import { useState } from "react";
import { useGetTrending, getGetTrendingQueryKey, useGetStats, getGetStatsQueryKey } from "@workspace/api-client-react";
import { PostCard } from "@/components/post/PostCard";
import { Flame, MessageCircle, Heart, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Trending() {
  const [period, setPeriod] = useState<"today" | "week" | "all">("today");
  const [category, setCategory] = useState<"mostRelatable" | "mostLiked" | "mostCommented">("mostRelatable");

  const { data: trending, isLoading: trendingLoading } = useGetTrending(
    { period },
    { query: { queryKey: getGetTrendingQueryKey({ period }) } }
  );

  const { data: stats } = useGetStats({
    query: { queryKey: getGetStatsQueryKey() }
  });

  const posts = trending ? trending[category] : [];

  return (
    <div className="pt-6 pb-24 px-4">
      <header className="mb-8 mt-2">
        <h1 className="text-3xl font-serif font-bold tracking-tighter text-orange-500 flex items-center gap-2 drop-shadow-[0_0_15px_rgba(249,115,22,0.4)]">
          <Flame className="w-8 h-8" />
          Trending
        </h1>
        <p className="text-muted-foreground mt-2 text-sm">The loudest whispers in the void.</p>
      </header>

      {stats && (
        <div className="mb-10 grid grid-cols-3 gap-3">
          <div className="bg-card border border-border/50 rounded-xl p-4 text-center">
            <div className="text-2xl font-mono font-bold text-foreground">{stats.totalPosts}</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Echoes</div>
          </div>
          <div className="bg-card border border-border/50 rounded-xl p-4 text-center">
            <div className="text-2xl font-mono font-bold text-primary">{stats.totalLikes}</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Hearts</div>
          </div>
          <div className="bg-card border border-border/50 rounded-xl p-4 text-center">
            <div className="text-2xl font-mono font-bold text-blue-400">{stats.totalComments}</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Voices</div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div className="flex bg-muted/30 p-1 rounded-lg border border-border/50">
          <button
            onClick={() => setPeriod("today")}
            className={cn("px-3 py-1.5 text-xs font-medium rounded-md transition-colors", period === "today" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground")}
          >
            Today
          </button>
          <button
            onClick={() => setPeriod("week")}
            className={cn("px-3 py-1.5 text-xs font-medium rounded-md transition-colors", period === "week" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground")}
          >
            Week
          </button>
          <button
            onClick={() => setPeriod("all")}
            className={cn("px-3 py-1.5 text-xs font-medium rounded-md transition-colors", period === "all" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground")}
          >
            All Time
          </button>
        </div>
      </div>

      <div className="flex overflow-x-auto gap-3 pb-4 mb-2 scrollbar-hide">
        <button
          onClick={() => setCategory("mostRelatable")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-full border transition-all whitespace-nowrap",
            category === "mostRelatable" ? "bg-primary/20 border-primary/30 text-primary shadow-[0_0_10px_rgba(168,85,247,0.2)]" : "bg-card border-border/50 text-muted-foreground hover:bg-muted"
          )}
        >
          <Flame className="w-4 h-4" />
          Most Relatable
        </button>
        <button
          onClick={() => setCategory("mostLiked")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-full border transition-all whitespace-nowrap",
            category === "mostLiked" ? "bg-pink-500/20 border-pink-500/30 text-pink-500 shadow-[0_0_10px_rgba(236,72,153,0.2)]" : "bg-card border-border/50 text-muted-foreground hover:bg-muted"
          )}
        >
          <Heart className="w-4 h-4" />
          Most Loved
        </button>
        <button
          onClick={() => setCategory("mostCommented")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-full border transition-all whitespace-nowrap",
            category === "mostCommented" ? "bg-blue-500/20 border-blue-500/30 text-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.2)]" : "bg-card border-border/50 text-muted-foreground hover:bg-muted"
          )}
        >
          <MessageCircle className="w-4 h-4" />
          Most Discussed
        </button>
      </div>

      <div className="space-y-4">
        {trendingLoading ? (
           <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary opacity-50" /></div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground italic font-serif">
            No echoes found for this period.
          </div>
        ) : (
          posts.map((post) => <PostCard key={post.id} post={post} />)
        )}
      </div>
    </div>
  );
}
