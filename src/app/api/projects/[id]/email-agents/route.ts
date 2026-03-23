import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/resend/client";
import { renderAgentMessageEmail } from "@/lib/resend/templates/AgentMessageEmail";

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
    const message = body.message;

    if (!message || !message.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // Get client profile name
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();

    const clientName = profile?.full_name || "A casting director";

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

    // Collect agent emails from role_packages -> packages -> profiles
    const roleIds = (project.roles || []).map((r: any) => r.id);
    if (roleIds.length > 0) {
      const { data: rolePackages } = await supabase
        .from("role_packages")
        .select("packages(agent_id, profiles:agent_id(email))")
        .in("role_id", roleIds);

      if (rolePackages) {
        for (const rp of rolePackages) {
          const pkg = rp.packages as any;
          if (pkg?.profiles?.email) {
            agentEmails.add(pkg.profiles.email);
          }
        }
      }
    }

    if (agentEmails.size === 0) {
      return NextResponse.json({ error: "No agents found for this project" }, { status: 400 });
    }

    const { subject, html } = renderAgentMessageEmail({
      clientName,
      projectName: project.name,
      message: message.trim(),
    });

    const sendResults = await Promise.allSettled(
      [...agentEmails].map((email) => sendEmail(email, subject, html))
    );

    const sent = sendResults.filter((r) => r.status === "fulfilled").length;
    const failed = sendResults.filter((r) => r.status === "rejected").length;

    return NextResponse.json({
      success: true,
      emailsSent: sent,
      emailsFailed: failed,
    });
  } catch (error) {
    console.error("Email agents error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
