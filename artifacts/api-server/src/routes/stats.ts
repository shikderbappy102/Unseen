import { Router } from "express";
import { db, postsTable } from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";

export const statsRouter = Router();

// GET /stats
statsRouter.get("/", async (_req, res) => {
  const [totals] = await db
    .select({
      totalPosts: sql<number>`COUNT(*)::int`,
      totalLikes: sql<number>`COALESCE(SUM(${postsTable.likeCount}), 0)::int`,
      totalComments: sql<number>`COALESCE(SUM(${postsTable.commentCount}), 0)::int`,
    })
    .from(postsTable)
    .where(eq(postsTable.isHidden, false));

  const emotionRows = await db
    .select({
      emotion: postsTable.emotion,
      count: sql<number>`COUNT(*)::int`,
    })
    .from(postsTable)
    .where(sql`${postsTable.isHidden} = false AND ${postsTable.emotion} IS NOT NULL`)
    .groupBy(postsTable.emotion)
    .orderBy(desc(sql`COUNT(*)`));

  return res.json({
    totalPosts: totals?.totalPosts ?? 0,
    totalLikes: totals?.totalLikes ?? 0,
    totalComments: totals?.totalComments ?? 0,
    emotionBreakdown: emotionRows.map((r) => ({ emotion: r.emotion!, count: r.count })),
  });
});
