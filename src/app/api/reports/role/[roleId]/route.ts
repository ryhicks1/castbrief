import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateTalentCSV, type TalentReportRow } from "@/lib/reports/csv";
import { generateTalentPDF } from "@/lib/reports/pdf";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ roleId: string }> }
) {
  try {
    const { roleId } = await params;
    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") || "pdf";
    const projectId = searchParams.get("projectId");

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch role with project info
    const { data: role } = await supabase
      .from("roles")
      .select("id, name, brief, project_id")
      .eq("id", roleId)
      .single();

    if (!role) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    // Verify project ownership
    const { data: project } = await supabase
      .from("projects")
      .select("id, name, brand, type, client_id")
      .eq("id", role.project_id)
      .single();

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Allow both project owner and agents
    if (project.client_id !== user.id) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      if (profile?.role !== "agent") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    // Fetch role_packages with full talent data
    const { data: rolePackages } = await supabase
      .from("role_packages")
      .select(`
        role_id, package_id,
        packages(
          id, agent_id,
          package_talents(
            id, talent_id, client_pick, client_comment, client_status, client_rating,
            talents(
              id, full_name, age, location, cultural_background,
              height_cm, weight_kg, photo_url, email, phone, links,
              talent_chips(chip_id, chips(id, label, color))
            )
          )
        )
      `)
      .eq("role_id", roleId);

    // Get agent profiles for agency names
    const agentIds = [...new Set((rolePackages || []).map((rp: any) => rp.packages?.agent_id).filter(Boolean))];
    const agentMap: Record<string, string> = {};
    if (agentIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, agency_name")
        .in("id", agentIds);
      for (const p of profiles || []) {
        agentMap[p.id] = p.agency_name || p.full_name || "Unknown";
      }
    }

    // Transform talent data
    const talents: (TalentReportRow & { photo_url?: string | null })[] = [];
    for (const rp of rolePackages || []) {
      const pkg = (rp as any).packages;
      if (!pkg) continue;
      const agencyName = agentMap[pkg.agent_id] || "Unknown Agency";
      for (const pt of pkg.package_talents || []) {
        const t = pt.talents || {};
        const chips = t.talent_chips?.map((tc: any) => tc.chips?.label).filter(Boolean) || [];
        talents.push({
          full_name: t.full_name || "Unknown",
          age: t.age,
          location: t.location,
          agency_name: agencyName,
          email: t.email,
          phone: t.phone,
          cultural_background: t.cultural_background,
          height_cm: t.height_cm,
          weight_kg: t.weight_kg,
          photo_url: t.photo_url,
          links: t.links || {},
          tags: chips,
          client_status: pt.client_status,
          client_rating: pt.client_rating,
          client_comment: pt.client_comment,
        });
      }
    }

    const metadata = {
      title: `${role.name} — Talent Report`,
      projectName: project.name,
      roleName: role.name,
      subtitle: `${talents.length} talent across ${agentIds.length} agenc${agentIds.length !== 1 ? "ies" : "y"}`,
    };

    if (format === "csv") {
      const csv = generateTalentCSV(talents, { includeClientFeedback: true });
      const filename = `${project.name}_${role.name}`.replace(/[^a-zA-Z0-9]/g, "_");
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="${filename}_report.csv"`,
        },
      });
    }

    const pdfData = await generateTalentPDF(talents, metadata);
    const filename = `${project.name}_${role.name}`.replace(/[^a-zA-Z0-9]/g, "_");
    return new NextResponse(pdfData as any, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}_report.pdf"`,
      },
    });
  } catch (error) {
    console.error("Role report generation error:", error);
    return NextResponse.json({ error: "Report generation failed" }, { status: 500 });
  }
}
