import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { renderInviteEmail } from "@/lib/resend/templates/InviteEmail";
import { sendEmail } from "@/lib/resend/client";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, full_name, agency_name")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "agent") {
      return NextResponse.json({ error: "Agents only" }, { status: 403 });
    }

    const body = await request.json();
    const { emails } = body as { emails: string[] };

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json(
        { error: "emails array is required" },
        { status: 400 }
      );
    }

    const agentName = profile.full_name || "Your Agent";
    const agencyName = profile.agency_name || profile.full_name || "CastingBrief";
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    let sent = 0;
    let failed = 0;

    for (const email of emails) {
      const trimmed = email.trim();
      if (!trimmed) continue;

      try {
        // Create roster invite
        const { data: invite, error: inviteError } = await supabase
          .from("roster_invites")
          .insert({
            agent_id: user.id,
            email: trimmed,
          })
          .select("token")
          .single();

        if (inviteError || !invite) {
          failed++;
          continue;
        }

        const inviteUrl = `${baseUrl}/join/${invite.token}`;

        const { subject, html } = renderInviteEmail({
          agentName,
          agencyName,
          talentName: "Talent",
          inviteUrl,
        });

        await sendEmail(trimmed, subject, html);
        sent++;
      } catch (e) {
        console.error(`Failed to invite ${trimmed}:`, e);
        failed++;
      }
    }

    return NextResponse.json({ sent, failed });
  } catch (error) {
    console.error("Bulk invite error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
