import { Router, type IRouter } from "express";
import healthRouter from "./health";
import webrtcRouter from "./webrtc";
import sessionRouter from "./session";
import tokenRouter from "./token";
import outputStreamRouter from "./output-stream";

const router: IRouter = Router();

router.use(healthRouter);
router.use(webrtcRouter);
router.use(sessionRouter);
router.use(tokenRouter);
router.use(outputStreamRouter);

export default router;
