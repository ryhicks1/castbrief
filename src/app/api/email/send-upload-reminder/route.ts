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
      .select("id, upload_token, talents(full_name, email, user_id), packages(name, agent_id, profiles:agent_id(full_name, agency_name))")
      .eq("id", packageTalentId)
      .single();

    if (!pt) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const talent = (pt as Record<string, unknown>).talents as { full_name: string; email?: string; user_id?: string } | null;
    const pkg = (pt as Record<string, unknown>).packages as { name: string; agent_id: string; profiles?: { full_name: string; agency_name?: string } } | null;
    const agentProfile = pkg?.profiles;

    // Try to get talent email: first from talent record, then from auth user
    let talentEmail = talent?.email;

    if (!talentEmail && talent?.user_id) {
      const { data: authUser } = await supabase.auth.admin.getUserById(talent.user_id);
      talentEmail = authUser?.user?.email;
    }

    if (!talentEmail) {
      return NextResponse.json(
        { error: "No email address on file for this talent. They may need to create an account first." },
        { status: 422 }
      );
    }

    const { subject, html } = renderUploadPromptEmail({
      agentName: agentProfile?.agency_name || agentProfile?.full_name || "Your Agent",
      packageName: pkg?.name || "Untitled Package",
      talentName: talent?.full_name || "Talent",
      uploadToken: pt.upload_token,
    });

    await sendEmail(talentEmail, subject, html);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Send upload reminder error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
