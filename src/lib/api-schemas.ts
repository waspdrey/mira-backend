import { z } from "zod";

const ConnectionState = z.enum(["idle", "connecting", "connected", "disconnected", "failed"]);
const ApiStatus = z.enum(["unconfigured", "ready", "processing", "error"]);

export const HealthCheckResponse = z.object({
  status: z.literal("ok"),
});

export const CreateWebRtcOfferBody = z.object({
  sdp: z.string().min(1),
  type: z.string().optional(),
  sessionId: z.string().optional(),
});

export const CreateWebRtcOfferResponse = z.object({
  sdp: z.string(),
  type: z.literal("answer"),
  sessionId: z.string(),
});

export const SendIceCandidateBody = z.object({
  sessionId: z.string().min(1),
  candidate: z.string().optional(),
});

export const SendIceCandidateResponse = z.object({
  success: z.boolean(),
  message: z.string(),
});

export const GetSessionStatusResponse = z.object({
  sessionId: z.string().nullable(),
  connectionState: ConnectionState,
  transformEnabled: z.boolean(),
  apiStatus: ApiStatus,
  latencyMs: z.number().nullable(),
  referenceImageSet: z.boolean(),
  decartApiConfigured: z.boolean(),
});

export const ToggleTransformBody = z.object({
  enabled: z.boolean(),
  sessionId: z.string().optional(),
});

export const ToggleTransformResponse = GetSessionStatusResponse;

export const UploadReferenceImageBody = z.object({
  imageData: z.string().min(1),
  filename: z.string().optional(),
});

export const UploadReferenceImageResponse = z.object({
  success: z.boolean(),
  message: z.string(),
});
