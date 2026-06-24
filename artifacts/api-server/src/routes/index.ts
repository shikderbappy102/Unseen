import { Router, type IRouter } from "express";
import healthRouter from "./health";
import { postsRouter } from "./posts";
import { trendingRouter } from "./trending";
import { statsRouter } from "./stats";
import { identityRouter } from "./identity";
import { vibeRouter } from "./vibe";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/posts", postsRouter);
router.use("/trending", trendingRouter);
router.use("/stats", statsRouter);
router.use("/identity", identityRouter);
router.use("/vibe", vibeRouter);

export default router;
