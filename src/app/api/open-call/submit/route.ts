import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

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
    const {
      project_id,
      role_id,
      token,
      full_name,
      email,
      phone,
      location,
      age,
      photo_url,
      media_url,
      notes,
      form_completed,
    } = body;

    if (!project_id || !role_id || !token || !full_name || !email) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Use admin client for verification (RLS might block non-owner reads)
    const admin = createAdminClient();

    // Verify project exists, token matches, and open call is enabled
    const { data: project, error: projError } = await admin
      .from("projects")
      .select("id, open_call_enabled, open_call_token")
      .eq("id", project_id)
      .single();

    if (projError || !project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    if (!project.open_call_enabled || project.open_call_token !== token) {
      return NextResponse.json(
        { error: "Open call is not available" },
        { status: 403 }
      );
    }

    // Verify role exists and is visible
    const { data: role, error: roleError } = await admin
      .from("roles")
      .select("id, open_call_visible")
      .eq("id", role_id)
      .eq("project_id", project_id)
      .single();

    if (roleError || !role || !role.open_call_visible) {
      return NextResponse.json(
        { error: "Role is not available for submissions" },
        { status: 403 }
      );
    }

    // Check for duplicate submission
    const { data: existing } = await admin
      .from("open_call_submissions")
      .select("id")
      .eq("user_id", user.id)
      .eq("role_id", role_id)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "You have already submitted for this role" },
        { status: 409 }
      );
    }

    // Insert submission (use admin to bypass RLS)
    const { data: submission, error: insertError } = await admin
      .from("open_call_submissions")
      .insert({
        project_id,
        role_id,
        user_id: user.id,
        full_name,
        email,
        phone: phone || null,
        location: location || null,
        age: age || null,
        photo_url: photo_url || null,
        media_url: media_url || null,
        notes: notes || null,
        form_status: form_completed ? "completed" : "none",
        status: "pending",
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("Submission insert error:", insertError);
      return NextResponse.json(
        { error: "Failed to create submission" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, id: submission.id });
  } catch (error) {
    console.error("Open call submit error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
