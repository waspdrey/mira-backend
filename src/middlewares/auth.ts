import { type Request, type Response, type NextFunction } from "express";

export function requireAccessKey(req: Request, res: Response, next: NextFunction): void {
  const ACCESS_KEY_HEADER = process.env.ACCESS_KEY_HEADER ?? "x-access-key";
  const ACCESS_KEYS = process.env.ACCESS_KEYS?.split(",").map(key => key.trim()) ?? [];
  const accessKey = req.headers[ACCESS_KEY_HEADER] as string;

  if (!accessKey) {
    res.status(401).json({
      error: "access_key_required",
      message: "Access key is required"
    });
    return;
  }

  if (!ACCESS_KEYS.includes(accessKey)) {
    res.status(401).json({
      error: "invalid_access_key",
      message: "Invalid access key"
    });
    return;
  }

  next();
}