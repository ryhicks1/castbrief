import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/supabase/org";
import { renderTalentMessageEmail } from "@/lib/resend/templates/TalentMessageEmail";
import { sendEmail } from "@/lib/resend/client";
import { z } from "zod";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify agent role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, full_name, agency_name")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "agent") {
      return NextResponse.json({ error: "Agents only" }, { status: 403 });
    }

    const body = await request.json();

    const messageSchema = z.object({
      package_id: z.string().uuid("Invalid package ID"),
      talent_id: z.string().uuid("Invalid talent ID").optional(),
      content: z.string().min(1, "Message content is required").max(5000, "Message is too long"),
    });

    const parsed = messageSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { package_id, talent_id, content } = parsed.data;

    const orgMembership = await getCurrentOrg(supabase, user.id);
    if (!orgMembership) {
      return NextResponse.json({ error: "No organization" }, { status: 403 });
    }

    // Verify package ownership
    const { data: pkg } = await supabase
      .from("packages")
      .select("id, name")
      .eq("id", package_id)
      .eq("org_id", orgMembership.orgId)
      .single();

    if (!pkg) {
      return NextResponse.json({ error: "Package not found" }, { status: 404 });
    }

    const agentName = profile.full_name || profile.agency_name || "Your Agent";

    if (talent_id) {
      // Send to single talent
      const { data: pt } = await supabase
        .from("package_talents")
        .select("id, talents(id, full_name, email)")
        .eq("package_id", package_id)
        .eq("talent_id", talent_id)
        .single();

      if (!pt) {
        return NextResponse.json(
          { error: "Talent not in package" },
          { status: 404 }
        );
      }

      const talent = Array.isArray(pt.talents) ? pt.talents[0] : pt.talents;

      await supabase.from("messages").insert({
        package_id,
        talent_id,
        sender_id: user.id,
        content: content.trim(),
      });

      if (talent?.email) {
        try {
          const { subject, html } = renderTalentMessageEmail({
            agentName,
            packageName: pkg.name,
            talentName: talent.full_name,
            messageContent: content.trim(),
          });
          await sendEmail(talent.email, subject, html);
        } catch (e) {
          console.error("Failed to send message email:", e);
        }
      }

      return NextResponse.json({ sent: 1 });
    } else {
      // Send to all talent in package
      const { data: packageTalents } = await supabase
        .from("package_talents")
        .select("id, talent_id, talents(id, full_name, email)")
        .eq("package_id", package_id);

      if (!packageTalents || packageTalents.length === 0) {
        return NextResponse.json(
          { error: "No talent in package" },
          { status: 400 }
        );
      }

      const messageRows = packageTalents.map((pt) => ({
        package_id,
        talent_id: pt.talent_id,
        sender_id: user.id,
        content: content.trim(),
      }));

      await supabase.from("messages").insert(messageRows);

      let emailsSent = 0;
      for (const pt of packageTalents) {
        const talent = Array.isArray(pt.talents) ? pt.talents[0] : pt.talents;
        if (talent?.email) {
          try {
            const { subject, html } = renderTalentMessageEmail({
              agentName,
              packageName: pkg.name,
              talentName: talent.full_name,
              messageContent: content.trim(),
            });
            await sendEmail(talent.email, subject, html);
            emailsSent++;
          } catch (e) {
            console.error(`Failed to email talent ${talent.full_name}:`, e);
          }
        }
      }

      return NextResponse.json({
        sent: packageTalents.length,
        emailed: emailsSent,
      });
    }
  } catch (error) {
    console.error("Messages error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
