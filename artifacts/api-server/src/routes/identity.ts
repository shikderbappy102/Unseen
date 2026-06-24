import { Router } from "express";
import { createHash } from "crypto";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { getAuth } from "@clerk/express";

const router = Router();

function ipToAnonNumber(ip: string): number {
  const hash = createHash("sha256").update(ip + "unseen-salt-v1").digest("hex");
  const num = parseInt(hash.slice(0, 8), 16);
  return (num % 90000) + 10000;
}

router.get("/", async (req, res) => {
  const auth = getAuth(req);

  if (auth?.userId) {
    const clerkUserId = auth.userId;

    const [existing] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.clerkUserId, clerkUserId));

    if (existing) {
      return res.json({ anonNumber: existing.anonNumber, type: "registered" });
    }

    let anonNumber: number;
    let attempts = 0;
    do {
      anonNumber = Math.floor(Math.random() * 90000) + 10000;
      attempts++;
      if (attempts > 50) break;
      const [taken] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.anonNumber, anonNumber));
      if (!taken) break;
    } while (true);

    const [user] = await db
      .insert(usersTable)
      .values({ clerkUserId, anonNumber: anonNumber! })
      .returning();

    return res.json({ anonNumber: user.anonNumber, type: "registered" });
  }

  const ip =
    (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
    req.socket.remoteAddress ||
    "unknown";

  const anonNumber = ipToAnonNumber(ip);
  return res.json({ anonNumber, type: "anonymous" });
});

export { router as identityRouter };
