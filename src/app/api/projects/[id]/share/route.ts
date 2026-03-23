import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify caller is project owner
    const { data: project } = await supabase
      .from("projects")
      .select("client_id")
      .eq("id", projectId)
      .single();

    if (!project || project.client_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch collaborators with profile info
    const { data: collaborators, error } = await supabase
      .from("project_collaborators")
      .select("id, user_id, role, created_at")
      .eq("project_id", projectId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Fetch profile info for collaborators
    const userIds = (collaborators || []).map((c) => c.user_id);
    let profiles: Record<string, { full_name: string; email: string }> = {};

    if (userIds.length > 0) {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", userIds);

      for (const p of profileData || []) {
        profiles[p.id] = { full_name: p.full_name, email: p.email };
      }
    }

    const enriched = (collaborators || []).map((c) => ({
      ...c,
      full_name: profiles[c.user_id]?.full_name || "Unknown",
      email: profiles[c.user_id]?.email || "",
    }));

    return NextResponse.json(enriched);
  } catch (error) {
    console.error("Share GET error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

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
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify caller is project owner
    const { data: project } = await supabase
      .from("projects")
      .select("client_id")
      .eq("id", projectId)
      .single();

    if (!project || project.client_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { email, role } = body;

    if (!email?.trim()) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    if (!role || !["editor", "viewer"].includes(role)) {
      return NextResponse.json(
        { error: "Role must be 'editor' or 'viewer'" },
        { status: 400 }
      );
    }

    // Look up user by email in profiles
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .eq("email", email.trim().toLowerCase())
      .single();

    if (!profile) {
      return NextResponse.json(
        { error: "User not found — they need a CastingBrief account first" },
        { status: 404 }
      );
    }

    // Cannot add yourself
    if (profile.id === user.id) {
      return NextResponse.json(
        { error: "You cannot add yourself as a collaborator" },
        { status: 400 }
      );
    }

    // Check if already a collaborator
    const { data: existing } = await supabase
      .from("project_collaborators")
      .select("id")
      .eq("project_id", projectId)
      .eq("user_id", profile.id)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "This user is already a collaborator" },
        { status: 409 }
      );
    }

    // Insert collaborator
    const { data: collab, error: insertError } = await supabase
      .from("project_collaborators")
      .insert({
        project_id: projectId,
        user_id: profile.id,
        role,
      })
      .select("id, user_id, role, created_at")
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({
      ...collab,
      full_name: profile.full_name,
      email: profile.email,
    });
  } catch (error) {
    console.error("Share POST error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify caller is project owner
    const { data: project } = await supabase
      .from("projects")
      .select("client_id")
      .eq("id", projectId)
      .single();

    if (!project || project.client_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    if (!userId) {
      return NextResponse.json(
        { error: "Missing userId" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("project_collaborators")
      .delete()
      .eq("project_id", projectId)
      .eq("user_id", userId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Share DELETE error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
