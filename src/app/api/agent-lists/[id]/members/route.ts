import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

async function verifyListOwnership(supabase: any, listId: string, userId: string) {
  const { data } = await supabase
    .from("agent_lists")
    .select("id")
    .eq("id", listId)
    .eq("client_id", userId)
    .single();
  return !!data;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: listId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!(await verifyListOwnership(supabase, listId, user.id))) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const { data, error } = await supabase
      .from("agent_list_members")
      .select("id, agent_email, agent_name, created_at")
      .eq("list_id", listId)
      .order("created_at");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ members: data });
  } catch (error) {
    console.error("List members GET error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: listId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!(await verifyListOwnership(supabase, listId, user.id))) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const { agent_email, agent_name } = await request.json();
    if (!agent_email?.trim()) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const email = agent_email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("agent_list_members")
      .insert({
        list_id: listId,
        agent_email: email,
        agent_name: agent_name?.trim() || null,
      })
      .select("id, agent_email, agent_name, created_at")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ member: data });
  } catch (error) {
    console.error("List members POST error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: listId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!(await verifyListOwnership(supabase, listId, user.id))) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get("memberId");
    if (!memberId) {
      return NextResponse.json({ error: "memberId required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("agent_list_members")
      .delete()
      .eq("id", memberId)
      .eq("list_id", listId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("List members DELETE error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
