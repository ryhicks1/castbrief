import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/resend/client";
import { renderMediaRequestEmail } from "@/lib/resend/templates/MediaRequestEmail";
import {
  createFolder,
  createFileRequest,
  refreshAccessToken,
  getSharedFolderLink,
} from "@/lib/dropbox/client";
import crypto from "crypto";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: packageId } = await params;
    const body = await request.json();
    const { token, clientName, message, link, attachmentUrl } = body;

    if (!token) {
      return NextResponse.json({ error: "Token required" }, { status: 401 });
    }

    const supabase = createAdminClient();

    // Verify package
    const { data: pkg, error: pkgError } = await supabase
      .from("packages")
      .select("*, profiles:agent_id(id, full_name, agency_name, dropbox_token, dropbox_refresh_token)")
      .eq("id", packageId)
      .single();

    if (pkgError || !pkg || pkg.token !== token) {
      return NextResponse.json({ error: "Invalid package or token" }, { status: 403 });
    }

    // Get selected talents (client_pick = true)
    const { data: selectedTalents } = await supabase
      .from("package_talents")
      .select("id, talent_id, talents(full_name)")
      .eq("package_id", packageId)
      .eq("client_pick", true);

    if (!selectedTalents || selectedTalents.length === 0) {
      return NextResponse.json({ error: "No talent selected" }, { status: 400 });
    }

    const uploadUrls: { talentId: string; talentName: string; uploadUrl: string }[] = [];
    const profile = pkg.profiles as any;

    // Try Dropbox integration
    let dropboxToken: string | null = null;
    if (profile?.dropbox_refresh_token) {
      try {
        dropboxToken = await refreshAccessToken(profile.dropbox_refresh_token);
      } catch (e) {
        console.warn("Dropbox token refresh failed, skipping Dropbox:", e);
      }
    }

    for (const pt of selectedTalents) {
      const talent = pt.talents as any;
      const uploadToken = crypto.randomBytes(16).toString("base64url");
      let uploadUrl = uploadToken;

      if (dropboxToken) {
        try {
          const folderPath = `/CastBrief/${pkg.name}/${talent.full_name}`;
          await createFolder(dropboxToken, folderPath);
          const fileReq = await createFileRequest(
            dropboxToken,
            `${talent.full_name} - ${pkg.name}`,
            folderPath
          );
          uploadUrl = fileReq.url;
        } catch (e) {
          console.warn(`Dropbox folder/request failed for ${talent.full_name}:`, e);
          // Fall back to token-based upload
        }
      }

      await supabase
        .from("package_talents")
        .update({
          media_requested: true,
          upload_status: "pending",
          upload_token: uploadToken,
          upload_url: uploadUrl,
        })
        .eq("id", pt.id);

      uploadUrls.push({
        talentId: pt.talent_id,
        talentName: talent.full_name,
        uploadUrl: uploadUrl.startsWith("http") ? uploadUrl : `/upload/${uploadToken}`,
      });
    }

    // Create shared folder link if Dropbox was used
    if (dropboxToken) {
      try {
        const folderUrl = await getSharedFolderLink(
          dropboxToken,
          `/CastBrief/${pkg.name}`
        );
        await supabase
          .from("packages")
          .update({ dropbox_folder_url: folderUrl })
          .eq("id", packageId);
      } catch (e) {
        console.warn("Could not create shared folder link:", e);
      }
    }

    // Send email to agent
    const agentEmail = profile?.id;
    // Get agent email from auth
    const { data: authData } = await supabase.auth.admin.getUserById(profile.id);
    if (authData?.user?.email) {
      const talentNames = selectedTalents.map(
        (pt) => (pt.talents as any).full_name
      );
      const { subject, html } = renderMediaRequestEmail({
        clientName: clientName || pkg.client_name || "A client",
        packageName: pkg.name,
        talentNames,
        token: pkg.token,
      });
      try {
        await sendEmail(authData.user.email, subject, html);
      } catch (e) {
        console.warn("Failed to send media request email:", e);
      }
    }

    // Store media request details on the package
    await supabase
      .from("packages")
      .update({
        status: "media_requested",
        media_request_message: message || null,
        media_request_link: link || null,
        media_request_attachment_url: attachmentUrl || null,
      })
      .eq("id", packageId);

    return NextResponse.json({ success: true, uploadUrls });
  } catch (error) {
    console.error("Media request error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
