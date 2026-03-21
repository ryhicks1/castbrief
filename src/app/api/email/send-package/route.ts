import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/resend/client";
import { renderPackageLinkEmail } from "@/lib/resend/templates/PackageLinkEmail";

export async function POST(request: Request) {
  try {
    const { packageId, recipientEmail, recipientName } = await request.json();

    if (!packageId || !recipientEmail) {
      return NextResponse.json(
        { error: "packageId and recipientEmail are required" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Fetch package with agent profile
    const { data: pkg, error: pkgError } = await supabase
      .from("packages")
      .select("id, name, token, agent_id, status")
      .eq("id", packageId)
      .single();

    if (pkgError || !pkg) {
      return NextResponse.json({ error: "Package not found" }, { status: 404 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, agency_name")
      .eq("id", pkg.agent_id)
      .single();

    const agentName = profile?.agency_name || profile?.full_name || "Your Agent";

    const { subject, html } = renderPackageLinkEmail({
      agentName,
      packageName: pkg.name,
      token: pkg.token,
    });

    await sendEmail(recipientEmail, subject, html);

    // Update package status to 'sent' and store recipient info
    await supabase
      .from("packages")
      .update({
        status: "sent",
        client_email: recipientEmail,
        client_name: recipientName || null,
      })
      .eq("id", packageId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Send package email error:", error);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    );
  }
}
