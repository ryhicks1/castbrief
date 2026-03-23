import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  refreshAccessToken,
  createFolder,
  uploadFileToDropbox,
  getSharedFolderLink,
} from "@/lib/dropbox/client";

export const maxDuration = 60;

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

    const admin = createAdminClient();

    // Verify project
    const { data: project, error: projError } = await admin
      .from("projects")
      .select("id, name, client_id, open_call_enabled, open_call_token")
      .eq("id", project_id)
      .single();

    if (projError || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (!project.open_call_enabled || project.open_call_token !== token) {
      return NextResponse.json(
        { error: "Open call is not available" },
        { status: 403 }
      );
    }

    // Verify role
    const { data: role, error: roleError } = await admin
      .from("roles")
      .select("id, name, open_call_visible")
      .eq("id", role_id)
      .eq("project_id", project_id)
      .single();

    if (roleError || !role || !role.open_call_visible) {
      return NextResponse.json(
        { error: "Role is not available for submissions" },
        { status: 403 }
      );
    }

    // Check duplicate
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

    // Try to forward files to client's Dropbox
    let finalPhotoUrl = photo_url || null;
    let finalMediaUrl = media_url || null;

    const { data: clientProfile } = await admin
      .from("profiles")
      .select("dropbox_token, dropbox_refresh_token")
      .eq("id", project.client_id)
      .single();

    if (clientProfile?.dropbox_refresh_token) {
      try {
        const accessToken = await refreshAccessToken(
          clientProfile.dropbox_refresh_token
        );

        // Create folder structure: /CastingBrief/OpenCall/{Project}/{Role}/{TalentName}/
        const safeName = full_name.replace(/[^a-zA-Z0-9 ]/g, "").trim();
        const safeProject = project.name.replace(/[^a-zA-Z0-9 ]/g, "").trim();
        const safeRole = role.name.replace(/[^a-zA-Z0-9 ]/g, "").trim();
        const folderPath = `/CastingBrief/OpenCall/${safeProject}/${safeRole}/${safeName}`;

        try {
          await createFolder(accessToken, folderPath);
        } catch {
          // Folder may already exist
        }

        // Upload photo to Dropbox
        if (photo_url) {
          try {
            const photoRes = await fetch(photo_url);
            if (photoRes.ok) {
              const photoBuffer = await photoRes.arrayBuffer();
              const ext = photo_url.split(".").pop()?.split("?")[0] || "jpg";
              await uploadFileToDropbox(
                accessToken,
                `${folderPath}/headshot.${ext}`,
                photoBuffer,
                "image/jpeg"
              );

              // Get shared link for the folder
              try {
                finalPhotoUrl = await getSharedFolderLink(accessToken, `${folderPath}/headshot.${ext}`);
              } catch {
                finalPhotoUrl = photo_url; // Keep Supabase URL as fallback
              }

              // Delete from Supabase storage
              const storagePath = photo_url.split("/media-attachments/")[1];
              if (storagePath) {
                await admin.storage.from("media-attachments").remove([storagePath]);
              }
            }
          } catch (e) {
            console.warn("Failed to forward photo to Dropbox:", e);
          }
        }

        // Upload media to Dropbox
        if (media_url) {
          try {
            const mediaRes = await fetch(media_url);
            if (mediaRes.ok) {
              const mediaBuffer = await mediaRes.arrayBuffer();
              const ext = media_url.split(".").pop()?.split("?")[0] || "mp4";
              await uploadFileToDropbox(
                accessToken,
                `${folderPath}/self-tape.${ext}`,
                mediaBuffer,
                "video/mp4"
              );

              try {
                finalMediaUrl = await getSharedFolderLink(accessToken, `${folderPath}/self-tape.${ext}`);
              } catch {
                finalMediaUrl = media_url;
              }

              // Delete from Supabase storage
              const storagePath = media_url.split("/media-attachments/")[1];
              if (storagePath) {
                await admin.storage.from("media-attachments").remove([storagePath]);
              }
            }
          } catch (e) {
            console.warn("Failed to forward media to Dropbox:", e);
          }
        }
      } catch (e) {
        console.warn("Dropbox forwarding failed, keeping Supabase URLs:", e);
      }
    }

    // Insert submission
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
        photo_url: finalPhotoUrl,
        media_url: finalMediaUrl,
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
