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

    // Verify the user is an agent
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "agent") {
      return NextResponse.json({ error: "Agents only" }, { status: 403 });
    }

    const body = await request.json();
    const { talentName, email } = body as {
      talentName?: string;
      email?: string;
    };

    const { data, error } = await supabase
      .from("roster_invites")
      .insert({
        agent_id: user.id,
        email: email || null,
        talent_name: talentName || null,
      })
      .select("token")
      .single();

    if (error) {
      console.error("Invite insert error:", error);
      return NextResponse.json(
        { error: "Failed to create invite" },
        { status: 500 }
      );
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const url = `${baseUrl}/join/${data.token}`;

    // Send invite email if email was provided
    if (email) {
      try {
        const { data: agentProfile } = await supabase
          .from("profiles")
          .select("full_name, agency_name")
          .eq("id", user.id)
          .single();

        const agentName = agentProfile?.full_name || "Your Agent";
        const agencyName = agentProfile?.agency_name || agentProfile?.full_name || "CastingBrief";

        const { subject, html } = renderInviteEmail({
          agentName,
          agencyName,
          talentName: talentName || "Talent",
          inviteUrl: url,
        });
        await sendEmail(email, subject, html);
      } catch (e) {
        console.error("Failed to send invite email:", e);
      }
    }

    return NextResponse.json({ token: data.token, url });
  } catch (error) {
    console.error("Invite error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
