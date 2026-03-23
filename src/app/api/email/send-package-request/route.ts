import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/resend/client";
import { renderPackageRequestEmail } from "@/lib/resend/templates/PackageRequestEmail";

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
    const { agentEmail, projectName, roleName, brief, formUrl } = body;

    if (!agentEmail || !projectName) {
      return NextResponse.json(
        { error: "agentEmail and projectName are required" },
        { status: 400 }
      );
    }

    // Get client name
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();

    const clientName = profile?.full_name || "A client";

    const { subject, html } = renderPackageRequestEmail({
      clientName,
      projectName,
      roleName: roleName || null,
      brief: brief || null,
      formUrl: formUrl || undefined,
    });

    try {
      await sendEmail(agentEmail, subject, html);
    } catch (emailError) {
      console.error("Package request email failed:", emailError);
      // Don't fail the request - the DB row was already inserted
      return NextResponse.json({ success: true, emailSent: false });
    }

    return NextResponse.json({ success: true, emailSent: true });
  } catch (error) {
    console.error("Send package request email error:", error);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    );
  }
}
