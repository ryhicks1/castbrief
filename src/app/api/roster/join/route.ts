import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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
    const { token } = body as { token: string };

    if (!token) {
      return NextResponse.json(
        { error: "Token is required" },
        { status: 400 }
      );
    }

    // Look up the invite
    const { data: invite } = await supabase
      .from("roster_invites")
      .select("*")
      .eq("token", token)
      .eq("status", "pending")
      .single();

    if (!invite) {
      return NextResponse.json(
        { error: "Invalid or expired invite" },
        { status: 404 }
      );
    }

    // Ensure user has a profile with role = 'talent'
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id, role")
      .eq("id", user.id)
      .single();

    if (!existingProfile) {
      // Create a talent profile
      const { error: profileError } = await supabase.from("profiles").insert({
        id: user.id,
        role: "talent",
        full_name: invite.talent_name || "",
        email: user.email,
      });

      if (profileError) {
        console.error("Profile creation error:", profileError);
        return NextResponse.json(
          { error: "Failed to create profile" },
          { status: 500 }
        );
      }
    }

    // Check if a talent row already exists for this user under this agent
    const { data: existingTalent } = await supabase
      .from("talents")
      .select("id")
      .eq("user_id", user.id)
      .eq("agent_id", invite.agent_id)
      .single();

    let talentId: string;

    if (existingTalent) {
      talentId = existingTalent.id;
    } else {
      // Create a talent row linked to the agent
      const { data: newTalent, error: talentError } = await supabase
        .from("talents")
        .insert({
          agent_id: invite.agent_id,
          user_id: user.id,
          full_name: invite.talent_name || user.email || "Unknown",
        })
        .select("id")
        .single();

      if (talentError) {
        console.error("Talent creation error:", talentError);
        return NextResponse.json(
          { error: "Failed to create talent record" },
          { status: 500 }
        );
      }

      talentId = newTalent.id;
    }

    // Update invite status
    await supabase
      .from("roster_invites")
      .update({
        status: "accepted",
        accepted_at: new Date().toISOString(),
      })
      .eq("id", invite.id);

    return NextResponse.json({ success: true, talentId });
  } catch (error) {
    console.error("Join error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
