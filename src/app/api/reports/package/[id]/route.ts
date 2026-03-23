import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateTalentCSV, type TalentReportRow } from "@/lib/reports/csv";
import { generateTalentPDF } from "@/lib/reports/pdf";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: packageId } = await params;
    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") || "pdf";

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch package with full talent data
    const { data: pkg } = await supabase
      .from("packages")
      .select(`
        id, name, client_name, status, created_at, agent_id,
        package_talents(
          id, talent_id, client_pick, client_comment, client_status, client_rating,
          agent_note, group_label,
          talents(
            id, full_name, age, location, cultural_background,
            height_cm, weight_kg, photo_url, email, phone, links,
            talent_chips(chip_id, chips(id, label, color))
          )
        )
      `)
      .eq("id", packageId)
      .single();

    if (!pkg) {
      return NextResponse.json({ error: "Package not found" }, { status: 404 });
    }

    // Verify ownership — allow both agent (owner) and client (via client_name)
    if (pkg.agent_id !== user.id) {
      // Check if user is a client who has access
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      if (profile?.role !== "client") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    // Get agent/agency name
    const { data: agentProfile } = await supabase
      .from("profiles")
      .select("full_name, agency_name")
      .eq("id", pkg.agent_id)
      .single();

    const agencyName = agentProfile?.agency_name || agentProfile?.full_name || "Unknown Agency";

    // Fetch org branding
    const { data: orgMember } = await supabase
      .from("org_members")
      .select("organizations(logo_url, contact_email, contact_phone, website, brand_color)")
      .eq("user_id", pkg.agent_id)
      .single();

    const orgBranding = (orgMember?.organizations as any) || {};

    // Transform talent data
    const talents: (TalentReportRow & { photo_url?: string | null })[] =
      (pkg.package_talents || []).map((pt: any) => {
        const t = pt.talents || {};
        const chips = t.talent_chips?.map((tc: any) => tc.chips?.label).filter(Boolean) || [];
        return {
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
        };
      });

    const metadata = {
      title: `Package: ${pkg.name}`,
      agencyName,
      generatedFor: pkg.client_name || undefined,
      subtitle: `${talents.length} talent · ${pkg.status}`,
      logoUrl: orgBranding.logo_url || null,
      brandColor: orgBranding.brand_color || null,
      contactEmail: orgBranding.contact_email || null,
      contactPhone: orgBranding.contact_phone || null,
      website: orgBranding.website || null,
    };

    if (format === "csv") {
      const csv = generateTalentCSV(talents, { includeClientFeedback: true });
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="${pkg.name.replace(/[^a-zA-Z0-9]/g, "_")}_report.csv"`,
        },
      });
    }

    // PDF
    const pdfData = await generateTalentPDF(talents, metadata);
    return new NextResponse(pdfData as any, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${pkg.name.replace(/[^a-zA-Z0-9]/g, "_")}_report.pdf"`,
      },
    });
  } catch (error) {
    console.error("Report generation error:", error);
    return NextResponse.json({ error: "Report generation failed" }, { status: 500 });
  }
}
