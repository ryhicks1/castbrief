import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify ownership
    const { data: list } = await supabase
      .from("agent_lists")
      .select("id")
      .eq("id", id)
      .eq("client_id", user.id)
      .single();

    if (!list) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const { name } = await request.json();
    if (!name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("agent_lists")
      .update({ name: name.trim() })
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Agent list PATCH error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify ownership
    const { data: list } = await supabase
      .from("agent_lists")
      .select("id")
      .eq("id", id)
      .eq("client_id", user.id)
      .single();

    if (!list) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Cascade handles members, but delete explicitly for safety
    await supabase.from("agent_list_members").delete().eq("list_id", id);
    await supabase.from("agent_lists").delete().eq("id", id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Agent list DELETE error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
