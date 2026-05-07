import { Router, type IRouter } from "express";
import { outputStreamStore } from "../lib/output-stream-store";

const router: IRouter = Router();

const BOUNDARY = "mira-frame";
const FRAME_INTERVAL_MS = 100;

function decodeDataUriToJpeg(dataUri: string): Buffer | null {
  const match = dataUri.match(/^data:image\/(?:jpeg|jpg);base64,(.+)$/i);
  if (!match) return null;

  try {
    return Buffer.from(match[1], "base64");
  } catch {
    return null;
  }
}

router.post("/output/frame", (req, res): void => {
  const imageData = req.body?.imageData;
  if (typeof imageData !== "string") {
    res.status(400).json({ error: "invalid_request", message: "imageData string is required" });
    return;
  }

  const jpeg = decodeDataUriToJpeg(imageData);
  if (!jpeg) {
    res.status(400).json({ error: "invalid_request", message: "imageData must be a JPEG data URI" });
    return;
  }

  outputStreamStore.setFrame(jpeg);
  res.status(204).end();
});

router.get("/output/mjpeg", (_req, res): void => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Content-Type", `multipart/x-mixed-replace; boundary=${BOUNDARY}`);

  const timer = setInterval(() => {
    const frame = outputStreamStore.getFrame();
    if (!frame) return;

    res.write(`--${BOUNDARY}\r\n`);
    res.write("Content-Type: image/jpeg\r\n");
    res.write(`Content-Length: ${frame.jpeg.length}\r\n\r\n`);
    res.write(frame.jpeg);
    res.write("\r\n");
  }, FRAME_INTERVAL_MS);

  const cleanup = () => {
    clearInterval(timer);
  };

  res.on("close", cleanup);
  res.on("finish", cleanup);
});

export default router;
