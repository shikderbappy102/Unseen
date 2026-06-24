import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useGetPost, useListComments, useCreateComment, getListCommentsQueryKey, getGetPostQueryKey } from "@workspace/api-client-react";
import { PostCard } from "@/components/post/PostCard";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ChevronLeft, Send, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function PostDetail() {
  const { id } = useParams();
  const postId = Number(id);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: post, isLoading: postLoading, error: postError } = useGetPost(postId, {
    query: { enabled: !!postId, queryKey: getGetPostQueryKey(postId) }
  });

  const { data: comments, isLoading: commentsLoading } = useListComments(postId, {
    query: { enabled: !!postId, queryKey: getListCommentsQueryKey(postId) }
  });

  const createComment = useCreateComment();
  const [commentContent, setCommentContent] = useState("");

  const handleCommentSubmit = () => {
    if (!commentContent.trim()) return;

    createComment.mutate({
      id: postId,
      data: { content: commentContent.trim() }
    }, {
      onSuccess: () => {
        setCommentContent("");
        queryClient.invalidateQueries({ queryKey: getListCommentsQueryKey(postId) });
        queryClient.invalidateQueries({ queryKey: getGetPostQueryKey(postId) });
        toast({ title: "Whisper added", description: "Your voice joins the void." });
      },
      onError: () => {
        toast({ title: "Failed to add whisper", variant: "destructive" });
      }
    });
  };

  if (postLoading) {
    return <div className="flex justify-center p-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (postError || !post) {
    return (
      <div className="p-10 text-center">
        <h2 className="text-xl font-serif mb-4">Post not found</h2>
        <Button onClick={() => setLocation("/")} variant="outline">Return to void</Button>
      </div>
    );
  }

  return (
    <div className="pt-6 pb-32 px-4 max-w-2xl mx-auto">
      <header className="mb-6">
        <button onClick={() => setLocation("/")} className="flex items-center text-muted-foreground hover:text-foreground transition-colors text-sm">
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back to Feed
        </button>
      </header>

      <PostCard post={post} isDetail={true} />

      <div className="mt-10">
        <h3 className="text-sm font-mono text-muted-foreground uppercase tracking-widest mb-6 border-b border-border/50 pb-2">Voices in the dark ({post.commentCount})</h3>

        <div className="space-y-6 mb-10">
          {commentsLoading ? (
             <div className="flex justify-center p-4"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground opacity-50" /></div>
          ) : comments?.length === 0 ? (
            <p className="text-muted-foreground/50 italic font-serif text-center py-6">It is quiet here. Be the first to answer.</p>
          ) : (
            comments?.map((comment) => (
              <div key={comment.id} className="pl-4 border-l border-border/30">
                <p className="text-foreground/90 font-serif leading-relaxed mb-2">{comment.content}</p>
                <span className="text-[10px] text-muted-foreground/50 font-mono">
                  {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 md:static md:w-full bg-background/90 backdrop-blur-xl border-t border-border/50 md:border-none p-4 md:p-0 z-40">
        <div className="max-w-2xl mx-auto md:bg-card md:border md:border-border/50 md:rounded-2xl p-2 flex gap-2 items-end">
          <Textarea 
            value={commentContent}
            onChange={(e) => setCommentContent(e.target.value)}
            placeholder="Add a gentle whisper..."
            className="min-h-[50px] max-h-[150px] resize-none bg-transparent border-none focus-visible:ring-0 shadow-none text-base"
          />
          <Button 
            onClick={handleCommentSubmit}
            disabled={!commentContent.trim() || createComment.isPending}
            size="icon"
            className="h-10 w-10 shrink-0 bg-primary/20 text-primary hover:bg-primary hover:text-primary-foreground rounded-xl mb-1 mr-1"
          >
            {createComment.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
