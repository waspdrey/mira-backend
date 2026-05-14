import { Router, type IRouter } from "express";
import { ValidateAccessKeyBody, ValidateAccessKeyResponse } from "../lib/api-schemas";

const router: IRouter = Router();

router.post("/auth/validate", (req, res): void => {
  const parsed = ValidateAccessKeyBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", message: parsed.error.message });
    return;
  }

  const { accessKey } = parsed.data;
  const accessKeys = process.env.ACCESS_KEYS?.split(",").map((key) => key.trim()) ?? [];

  const isValid = accessKeys.includes(accessKey);

  res.json(
    ValidateAccessKeyResponse.parse({
      valid: isValid,
      message: isValid ? "Access key is valid" : "Invalid access key",
    }),
  );
});

export default router;
