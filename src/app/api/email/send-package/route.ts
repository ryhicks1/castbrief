import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/resend/client";
import { renderPackageLinkEmail } from "@/lib/resend/templates/PackageLinkEmail";
import { sendPackageSchema } from "@/lib/validation/schemas";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const parsed = sendPackageSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { packageId, recipientEmail, recipientName } = parsed.data;

    const supabase = createAdminClient();

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

    try {
      await sendEmail(recipientEmail, subject, html);
    } catch (emailError) {
      console.error("Email delivery failed:", emailError);
      return NextResponse.json(
        { error: "Failed to deliver email. Please check the recipient address and try again." },
        { status: 502 }
      );
    }

    // Only update status after email is confirmed sent
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
