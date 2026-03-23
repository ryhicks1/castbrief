import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateSides } from "@/lib/scripts/sides";

export const maxDuration = 60;

interface ConfirmRole {
  name: string;
  description: string;
  pageNumbers: number[];
  include: boolean;
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
    const {
      project_id,
      script_url,
      script_file_name,
      roles,
    }: {
      project_id: string;
      script_url: string;
      script_file_name: string;
      roles: ConfirmRole[];
    } = body;

    if (!project_id || !roles?.length) {
      return NextResponse.json(
        { error: "project_id and roles required" },
        { status: 400 }
      );
    }

    // Verify ownership
    const { data: project } = await supabase
      .from("projects")
      .select("id, client_id")
      .eq("id", project_id)
      .single();

    if (!project || project.client_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const includedRoles = roles.filter((r) => r.include);
    if (includedRoles.length === 0) {
      return NextResponse.json(
        { error: "No roles selected" },
        { status: 400 }
      );
    }

    // Save the original script as a project-level document
    if (script_url) {
      await supabase.from("documents").insert({
        project_id,
        name: script_file_name || "Script",
        url: script_url,
        file_type: script_url.endsWith(".docx") ? "docx" : "pdf",
        created_by: user.id,
      });
    }

    // Try to fetch the original script for sides generation
    let scriptBuffer: Buffer | null = null;
    const isPdf =
      script_url &&
      (script_url.endsWith(".pdf") || script_url.includes(".pdf"));

    if (isPdf && script_url) {
      try {
        const res = await fetch(script_url);
        if (res.ok) {
          scriptBuffer = Buffer.from(await res.arrayBuffer());
        }
      } catch {
        console.warn("Could not fetch script for sides generation");
      }
    }

    // Create roles and generate sides
    const createdRoles: { id: string; name: string }[] = [];

    for (const role of includedRoles) {
      // Create the role in the database
      const { data: dbRole, error: roleError } = await supabase
        .from("roles")
        .insert({
          project_id,
          name: role.name,
          brief: role.description,
        })
        .select("id, name")
        .single();

      if (roleError || !dbRole) {
        console.error("Failed to create role:", role.name, roleError);
        continue;
      }

      createdRoles.push(dbRole);

      // Generate sides if we have the script PDF and page numbers
      if (
        scriptBuffer &&
        role.pageNumbers?.length > 0
      ) {
        try {
          const sidesData = await generateSides(scriptBuffer, role.pageNumbers);
          const sidesPath = `documents/sides_${dbRole.id}_${Date.now()}.pdf`;

          const { error: sidesUploadError } = await supabase.storage
            .from("media-attachments")
            .upload(sidesPath, sidesData, {
              contentType: "application/pdf",
              upsert: false,
            });

          if (!sidesUploadError) {
            const {
              data: { publicUrl },
            } = supabase.storage
              .from("media-attachments")
              .getPublicUrl(sidesPath);

            // Save sides as a role-level document
            await supabase.from("documents").insert({
              role_id: dbRole.id,
              name: `${role.name} — Sides`,
              url: publicUrl,
              file_type: "pdf",
              size_bytes: sidesData.length,
              created_by: user.id,
            });
          }
        } catch (sidesError) {
          console.error(
            "Failed to generate sides for:",
            role.name,
            sidesError
          );
        }
      }
    }

    return NextResponse.json({
      success: true,
      rolesCreated: createdRoles.length,
      roles: createdRoles,
    });
  } catch (error: any) {
    console.error("Script confirm error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create roles" },
      { status: 500 }
    );
  }
}
