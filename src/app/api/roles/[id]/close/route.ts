import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/resend/client";
import { renderProjectClosedEmail } from "@/lib/resend/templates/ProjectClosedEmail";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: roleId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const message = body.message || "";

    // Get role + project info
    const admin = createAdminClient();
    const { data: role } = await admin
      .from("roles")
      .select("id, name, project_id")
      .eq("id", roleId)
      .single();

    if (!role) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    const { data: project } = await admin
      .from("projects")
      .select("id, name, client_id")
      .eq("id", role.project_id)
      .single();

    if (!project || project.client_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Collect agent emails from role_packages
    const { data: rolePackages } = await admin
      .from("role_packages")
      .select("package_id, packages(agent_id, profiles:agent_id(email, full_name))")
      .eq("role_id", roleId);

    const agentEmails = new Set<string>();
    const talentEmails = new Set<string>();

    for (const rp of rolePackages || []) {
      const pkg = (rp as any).packages;
      if (pkg?.profiles?.email) {
        agentEmails.add(pkg.profiles.email);
      }

      // Get talent emails from this package
      const { data: pts } = await admin
        .from("package_talents")
        .select("talents(email, full_name)")
        .eq("package_id", rp.package_id);

      for (const pt of pts || []) {
        const talent = (pt as any).talents;
        if (talent?.email) {
          talentEmails.add(talent.email);
        }
      }
    }

    // Also collect from package_requests for this role
    const { data: requests } = await admin
      .from("package_requests")
      .select("agent_email")
      .eq("role_id", roleId);

    for (const req of requests || []) {
      if (req.agent_email) agentEmails.add(req.agent_email);
    }

    // Send emails
    const allEmails = [...agentEmails, ...talentEmails];
    const { subject, html } = renderProjectClosedEmail({
      projectName: `${project.name} — ${role.name}`,
      message: message || `The role "${role.name}" in "${project.name}" has been cast. Thank you for your submissions.`,
    });

    for (const email of allEmails) {
      try {
        await sendEmail(email, subject, html);
      } catch (e) {
        console.error("Failed to send close email to:", email, e);
      }
    }

    return NextResponse.json({
      success: true,
      emailsSent: allEmails.length,
    });
  } catch (error) {
    console.error("Close role error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
