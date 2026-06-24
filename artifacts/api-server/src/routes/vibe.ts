import { Router } from "express";
import OpenAI from "openai";

const router = Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

router.post("/", async (req, res) => {
  const { feeling } = req.body as { feeling?: string };
  if (!feeling || typeof feeling !== "string" || feeling.trim().length < 3) {
    return res.status(400).json({ error: "Please describe how you're feeling." });
  }

  const prompt = `You are an empathetic creative writer who specializes in emotional reflection. 
A person described what's going on inside them: "${feeling.slice(0, 500)}"

Write a short, vivid "mind portrait" (3-5 sentences) — an imaginative reflection of their inner world, like painting a picture of what's happening inside their head. 
Do NOT try to fix, advise, or cheer them up. Just see them. 
Describe their inner state as a surreal landscape, a strange metaphor, or a fleeting scene — something that makes them feel deeply understood, like someone finally named the exact thing they couldn't name.
End with one quiet, honest line — not advice, not positivity, just a small true observation.
No lists. No bullet points. Just flowing, poetic prose.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 300,
      messages: [{ role: "user", content: prompt }],
    });

    const sketch = completion.choices[0]?.message?.content ?? "";
    if (!sketch) {
      return res.status(500).json({ error: "No response generated. Try again." });
    }
    return res.json({ sketch });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    req.log.error({ err, msg }, "OpenAI vibe error");
    return res.status(500).json({ error: "Couldn't connect right now. Try again in a moment." });
  }
});

export { router as vibeRouter };
