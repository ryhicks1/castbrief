import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { refreshAccessToken, createFolder } from "@/lib/dropbox/client";

export const maxDuration = 60;

interface SmartCreateBody {
  project: {
    name: string;
    brand: string;
    type: string;
    location: string;
    deadline: string | null;
    director: string | null;
    castingDirector: string | null;
    productionDates: string | null;
  };
  roles: Array<{
    name: string;
    description: string;
    ageRange: string | null;
    gender: string | null;
    speaking: boolean;
    characteristics: string[];
  }>;
  selfTapeInstructions: Array<{
    roleName: string;
    videos: Array<{ label: string; description: string }>;
    photos: string[];
    filmingNotes: string[];
    referenceLinks: string[];
  }>;
  formQuestions: Array<{
    roleName: string;
    questions: Array<{
      type: string;
      label: string;
      options?: string[];
      required: boolean;
    }>;
  }>;
  uploadedFiles: Array<{ name: string; url: string }>;
  options: {
    breakdownSides: boolean;
    createForms: boolean;
    createSelfTape: boolean;
  };
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

    const body: SmartCreateBody = await request.json();
    const { project, roles, selfTapeInstructions, formQuestions, uploadedFiles, options } = body;

    if (!project?.name?.trim()) {
      return NextResponse.json(
        { error: "Project name is required" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // 1. Create the project
    const { data: newProject, error: projectError } = await supabase
      .from("projects")
      .insert({
        client_id: user.id,
        name: project.name.trim(),
        brand: project.brand?.trim() || null,
        type: project.type || "film",
        deadline: project.deadline || null,
        status: "active",
      })
      .select("id")
      .single();

    if (projectError || !newProject) {
      console.error("Project creation failed:", projectError);
      return NextResponse.json(
        { error: projectError?.message || "Failed to create project" },
        { status: 500 }
      );
    }

    const projectId = newProject.id;
    let rolesCreated = 0;
    let formsCreated = 0;
    let documentsCreated = 0;

    // Map role name -> role ID for linking forms and self-tape instructions
    const roleNameToId: Record<string, string> = {};

    // 2. Create roles
    if (roles && roles.length > 0) {
      for (const role of roles) {
        const { data: dbRole, error: roleError } = await supabase
          .from("roles")
          .insert({
            project_id: projectId,
            name: role.name,
            brief: role.description,
          })
          .select("id, name")
          .single();

        if (roleError || !dbRole) {
          console.error("Failed to create role:", role.name, roleError);
          continue;
        }

        roleNameToId[role.name] = dbRole.id;
        rolesCreated++;
      }
    }

    // 3. Create forms
    if (options.createForms && formQuestions && formQuestions.length > 0) {
      for (const fq of formQuestions) {
        const roleId = roleNameToId[fq.roleName] || null;
        if (!fq.questions || fq.questions.length === 0) continue;

        const fields = fq.questions.map((q, idx) => ({
          id: `field_${idx}`,
          type: q.type,
          label: q.label,
          options: q.options || [],
          required: q.required,
        }));

        const { error: formError } = await admin
          .from("project_forms")
          .insert({
            project_id: projectId,
            role_id: roleId,
            name: `${fq.roleName} Application Form`,
            fields,
          });

        if (formError) {
          console.error("Failed to create form for:", fq.roleName, formError);
          continue;
        }
        formsCreated++;
      }
    }

    // 4. Create self-tape instruction documents
    if (
      options.createSelfTape &&
      selfTapeInstructions &&
      selfTapeInstructions.length > 0
    ) {
      for (const st of selfTapeInstructions) {
        const roleId = roleNameToId[st.roleName] || null;

        // Build a readable self-tape instruction document
        let docContent = `SELF-TAPE INSTRUCTIONS — ${st.roleName}\n`;
        docContent += "=".repeat(50) + "\n\n";

        if (st.videos.length > 0) {
          docContent += "VIDEO REQUIREMENTS:\n\n";
          st.videos.forEach((v, i) => {
            docContent += `${i + 1}. ${v.label}\n   ${v.description}\n\n`;
          });
        }

        if (st.photos.length > 0) {
          docContent += "PHOTO REQUIREMENTS:\n\n";
          st.photos.forEach((p, i) => {
            docContent += `${i + 1}. ${p}\n`;
          });
          docContent += "\n";
        }

        if (st.filmingNotes.length > 0) {
          docContent += "FILMING NOTES:\n\n";
          st.filmingNotes.forEach((n) => {
            docContent += `- ${n}\n`;
          });
          docContent += "\n";
        }

        if (st.referenceLinks.length > 0) {
          docContent += "REFERENCE LINKS:\n\n";
          st.referenceLinks.forEach((l) => {
            docContent += `- ${l}\n`;
          });
        }

        // Upload as a text file to storage
        const storagePath = `documents/selftape_${projectId}_${Date.now()}_${Math.random()
          .toString(36)
          .slice(2, 6)}.txt`;

        const { error: uploadError } = await supabase.storage
          .from("media-attachments")
          .upload(storagePath, Buffer.from(docContent, "utf-8"), {
            contentType: "text/plain",
            upsert: false,
          });

        if (!uploadError) {
          const {
            data: { publicUrl },
          } = supabase.storage
            .from("media-attachments")
            .getPublicUrl(storagePath);

          await supabase.from("documents").insert({
            project_id: projectId,
            role_id: roleId,
            name: `${st.roleName} — Self-Tape Instructions`,
            url: publicUrl,
            file_type: "txt",
            created_by: user.id,
          });
          documentsCreated++;
        }
      }
    }

    // 5. Upload original documents to project
    if (uploadedFiles && uploadedFiles.length > 0) {
      for (const uf of uploadedFiles) {
        const ext = uf.name.split(".").pop() || "pdf";
        await supabase.from("documents").insert({
          project_id: projectId,
          name: uf.name,
          url: uf.url,
          file_type: ext,
          created_by: user.id,
        });
        documentsCreated++;
      }
    }

    // 6. Dropbox folders (non-blocking)
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("dropbox_refresh_token")
        .eq("id", user.id)
        .single();

      if (profile?.dropbox_refresh_token) {
        const accessToken = await refreshAccessToken(
          profile.dropbox_refresh_token
        );

        // Create project folder
        try {
          await createFolder(
            accessToken,
            `/CastingBrief/${project.name.trim()}`
          );
        } catch (e: any) {
          if (!e.message?.includes("409")) {
            console.error("Dropbox project folder creation failed:", e);
          }
        }

        // Create role folders
        for (const [roleName] of Object.entries(roleNameToId)) {
          try {
            await createFolder(
              accessToken,
              `/CastingBrief/${project.name.trim()}/${roleName}`
            );
          } catch (e: any) {
            if (!e.message?.includes("409")) {
              console.error("Dropbox role folder creation failed:", roleName, e);
            }
          }
        }
      }
    } catch (dropboxErr) {
      console.error(
        "Dropbox folder mirroring failed (non-blocking):",
        dropboxErr
      );
    }

    return NextResponse.json({
      projectId,
      summary: {
        rolesCreated,
        formsCreated,
        documentsCreated,
      },
    });
  } catch (error: any) {
    console.error("Smart create error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create project" },
      { status: 500 }
    );
  }
}
