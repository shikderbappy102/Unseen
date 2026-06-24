import { Router } from "express";
import { db, postsTable } from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";
import { GetTrendingQueryParams } from "@workspace/api-zod";

function formatPost(post: typeof postsTable.$inferSelect) {
  return {
    id: post.id,
    content: post.content,
    type: post.type,
    emotion: post.emotion ?? null,
    likeCount: post.likeCount,
    commentCount: post.commentCount,
    isLiked: false,
    isReported: false,
    createdAt: post.createdAt.toISOString(),
  };
}

function periodFilter(period: string) {
  if (period === "today") {
    return sql`${postsTable.createdAt} >= NOW() - INTERVAL '24 hours'`;
  } else if (period === "week") {
    return sql`${postsTable.createdAt} >= NOW() - INTERVAL '7 days'`;
  }
  return sql`1=1`;
}

export const trendingRouter = Router();

// GET /trending
trendingRouter.get("/", async (req, res) => {
  const parsed = GetTrendingQueryParams.safeParse(req.query);
  const period = parsed.success ? (parsed.data.period ?? "today") : "today";
  const filter = periodFilter(period);

  const [mostLiked, mostCommented, mostRelatable] = await Promise.all([
    db
      .select()
      .from(postsTable)
      .where(sql`${filter} AND ${postsTable.isHidden} = false`)
      .orderBy(desc(postsTable.likeCount), desc(postsTable.id))
      .limit(10),
    db
      .select()
      .from(postsTable)
      .where(sql`${filter} AND ${postsTable.isHidden} = false`)
      .orderBy(desc(postsTable.commentCount), desc(postsTable.id))
      .limit(10),
    db
      .select()
      .from(postsTable)
      .where(sql`${filter} AND ${postsTable.isHidden} = false`)
      .orderBy(
        desc(sql`${postsTable.likeCount} + ${postsTable.commentCount} * 2`),
        desc(postsTable.id),
      )
      .limit(10),
  ]);

  return res.json({
    mostLiked: mostLiked.map(formatPost),
    mostCommented: mostCommented.map(formatPost),
    mostRelatable: mostRelatable.map(formatPost),
  });
});
