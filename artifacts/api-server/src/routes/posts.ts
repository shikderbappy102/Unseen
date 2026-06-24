import { Router } from "express";
import { db, postsTable, commentsTable, likesTable, reportsTable } from "@workspace/db";
import { eq, desc, lt, and, sql } from "drizzle-orm";
import {
  CreatePostBody,
  ListPostsQueryParams,
  GetPostParams,
  ToggleLikeBody,
  ToggleLikeParams,
  ListCommentsParams,
  CreateCommentBody,
  CreateCommentParams,
  ReportPostBody,
  ReportPostParams,
  GetTrendingQueryParams,
} from "@workspace/api-zod";

const BLOCKED_WORDS = ["kill yourself", "kys", "go die", "suicide method"];

function containsBlockedContent(text: string): boolean {
  const lower = text.toLowerCase();
  return BLOCKED_WORDS.some((w) => lower.includes(w));
}

function formatPost(post: typeof postsTable.$inferSelect, isLiked = false) {
  return {
    id: post.id,
    content: post.content,
    type: post.type,
    emotion: post.emotion ?? null,
    relatedToId: post.relatedToId ?? null,
    likeCount: post.likeCount,
    commentCount: post.commentCount,
    isLiked,
    isReported: false,
    createdAt: post.createdAt.toISOString(),
  };
}

const router = Router();

// GET /posts — paginated feed
router.get("/", async (req, res) => {
  const parsed = ListPostsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid query params" });
  }
  const { cursor, limit = 20, emotion, type } = parsed.data;

  const conditions = [eq(postsTable.isHidden, false)];
  if (cursor) conditions.push(lt(postsTable.id, cursor));
  if (emotion) conditions.push(eq(postsTable.emotion, emotion));
  if (type) conditions.push(eq(postsTable.type, type));

  const sessionId = req.headers["x-session-id"] as string | undefined;

  const posts = await db
    .select()
    .from(postsTable)
    .where(and(...conditions))
    .orderBy(desc(postsTable.id))
    .limit(limit + 1);

  const hasMore = posts.length > limit;
  const items = hasMore ? posts.slice(0, limit) : posts;

  let likedIds = new Set<number>();
  if (sessionId && items.length > 0) {
    const ids = items.map((p) => p.id);
    const likes = await db
      .select({ postId: likesTable.postId })
      .from(likesTable)
      .where(
        and(
          eq(likesTable.sessionId, sessionId),
          sql`${likesTable.postId} = ANY(${sql.raw(`ARRAY[${ids.join(",")}]::integer[]`)})`,
        ),
      );
    likedIds = new Set(likes.map((l) => l.postId));
  }

  return res.json({
    posts: items.map((p) => formatPost(p, likedIds.has(p.id))),
    hasMore,
    nextCursor: hasMore ? items[items.length - 1].id : null,
  });
});

// POST /posts — create anonymous post
router.post("/", async (req, res) => {
  const parsed = CreatePostBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid input" });
  }
  const { content, type, emotion } = parsed.data;

  if (containsBlockedContent(content)) {
    return res.status(400).json({ error: "Content violates community guidelines" });
  }

  const relatedToId = (parsed.data as { relatedToId?: number | null }).relatedToId ?? null;

  const [post] = await db
    .insert(postsTable)
    .values({ content, type, emotion: emotion ?? null, relatedToId })
    .returning();

  return res.status(201).json(formatPost(post));
});

// GET /posts/:id
router.get("/:id", async (req, res) => {
  const parsed = GetPostParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) return res.status(400).json({ error: "Invalid id" });

  const sessionId = req.headers["x-session-id"] as string | undefined;

  const [post] = await db
    .select()
    .from(postsTable)
    .where(and(eq(postsTable.id, parsed.data.id), eq(postsTable.isHidden, false)));

  if (!post) return res.status(404).json({ error: "Post not found" });

  let isLiked = false;
  if (sessionId) {
    const [like] = await db
      .select()
      .from(likesTable)
      .where(and(eq(likesTable.postId, post.id), eq(likesTable.sessionId, sessionId)));
    isLiked = !!like;
  }

  return res.json(formatPost(post, isLiked));
});

// POST /posts/:id/like — toggle like
router.post("/:id/like", async (req, res) => {
  const paramParsed = ToggleLikeParams.safeParse({ id: Number(req.params.id) });
  if (!paramParsed.success) return res.status(400).json({ error: "Invalid id" });

  const bodyParsed = ToggleLikeBody.safeParse(req.body);
  if (!bodyParsed.success) return res.status(400).json({ error: "Invalid body" });

  const { id } = paramParsed.data;
  const { sessionId } = bodyParsed.data;

  const [post] = await db.select().from(postsTable).where(eq(postsTable.id, id));
  if (!post) return res.status(404).json({ error: "Post not found" });

  const likeId = `${id}_${sessionId}`;
  const [existingLike] = await db.select().from(likesTable).where(eq(likesTable.id, likeId));

  let newCount: number;
  let isLiked: boolean;

  if (existingLike) {
    await db.delete(likesTable).where(eq(likesTable.id, likeId));
    await db
      .update(postsTable)
      .set({ likeCount: Math.max(0, post.likeCount - 1) })
      .where(eq(postsTable.id, id));
    newCount = Math.max(0, post.likeCount - 1);
    isLiked = false;
  } else {
    await db.insert(likesTable).values({ id: likeId, postId: id, sessionId });
    await db
      .update(postsTable)
      .set({ likeCount: post.likeCount + 1 })
      .where(eq(postsTable.id, id));
    newCount = post.likeCount + 1;
    isLiked = true;
  }

  return res.json({ likeCount: newCount, isLiked });
});

// GET /posts/:id/comments
router.get("/:id/comments", async (req, res) => {
  const parsed = ListCommentsParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) return res.status(400).json({ error: "Invalid id" });

  const comments = await db
    .select()
    .from(commentsTable)
    .where(eq(commentsTable.postId, parsed.data.id))
    .orderBy(desc(commentsTable.createdAt));

  return res.json(
    comments.map((c) => ({
      id: c.id,
      postId: c.postId,
      content: c.content,
      createdAt: c.createdAt.toISOString(),
    })),
  );
});

// POST /posts/:id/comments
router.post("/:id/comments", async (req, res) => {
  const paramParsed = CreateCommentParams.safeParse({ id: Number(req.params.id) });
  if (!paramParsed.success) return res.status(400).json({ error: "Invalid id" });

  const bodyParsed = CreateCommentBody.safeParse(req.body);
  if (!bodyParsed.success) return res.status(400).json({ error: "Invalid body" });

  const { id } = paramParsed.data;
  const { content } = bodyParsed.data;

  if (containsBlockedContent(content)) {
    return res.status(400).json({ error: "Content violates community guidelines" });
  }

  const [post] = await db.select().from(postsTable).where(eq(postsTable.id, id));
  if (!post) return res.status(404).json({ error: "Post not found" });

  const [comment] = await db
    .insert(commentsTable)
    .values({ postId: id, content })
    .returning();

  await db
    .update(postsTable)
    .set({ commentCount: post.commentCount + 1 })
    .where(eq(postsTable.id, id));

  return res.status(201).json({
    id: comment.id,
    postId: comment.postId,
    content: comment.content,
    createdAt: comment.createdAt.toISOString(),
  });
});

// POST /posts/:id/report
router.post("/:id/report", async (req, res) => {
  const paramParsed = ReportPostParams.safeParse({ id: Number(req.params.id) });
  if (!paramParsed.success) return res.status(400).json({ error: "Invalid id" });

  const bodyParsed = ReportPostBody.safeParse(req.body);
  if (!bodyParsed.success) return res.status(400).json({ error: "Invalid body" });

  const { id } = paramParsed.data;
  const { reason } = bodyParsed.data;

  const [post] = await db.select().from(postsTable).where(eq(postsTable.id, id));
  if (!post) return res.status(404).json({ error: "Post not found" });

  await db.insert(reportsTable).values({ postId: id, reason });

  const newReportCount = post.reportCount + 1;
  const updates: Partial<typeof postsTable.$inferInsert> = { reportCount: newReportCount };

  if (newReportCount >= 5) {
    (updates as { isHidden: boolean }).isHidden = true;
  }

  await db.update(postsTable).set(updates).where(eq(postsTable.id, id));

  return res.json({ success: true, message: "Report submitted. Thank you for keeping UNSEEN safe." });
});

export { router as postsRouter };
