import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: roleId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Verify ownership via project
    const { data: role } = await supabase
      .from("roles")
      .select("id, project_id, projects(client_id)")
      .eq("id", roleId)
      .single();

    if (!role) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const project = role.projects as any;
    if (project?.client_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const updates: Record<string, any> = {};
    if (body.name !== undefined) updates.name = body.name;
    if (body.brief !== undefined) updates.brief = body.brief;
    if (body.folder_id !== undefined) updates.folder_id = body.folder_id || null;
    if (body.open_call_visible !== undefined) updates.open_call_visible = body.open_call_visible;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const { error } = await supabase.from("roles").update(updates).eq("id", roleId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: roleId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: role } = await supabase
      .from("roles")
      .select("id, project_id, projects(client_id)")
      .eq("id", roleId)
      .single();

    if (!role) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const project = role.projects as any;
    if (project?.client_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete role_packages first, then documents, then role
    await supabase.from("role_packages").delete().eq("role_id", roleId);
    await supabase.from("documents").delete().eq("role_id", roleId);
    await supabase.from("roles").delete().eq("id", roleId);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Copy/duplicate a role
  try {
    const { id: roleId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: role } = await supabase
      .from("roles")
      .select("*, projects(client_id)")
      .eq("id", roleId)
      .single();

    if (!role) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const project = role.projects as any;
    if (project?.client_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const targetProjectId = body.target_project_id || role.project_id;

    const { data: newRole, error } = await supabase
      .from("roles")
      .insert({
        project_id: targetProjectId,
        name: `${role.name} (Copy)`,
        brief: role.brief,
        folder_id: role.folder_id,
      })
      .select("id, name")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(newRole);
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
