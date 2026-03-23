import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import crypto from "crypto";

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
    const { data: project, error: fetchError } = await supabase
      .from("projects")
      .select("id")
      .eq("id", id)
      .eq("client_id", user.id)
      .single();

    if (fetchError || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const body = await request.json();
    const allowed = ["name", "status", "brand", "type", "deadline", "open_call_enabled", "open_call_form_url", "open_call_show_project_docs", "open_call_show_role_docs"];
    const updates: Record<string, any> = {};
    for (const key of allowed) {
      if (key in body) updates[key] = body[key];
    }

    // When enabling open call for the first time, generate a token
    if (body.open_call_enabled === true) {
      const { data: currentProject } = await supabase
        .from("projects")
        .select("open_call_token")
        .eq("id", id)
        .single();

      if (!currentProject?.open_call_token) {
        updates.open_call_token = crypto.randomBytes(12).toString("hex");
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const { data: updated, error: updateError } = await supabase
      .from("projects")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Project PATCH error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(
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
    const { data: project, error: fetchError } = await supabase
      .from("projects")
      .select("id, roles(id)")
      .eq("id", id)
      .eq("client_id", user.id)
      .single();

    if (fetchError || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const roleIds = (project.roles || []).map((r: any) => r.id);

    // Cascade delete: role_packages, package_requests, documents, roles, then project
    if (roleIds.length > 0) {
      await supabase.from("role_packages").delete().in("role_id", roleIds);
      await supabase.from("package_requests").delete().in("role_id", roleIds);
      await supabase.from("roles").delete().eq("project_id", id);
    }

    await supabase.from("documents").delete().eq("project_id", id);

    const { error: deleteError } = await supabase
      .from("projects")
      .delete()
      .eq("id", id);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Project DELETE error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
