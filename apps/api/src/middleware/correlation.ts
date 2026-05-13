import { Request, Response, NextFunction } from "express";

function randomId(): string {
  return crypto.randomUUID();
}

export function correlationMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const id = req.get("x-request-id") ?? randomId();
  res.setHeader("x-request-id", id);
  (req as Request & { requestId?: string }).requestId = id;
  next();
}
