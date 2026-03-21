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

    return NextResponse.redirect(
      new URL("/agent/dashboard?dropbox=connected", request.url)
    );
  } catch (err) {
    console.error("Dropbox OAuth error:", err);
    return NextResponse.redirect(
      new URL("/agent/dashboard?dropbox=error", request.url)
    );
  }
}
