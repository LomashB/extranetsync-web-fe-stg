import { NextRequest, NextResponse } from "next/server";

// ──────────────────────────────────────────────────────────────
// • Extranetsync Middleware - Admin Only Protection
// ──────────────────────────────────────────────────────────────
export async function middleware(req: NextRequest) {
  const { pathname, origin } = req.nextUrl;

  // ──────────────────────────────────────────────────────────────
  // • Admin routes protection
  // ──────────────────────────────────────────────────────────────
  if (pathname.startsWith('/admin')) {
    const adminToken = req.cookies.get("admin_auth_token")?.value;
    
    if (!adminToken) {
      return NextResponse.redirect(`${origin}/auth/admin/login`);
    }
  }

  // ──────────────────────────────────────────────────────────────
  // • Allow all other routes to proceed
  // ──────────────────────────────────────────────────────────────
  return NextResponse.next();
}

// ──────────────────────────────────────────────────────────────
// • Configuration - only match admin routes
// ──────────────────────────────────────────────────────────────
export const config = {
  matcher: ["/admin/:path*"],
};
