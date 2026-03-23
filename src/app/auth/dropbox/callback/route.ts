import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { exchangeCodeForToken } from "@/lib/dropbox/client";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(
      new URL("/agent/dashboard?dropbox=error&reason=no_code", request.url)
    );
  }

  try {
    const { accessToken, refreshToken, accountId } =
      await exchangeCodeForToken(code);

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    await supabase
      .from("profiles")
      .update({
        dropbox_token: accessToken,
        dropbox_refresh_token: refreshToken,
        dropbox_account_id: accountId,
      })
      .eq("id", user.id);

    // Redirect based on user role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const dashboardPath =
      profile?.role === "client"
        ? "/client/projects?dropbox=connected"
        : "/agent/dashboard?dropbox=connected";

    return NextResponse.redirect(new URL(dashboardPath, request.url));
  } catch (err) {
    console.error("Dropbox OAuth error:", err);
    return NextResponse.redirect(
      new URL("/agent/dashboard?dropbox=error", request.url)
    );
  }
}
