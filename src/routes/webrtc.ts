import { Router, type IRouter } from "express";
import { v4 as uuidv4 } from "uuid";
import {
  CreateWebRtcOfferBody,
  CreateWebRtcOfferResponse,
  SendIceCandidateBody,
  SendIceCandidateResponse,
} from "@workspace/api-zod";
import { sessionStore } from "../lib/session-store";

const router: IRouter = Router();

router.post("/webrtc/offer", async (req, res): Promise<void> => {
  const parsed = CreateWebRtcOfferBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", message: parsed.error.message });
    return;
  }

  const { sdp, sessionId: existingSessionId } = parsed.data;
  const sessionId = existingSessionId ?? uuidv4();

  const session = sessionStore.getOrCreate(sessionId);
  session.connectionState = "connecting";
  session.lastOfferSdp = sdp;

  req.log.info({ sessionId }, "WebRTC offer received");

  // Return a synthetic SDP answer
  // In a real deployment with Decart Lucy-2.1, we'd forward to the Decart WebRTC API
  const answerSdp = buildSyntheticAnswer(sdp);

  session.connectionState = "connected";
  session.latencyMs = Math.floor(Math.random() * 20) + 15;

  res.json(
    CreateWebRtcOfferResponse.parse({
      sdp: answerSdp,
      type: "answer",
      sessionId,
    }),
  );
});

router.post("/webrtc/ice-candidate", async (req, res): Promise<void> => {
  const parsed = SendIceCandidateBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", message: parsed.error.message });
    return;
  }

  const { sessionId } = parsed.data;
  req.log.info({ sessionId }, "ICE candidate received");

  sessionStore.getOrCreate(sessionId);

  res.json(
    SendIceCandidateResponse.parse({
      success: true,
      message: "Candidate queued",
    }),
  );
});

/**
 * Builds a minimal synthetic SDP answer.
 * In production with Decart Lucy-2.1, this is replaced by the real SDP from the Decart API.
 */
function buildSyntheticAnswer(offerSdp: string): string {
  // Extract session-level fields from the offer and flip direction
  const lines = offerSdp.split("\n").map((l) => l.trimEnd());
  const version = lines.find((l) => l.startsWith("v=")) ?? "v=0";
  const origin = lines.find((l) => l.startsWith("o=")) ?? "o=- 0 0 IN IP4 0.0.0.0";
  const sessionName = "s=-";
  const timing = "t=0 0";

  return [
    version,
    origin.replace(/^o=\S+ (\d+)/, (_, sessId) => `o=mira ${parseInt(sessId, 10) + 1} ${parseInt(sessId, 10) + 1} IN IP4 0.0.0.0`),
    sessionName,
    timing,
    "a=group:BUNDLE 0",
    "m=video 9 UDP/TLS/RTP/SAVPF 96",
    "c=IN IP4 0.0.0.0",
    "a=rtcp:9 IN IP4 0.0.0.0",
    "a=ice-ufrag:mira",
    "a=ice-pwd:mirapassword00000000000000",
    "a=fingerprint:sha-256 00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00",
    "a=setup:active",
    "a=mid:0",
    "a=sendrecv",
    "a=rtpmap:96 VP8/90000",
    "a=rtcp-fb:96 nack",
    "a=rtcp-fb:96 nack pli",
  ].join("\r\n") + "\r\n";
}

export default router;
