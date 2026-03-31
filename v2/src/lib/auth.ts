import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";
import prisma from "./db";

const SECRET_KEY = process.env.SECRET_KEY || "dev-secret-change-me";
const TOKEN_EXPIRY = "7d";

// ==================== PASSWORD ====================

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ==================== JWT ====================

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

export function createToken(payload: TokenPayload): string {
  return jwt.sign(payload, SECRET_KEY, { expiresIn: TOKEN_EXPIRY });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, SECRET_KEY) as TokenPayload;
  } catch {
    return null;
  }
}

// ==================== REQUEST AUTH ====================

export async function getCurrentUser(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.slice(7);
  const payload = verifyToken(token);
  if (!payload) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isVerified: true,
      isSuspended: true,
      picture: true,
      phone: true,
      languagePreference: true,
      emailVerified: true,
    },
  });

  if (!user || user.isSuspended) return null;
  return user;
}

export type CurrentUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

// ==================== REQUIRE AUTH ====================

export async function requireAuth(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!user) {
    throw new AuthError("Unauthorized", 401);
  }
  return user;
}

export async function requireAdmin(req: NextRequest) {
  const user = await requireAuth(req);
  if (user.role !== "admin") {
    throw new AuthError("Admin access required", 403);
  }
  return user;
}

export class AuthError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}
