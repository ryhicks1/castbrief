import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("project_id");
    const roleId = searchParams.get("role_id");

    if (!projectId) {
      return NextResponse.json({ error: "project_id is required" }, { status: 400 });
    }

    // Verify project ownership
    const { data: project } = await supabase
      .from("projects")
      .select("id, client_id")
      .eq("id", projectId)
      .single();

    if (!project || project.client_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const admin = createAdminClient();
    let query = admin
      .from("project_forms")
      .select("id, project_id, role_id, name, fields, created_at")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });

    if (roleId) {
      query = query.eq("role_id", roleId);
    }

    const { data: forms, error } = await query;

    if (error) {
      console.error("Forms fetch error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get response counts for each form
    const formIds = (forms || []).map((f) => f.id);
    let responseCounts: Record<string, number> = {};

    if (formIds.length > 0) {
      const { data: counts } = await admin
        .from("form_responses")
        .select("form_id")
        .in("form_id", formIds);

      for (const row of counts || []) {
        responseCounts[row.form_id] = (responseCounts[row.form_id] || 0) + 1;
      }
    }

    const formsWithCounts = (forms || []).map((f) => ({
      ...f,
      response_count: responseCounts[f.id] || 0,
    }));

    return NextResponse.json(formsWithCounts);
  } catch (error) {
    console.error("Forms GET error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { project_id, role_id, name, fields } = body;

    if (!project_id || !name || !fields) {
      return NextResponse.json(
        { error: "project_id, name, and fields are required" },
        { status: 400 }
      );
    }

    // Verify project ownership
    const { data: project } = await supabase
      .from("projects")
      .select("id, client_id")
      .eq("id", project_id)
      .single();

    if (!project || project.client_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const admin = createAdminClient();
    const { data: form, error } = await admin
      .from("project_forms")
      .insert({
        project_id,
        role_id: role_id || null,
        name,
        fields,
      })
      .select("id, project_id, role_id, name, fields, created_at")
      .single();

    if (error) {
      console.error("Form create error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(form);
  } catch (error) {
    console.error("Forms POST error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
