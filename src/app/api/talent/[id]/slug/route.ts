import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: talentId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug } = await request.json();
    if (!slug || slug.length < 2) {
      return NextResponse.json({ error: "URL must be at least 2 characters" }, { status: 400 });
    }

    // Reserved slugs
    const reserved = ["view", "profile", "new", "edit", "settings", "admin"];
    if (reserved.includes(slug)) {
      return NextResponse.json({ error: "This URL is reserved" }, { status: 400 });
    }

    // Check if slug is taken
    const { data: existing } = await supabase
      .from("talents")
      .select("id")
      .eq("profile_slug", slug)
      .neq("id", talentId)
      .single();

    if (existing) {
      return NextResponse.json({ error: "This URL is already taken" }, { status: 409 });
    }

    const { error } = await supabase
      .from("talents")
      .update({ profile_slug: slug })
      .eq("id", talentId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, slug });
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
