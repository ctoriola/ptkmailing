import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/auth";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isAdminArea = pathname.startsWith("/admin") || pathname.startsWith("/api/admin");
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySession(token) : null;

  if (session && (!isAdminArea || session.role === "admin")) return NextResponse.next();
  if (pathname.startsWith("/api/")) {
    return NextResponse.json(
      session
        ? { error: "Admin access required.", code: "forbidden" }
        : { error: "Your session has expired. Sign in again.", code: "unauthorized" },
      { status: session ? 403 : 401 },
    );
  }
  return NextResponse.redirect(new URL(isAdminArea ? "/admin/login" : "/login", req.url));
}

export const config = {
  matcher: ["/((?!login|admin/login|api/auth|_next|.*\\..*).*)"],
};
