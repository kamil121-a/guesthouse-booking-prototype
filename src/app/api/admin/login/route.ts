import { NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME, getAdminPassword, getAdminSessionToken } from "@/lib/adminAuth";

export async function POST(req: Request) {
  const body = (await req.json()) as { password?: string };

  if (!body.password || body.password !== getAdminPassword()) {
    return NextResponse.json({ ok: false, message: "Nieprawidlowe haslo." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE_NAME, getAdminSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12
  });
  return response;
}
