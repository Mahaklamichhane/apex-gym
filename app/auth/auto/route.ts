import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/services/supabase/server";
import { routes } from "@/constants/routes";

/**
 * Single-user auto-login. Signs in the owner account silently (creating it once
 * if it doesn't exist yet), then redirects into the app. The proxy sends
 * unauthenticated requests here, so there's never a visible login screen.
 */
export async function GET(request: NextRequest) {
  const { origin, searchParams } = request.nextUrl;
  const redirectTo = searchParams.get("redirectTo") ?? routes.dashboard;

  const email = process.env.APP_USER_EMAIL;
  const password = process.env.APP_USER_PASSWORD;
  if (!email || !password) {
    return misconfigured("APP_USER_EMAIL / APP_USER_PASSWORD are not set in .env.local");
  }

  const supabase = await createClient();

  // Try to sign in first.
  let { error } = await supabase.auth.signInWithPassword({ email, password });

  // If the account doesn't exist yet, create it (instant when email
  // confirmation is disabled) and sign in.
  if (error) {
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });
    if (!signUpError) {
      ({ error } = await supabase.auth.signInWithPassword({ email, password }));
    } else if (!/already registered/i.test(signUpError.message)) {
      return misconfigured(signUpError.message);
    }
  }

  if (error) {
    // Most common cause: "Email not confirmed" — the confirmation toggle is on.
    return misconfigured(error.message);
  }

  return NextResponse.redirect(`${origin}${redirectTo}`);
}

function misconfigured(detail: string) {
  return new NextResponse(
    `<!doctype html><html><head><meta charset="utf-8"><title>Setup needed</title>
     <style>body{font-family:system-ui;background:#0a0a0a;color:#e5e5e5;display:grid;place-items:center;min-height:100vh;margin:0;padding:2rem;text-align:center;line-height:1.6}
     code{background:#262626;padding:.15rem .4rem;border-radius:.3rem}a{color:#fff}</style></head>
     <body><div><h1>One-time setup</h1>
     <p>Auto-login couldn't complete:<br><code>${escapeHtml(detail)}</code></p>
     <p>In Supabase → <b>Authentication → Sign In / Providers → Email</b>, turn <b>off</b>
     "Confirm email", then reload this page.</p></div></body></html>`,
    { status: 200, headers: { "content-type": "text/html; charset=utf-8" } },
  );
}

function escapeHtml(s: string) {
  return s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]!);
}
