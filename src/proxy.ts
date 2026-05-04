import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = "poz-session";

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET environment variable is not set");
  return new TextEncoder().encode(secret);
}

async function getSession(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return {
      userId: payload.userId as number,
      authRole: payload.authRole as string,
    };
  } catch {
    return null;
  }
}

const SUPERADMIN_PATHS = ["/agents", "/catalog", "/settings"];
const ADMIN_PATHS = ["/team"];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.match(/\.\w+$/)
  ) {
    return NextResponse.next();
  }

  // Auth API routes are always public (login / logout / session)
  if (pathname.startsWith("/api/auth/")) {
    return NextResponse.next();
  }

  const session = await getSession(req);

  if (pathname === "/login") {
    if (session) {
      const home = "/dashboard";
      return NextResponse.redirect(new URL(home, req.url));
    }
    return NextResponse.next();
  }

  if (!session) {
    // API routes without a session get 401 JSON, not a redirect
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const isSuperadminRoute = SUPERADMIN_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
  if (isSuperadminRoute && session.authRole !== "superadmin") {
    return NextResponse.redirect(new URL("/posts", req.url));
  }

  const isAdminRoute = ADMIN_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
  if (isAdminRoute && session.authRole === "employee") {
    return NextResponse.redirect(new URL("/posts", req.url));
  }

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-user-id", String(session.userId));
  requestHeaders.set("x-auth-role", session.authRole);

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
