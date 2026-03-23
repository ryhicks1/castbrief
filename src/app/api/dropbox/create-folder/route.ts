import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { refreshAccessToken, createFolder } from "@/lib/dropbox/client";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { path } = await request.json();

    if (!path || typeof path !== "string") {
      return NextResponse.json(
        { error: "path is required" },
        { status: 400 }
      );
    }

    // Get user's Dropbox refresh token
    const { data: profile } = await supabase
      .from("profiles")
      .select("dropbox_refresh_token")
      .eq("id", user.id)
      .single();

    if (!profile?.dropbox_refresh_token) {
      return NextResponse.json(
        { error: "Dropbox not connected" },
        { status: 400 }
      );
    }

    // Refresh access token
    const accessToken = await refreshAccessToken(profile.dropbox_refresh_token);

    // Create the folder — swallow "folder already exists" errors
    try {
      const result = await createFolder(accessToken, path);
      return NextResponse.json({ success: true, folder: result });
    } catch (err: any) {
      // Dropbox returns 409 when folder already exists
      if (err.message?.includes("409")) {
        return NextResponse.json({ success: true, alreadyExists: true });
      }
      throw err;
    }
  } catch (error: any) {
    console.error("Dropbox create-folder error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create Dropbox folder" },
      { status: 500 }
    );
  }
}
