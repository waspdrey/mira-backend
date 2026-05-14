import { Router, type IRouter } from "express";
import { requireAccessKey } from "../middlewares/auth";
import authRouter from "./auth";
import healthRouter from "./health";
import webrtcRouter from "./webrtc";
import sessionRouter from "./session";
import tokenRouter from "./token";
import outputStreamRouter from "./output-stream";

const router: IRouter = Router();

// Public routes (no auth required)
router.use(authRouter); // Includes /auth/validate
router.use(healthRouter);

// Protected routes (auth required)
router.use(requireAccessKey);
router.use(webrtcRouter);
router.use(sessionRouter);
router.use(tokenRouter);
router.use(outputStreamRouter);

export default router;
