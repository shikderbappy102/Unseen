import { pgTable, text, integer, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const likesTable = pgTable("likes", {
  id: text("id").primaryKey(), // composite: postId_sessionId
  postId: integer("post_id").notNull(),
  sessionId: text("session_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("likes_post_session_idx").on(table.postId, table.sessionId),
]);

export const insertLikeSchema = createInsertSchema(likesTable).omit({ createdAt: true });
export type InsertLike = z.infer<typeof insertLikeSchema>;
export type Like = typeof likesTable.$inferSelect;
