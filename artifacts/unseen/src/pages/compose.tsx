import { useState } from "react";
import { useLocation } from "wouter";
import { PenSquare, Send, X, AlertCircle } from "lucide-react";
import { useCreatePost } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { PostInputType, PostInputEmotion } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { getListPostsQueryKey } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

export default function Compose() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createPost = useCreatePost();
  
  const [content, setContent] = useState("");
  const [type, setType] = useState<PostInputType>(PostInputType.thought);
  const [emotion, setEmotion] = useState<PostInputEmotion | null>(null);

  const emotions: PostInputEmotion[] = ["sad", "angry", "lonely", "happy", "stressed", "grateful"];

  const handleSubmit = () => {
    if (!content.trim()) return;
    if (content.length > 2000) {
      toast({ title: "Too long", description: "The void can only hold 2000 characters at once.", variant: "destructive" });
      return;
    }

    createPost.mutate({
      data: {
        content: content.trim(),
        type,
        emotion: emotion || undefined
      }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListPostsQueryKey() });
        setLocation("/");
        toast({ title: "Whispered into the void", description: "Your thought is safe here." });
      },
      onError: () => {
        toast({ title: "Something went wrong", description: "Could not send to the void.", variant: "destructive" });
      }
    });
  };

  return (
    <div className="min-h-screen flex flex-col px-4 pt-6 pb-24 bg-background">
      <header className="flex items-center justify-between mb-8">
        <button onClick={() => setLocation("/")} className="p-2 -ml-2 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted transition-colors">
          <X className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-serif text-muted-foreground">Confess</h1>
        <Button 
          onClick={handleSubmit} 
          disabled={!content.trim() || createPost.isPending}
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-[0_0_15px_rgba(168,85,247,0.3)] transition-all"
        >
          {createPost.isPending ? <PenSquare className="w-4 h-4 mr-2 animate-pulse" /> : <Send className="w-4 h-4 mr-2" />}
          Release
        </Button>
      </header>

      <div className="flex-1 flex flex-col max-w-2xl w-full mx-auto">
        <div className="mb-6 flex gap-2 p-1 bg-muted/30 rounded-xl w-fit border border-border/50">
          <button 
            onClick={() => setType(PostInputType.thought)}
            className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-all", type === PostInputType.thought ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}
          >
            A Thought
          </button>
          <button 
            onClick={() => setType(PostInputType.worst_experience)}
            className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5", type === PostInputType.worst_experience ? "bg-red-500/10 text-red-400 border border-red-500/20" : "text-muted-foreground hover:text-red-400/70")}
          >
            <AlertCircle className="w-4 h-4" />
            Worst Experience
          </button>
        </div>

        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={type === PostInputType.worst_experience ? "What's the worst thing that happened today? Let it out..." : "What's weighing heavily on your mind right now? No one will know it's you..."}
          className="flex-1 resize-none bg-transparent border-none shadow-none text-xl md:text-2xl font-serif leading-relaxed placeholder:text-muted-foreground/30 focus-visible:ring-0 p-0 mb-6"
          autoFocus
        />

        <div className="mt-auto pt-6 border-t border-border/30">
          <p className="text-xs text-muted-foreground mb-3 font-mono uppercase tracking-wider">Tag an emotion (optional)</p>
          <div className="flex flex-wrap gap-2">
            {emotions.map((em) => (
              <button
                key={em}
                onClick={() => setEmotion(emotion === em ? null : em)}
                className={cn(
                  "px-4 py-2 rounded-full text-xs font-mono font-bold uppercase transition-all border",
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
      </div>
    </div>
  );
}
