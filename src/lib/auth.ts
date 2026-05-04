import { SignJWT, jwtVerify } from "jose";
import { AuthRole } from "./types";

export const COOKIE_NAME = "poz-session";
const EXPIRY = "7d";

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET environment variable is not set");
  return new TextEncoder().encode(secret);
}

export interface SessionPayload {
  userId: number;
  authRole: AuthRole;
}

export async function signToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ userId: payload.userId, authRole: payload.authRole })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(EXPIRY)
    .sign(getSecret());
}

export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return {
      userId: payload.userId as number,
      authRole: payload.authRole as AuthRole,
    };
  } catch {
    return null;
  }
}
