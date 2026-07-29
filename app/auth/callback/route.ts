import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/services/supabase/server";
import { routes } from "@/constants/routes";

/**
 * Exchanges the email-confirmation / OAuth code for a session cookie, then
 * redirects into the app. Linked from signUp's emailRedirectTo.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const redirectTo = searchParams.get("redirectTo") ?? routes.dashboard;

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${redirectTo}`);
    }
  }

  return NextResponse.redirect(`${origin}${routes.login}?error=auth`);
}
