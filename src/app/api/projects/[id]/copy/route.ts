import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
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

    // Fetch original project with roles
    const { data: original, error: fetchError } = await supabase
      .from("projects")
      .select("name, brand, type, status, deadline, client_id, roles(name, brief)")
      .eq("id", id)
      .eq("client_id", user.id)
      .single();

    if (fetchError || !original) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Create new project
    const { data: newProject, error: createError } = await supabase
      .from("projects")
      .insert({
        name: `Copy of ${original.name}`,
        brand: original.brand,
        type: original.type,
        status: original.status,
        deadline: original.deadline,
        client_id: user.id,
      })
      .select()
      .single();

    if (createError || !newProject) {
      return NextResponse.json({ error: createError?.message || "Failed to create project" }, { status: 500 });
    }

    // Copy roles
    const roles = original.roles || [];
    if (roles.length > 0) {
      const rolesToInsert = roles.map((r: any) => ({
        name: r.name,
        brief: r.brief,
        project_id: newProject.id,
      }));

      await supabase.from("roles").insert(rolesToInsert);
    }

    return NextResponse.json(newProject);
  } catch (error) {
    console.error("Project copy error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
