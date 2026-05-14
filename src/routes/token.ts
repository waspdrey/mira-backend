import { Router, type IRouter } from "express";
import { z } from "zod";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const DECART_API_URL = "https://api3.decart.ai";
const decartTokenResponseSchema = z.object({
  apiKey: z.string(),
  expiresAt: z.string(),
});

router.post("/session/token", async (req, res): Promise<void> => {
  const apiKey = process.env["DECART_API_KEY"];
  if (!apiKey) {
    res.status(503).json({ error: "unconfigured", message: "Decart API key is not configured" });
    return;
  }

  try {
    const response = await fetch(`${DECART_API_URL}/v1/client/tokens`, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        expiresIn: 300,
        allowedModels: ["lucy-2.1"],
        constraints: {
          realtime: { maxSessionDuration: 600 },
        },
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      req.log.error({ status: response.status, body: text }, "Decart token creation failed");
      res
        .status(502)
        .json({ error: "upstream_error", message: "Failed to create Decart client token" });
      return;
    }

    const responseBody: unknown = await response.json();
    const data = decartTokenResponseSchema.parse(responseBody);
    req.log.info("Decart client token created");

    res.json({ clientToken: data.apiKey, expiresAt: data.expiresAt });
  } catch (err) {
    logger.error({ err }, "Error calling Decart token API");
    res.status(502).json({ error: "network_error", message: "Could not reach Decart API" });
  }
});

export default router;
