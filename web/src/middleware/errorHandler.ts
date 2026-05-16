import { Request, Response, NextFunction } from "express";

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error("[error]", err.message);
  const status = (err as { status?: number }).status ?? 500;
  const message =
    process.env.NODE_ENV === "production" ? "Internal server error" : err.message;
  res.status(status).json({ success: false, error: message });
}
