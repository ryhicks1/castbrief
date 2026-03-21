import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/resend/client";
import { renderUploadConfirmationEmail } from "@/lib/resend/templates/UploadConfirmationEmail";

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const supabase = createAdminClient();

    // Find the package_talent by upload_token
    const { data: pt, error: ptError } = await supabase
      .from("package_talents")
      .select("id, talent_id, package_id, talents(full_name), packages(name, agent_id)")
      .eq("upload_token", token)
      .single();

    if (ptError || !pt) {
      return NextResponse.json({ error: "Upload link not found" }, { status: 404 });
    }

    // Update upload status
    await supabase
      .from("package_talents")
      .update({ upload_status: "uploaded" })
      .eq("id", pt.id);

    // Send confirmation email to agent
    const pkg = (pt as any).packages;
    const talent = (pt as any).talents;

    const { data: authData } = await supabase.auth.admin.getUserById(
      pkg.agent_id
    );

    if (authData?.user?.email) {
      const { subject, html } = renderUploadConfirmationEmail({
        talentName: talent.full_name,
        packageName: pkg.name,
      });
      try {
        await sendEmail(authData.user.email, subject, html);
      } catch (e) {
        console.warn("Failed to send upload confirmation email:", e);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Upload confirm error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
