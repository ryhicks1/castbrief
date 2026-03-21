import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/resend/client";
import { renderUploadPromptEmail } from "@/lib/resend/templates/UploadPromptEmail";

export async function POST(request: Request) {
  try {
    const { packageTalentId } = await request.json();
    if (!packageTalentId) {
      return NextResponse.json({ error: "packageTalentId required" }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data: pt } = await supabase
      .from("package_talents")
      .select("id, upload_token, talents(full_name), packages(name, agent_id, profiles:agent_id(full_name, agency_name))")
      .eq("id", packageTalentId)
      .single();

    if (!pt) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const talent = (pt as any).talents;
    const pkg = (pt as any).packages;
    const agentProfile = pkg?.profiles;

    // For now we can't send email to talent directly (we don't have their email)
    // This would need talent email in the talent table
    // For now, return success as a no-op placeholder
    console.log(`Upload reminder would be sent for ${talent.full_name} (token: ${pt.upload_token})`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Send upload reminder error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
