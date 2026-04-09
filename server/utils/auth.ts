import type { Request, Response, NextFunction } from "express";
import { verifySupabaseToken } from "../supabase";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userEmail?: string;
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No authorization token provided" });
  }

  const token = authHeader.substring(7);
  const user = await verifySupabaseToken(token);

  if (!user) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }

  req.userId = user.id;
  req.userEmail = user.email;
  next();
}
