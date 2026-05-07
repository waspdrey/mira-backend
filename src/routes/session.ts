import { Router, type IRouter } from "express";
import {
  GetSessionStatusResponse,
  ToggleTransformBody,
  ToggleTransformResponse,
  UploadReferenceImageBody,
  UploadReferenceImageResponse,
} from "../lib/api-schemas";
import { sessionStore } from "../lib/session-store";

const router: IRouter = Router();

router.get("/session/status", async (req, res): Promise<void> => {
  const sessions = sessionStore.getAll();
  const latest = sessions.length > 0 ? sessions[sessions.length - 1] : null;

  const decartConfigured = Boolean(process.env["DECART_API_KEY"]);

  res.json(
    GetSessionStatusResponse.parse({
      sessionId: latest?.id ?? null,
      connectionState: latest?.connectionState ?? "idle",
      transformEnabled: latest?.transformEnabled ?? false,
      apiStatus: decartConfigured ? (latest?.connectionState === "connected" ? "ready" : "ready") : "unconfigured",
      latencyMs: latest?.latencyMs ?? null,
      referenceImageSet: latest?.referenceImageSet ?? false,
      decartApiConfigured: decartConfigured,
    }),
  );
});

router.post("/session/transform", async (req, res): Promise<void> => {
  const parsed = ToggleTransformBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", message: parsed.error.message });
    return;
  }

  const { enabled, sessionId } = parsed.data;
  const decartConfigured = Boolean(process.env["DECART_API_KEY"]);

  let session = sessionId ? sessionStore.get(sessionId) : sessionStore.getLatest();

  if (!session) {
    const id = sessionId ?? "default";
    session = sessionStore.getOrCreate(id);
  }

  session.transformEnabled = enabled;

  if (enabled && session.connectionState === "connected") {
    session.apiStatus = decartConfigured ? "processing" : "unconfigured";
  } else if (!enabled) {
    session.apiStatus = decartConfigured ? "ready" : "unconfigured";
  }

  req.log.info({ sessionId: session.id, enabled }, "Transform toggled");

  res.json(
    ToggleTransformResponse.parse({
      sessionId: session.id,
      connectionState: session.connectionState,
      transformEnabled: session.transformEnabled,
      apiStatus: decartConfigured ? session.apiStatus : "unconfigured",
      latencyMs: session.latencyMs ?? null,
      referenceImageSet: session.referenceImageSet,
      decartApiConfigured: decartConfigured,
    }),
  );
});

router.post("/session/reference-image", async (req, res): Promise<void> => {
  const parsed = UploadReferenceImageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", message: parsed.error.message });
    return;
  }

  const { imageData } = parsed.data;

  if (!imageData.startsWith("data:image/")) {
    res.status(400).json({ error: "invalid_image", message: "imageData must be a valid data URI" });
    return;
  }

  // Get or create latest session
  let session = sessionStore.getLatest();
  if (!session) {
    session = sessionStore.getOrCreate("default");
  }

  // Store the reference image in the session
  session.referenceImageData = imageData;
  session.referenceImageSet = true;

  req.log.info({ sessionId: session.id }, "Reference image uploaded");

  res.json(
    UploadReferenceImageResponse.parse({
      success: true,
      message: "Reference image stored successfully",
    }),
  );
});

export default router;
