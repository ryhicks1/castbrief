import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Verify project ownership
    const { data: project } = await supabase
      .from("projects")
      .select("id")
      .eq("id", projectId)
      .eq("client_id", user.id)
      .single();

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const body = await request.json();
    const { deadline, source_role_id } = body;

    if (!deadline) {
      return NextResponse.json({ error: "Deadline is required" }, { status: 400 });
    }

    // Update all roles in the project except the source role
    const { error } = await supabase
      .from("roles")
      .update({ deadline })
      .eq("project_id", projectId)
      .neq("id", source_role_id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Copy deadline error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
