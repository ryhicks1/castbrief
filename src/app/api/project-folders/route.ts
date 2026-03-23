import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const project_id = searchParams.get("project_id");
    if (!project_id) {
      return NextResponse.json(
        { error: "Missing project_id" },
        { status: 400 }
      );
    }

    // Verify project ownership or collaborator access
    const { data: project } = await supabase
      .from("projects")
      .select("client_id")
      .eq("id", project_id)
      .single();

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    let hasAccess = project.client_id === user.id;
    if (!hasAccess) {
      const { data: collab } = await supabase
        .from("project_collaborators")
        .select("role")
        .eq("project_id", project_id)
        .eq("user_id", user.id)
        .single();
      hasAccess = !!collab;
    }

    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data, error } = await supabase
      .from("project_folders")
      .select("*")
      .eq("project_id", project_id)
      .order("sort_order", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Project folders GET error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { project_id, name } = body;

    if (!project_id || !name?.trim()) {
      return NextResponse.json(
        { error: "Missing project_id or name" },
        { status: 400 }
      );
    }

    // Verify project ownership
    const { data: project } = await supabase
      .from("projects")
      .select("client_id")
      .eq("id", project_id)
      .eq("client_id", user.id)
      .single();

    if (!project) {
      return NextResponse.json(
        { error: "Project not found or not owner" },
        { status: 403 }
      );
    }

    // Get max sort_order
    const { data: existing } = await supabase
      .from("project_folders")
      .select("sort_order")
      .eq("project_id", project_id)
      .order("sort_order", { ascending: false })
      .limit(1);

    const nextSort = existing && existing.length > 0 ? existing[0].sort_order + 1 : 0;

    const { data: folder, error } = await supabase
      .from("project_folders")
      .insert({
        project_id,
        name: name.trim(),
        sort_order: nextSort,
      })
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(folder);
  } catch (error) {
    console.error("Project folders POST error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { error: "Missing folder id" },
        { status: 400 }
      );
    }

    // Verify ownership via project
    const { data: folder } = await supabase
      .from("project_folders")
      .select("id, project_id")
      .eq("id", id)
      .single();

    if (!folder) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    }

    const { data: project } = await supabase
      .from("projects")
      .select("client_id")
      .eq("id", folder.project_id)
      .eq("client_id", user.id)
      .single();

    if (!project) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete folder (roles with this folder_id will have it set to NULL via ON DELETE SET NULL)
    const { error } = await supabase
      .from("project_folders")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Project folders DELETE error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
