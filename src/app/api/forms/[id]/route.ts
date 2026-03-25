import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const admin = createAdminClient();

    const { data: form, error } = await admin
      .from("project_forms")
      .select("id, project_id, role_id, name, fields, created_at")
      .eq("id", id)
      .single();

    if (error || !form) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    return NextResponse.json(form);
  } catch (error) {
    console.error("Form GET error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

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
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const admin = createAdminClient();

    // Fetch form and verify ownership
    const { data: form } = await admin
      .from("project_forms")
      .select("id, project_id")
      .eq("id", id)
      .single();

    if (!form) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const { data: project } = await supabase
      .from("projects")
      .select("id, client_id")
      .eq("id", form.project_id)
      .single();

    if (!project || project.client_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const updates: Record<string, any> = {};
    if (body.name !== undefined) updates.name = body.name;
    if (body.fields !== undefined) updates.fields = body.fields;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const { error } = await admin
      .from("project_forms")
      .update(updates)
      .eq("id", id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Form PATCH error:", error);
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
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const admin = createAdminClient();

    const { data: form } = await admin
      .from("project_forms")
      .select("id, project_id")
      .eq("id", id)
      .single();

    if (!form) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const { data: project } = await supabase
      .from("projects")
      .select("id, client_id")
      .eq("id", form.project_id)
      .single();

    if (!project || project.client_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete responses first, then form
    await admin.from("form_responses").delete().eq("form_id", id);
    await admin.from("project_forms").delete().eq("id", id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Form DELETE error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
