import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/resend/client";
import { renderProjectClosedEmail } from "@/lib/resend/templates/ProjectClosedEmail";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Verify project ownership
    const { data: project } = await supabase
      .from("projects")
      .select("id, name, client_id, roles(id)")
      .eq("id", projectId)
      .eq("client_id", user.id)
      .single();

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const body = await request.json();
    const customMessage = body.message || "";

    // Update project status to "closed"
    const { error: updateError } = await supabase
      .from("projects")
      .update({ status: "closed" })
      .eq("id", projectId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Collect agent emails from package_requests
    const { data: packageRequests } = await supabase
      .from("package_requests")
      .select("agent_email")
      .eq("project_id", projectId);

    const agentEmails = new Set<string>();
    if (packageRequests) {
      for (const pr of packageRequests) {
        if (pr.agent_email) agentEmails.add(pr.agent_email);
      }
    }

    // Collect agent emails + talent emails from role_packages -> packages -> package_talents
    const roleIds = (project.roles || []).map((r: any) => r.id);
    const talentEmails = new Set<string>();

    if (roleIds.length > 0) {
      const { data: rolePackages } = await supabase
        .from("role_packages")
        .select("package_id, packages(id, agent_id, profiles:agent_id(email), package_talents(talent_id, talents(email)))")
        .in("role_id", roleIds);

      if (rolePackages) {
        for (const rp of rolePackages) {
          const pkg = rp.packages as any;
          if (pkg?.profiles?.email) {
            agentEmails.add(pkg.profiles.email);
          }
          if (pkg?.package_talents) {
            for (const pt of pkg.package_talents) {
              if (pt.talents?.email) {
                talentEmails.add(pt.talents.email);
              }
            }
          }
        }
      }
    }

    // Send emails
    const { subject, html } = renderProjectClosedEmail({
      projectName: project.name,
      message: customMessage,
    });

    const allEmails = [...agentEmails, ...talentEmails];
    const sendResults = await Promise.allSettled(
      allEmails.map((email) => sendEmail(email, subject, html))
    );

    const sent = sendResults.filter((r) => r.status === "fulfilled").length;
    const failed = sendResults.filter((r) => r.status === "rejected").length;

    return NextResponse.json({
      success: true,
      emailsSent: sent,
      emailsFailed: failed,
    });
  } catch (error) {
    console.error("Close project error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
