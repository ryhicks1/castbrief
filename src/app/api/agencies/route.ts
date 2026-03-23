import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch all organizations that have at least one org_member
    const { data: orgs, error: orgsError } = await supabase
      .from("organizations")
      .select(`
        id,
        name,
        slug,
        logo_url,
        org_members (
          user_id,
          role,
          profiles:user_id (
            email,
            full_name,
            location
          )
        )
      `)
      .order("name");

    if (orgsError) {
      console.error("Agencies fetch error:", orgsError);
      return NextResponse.json(
        { error: "Failed to fetch agencies" },
        { status: 500 }
      );
    }

    // Filter to orgs with at least one member and format the response
    const agencies = (orgs || [])
      .filter((org: any) => org.org_members && org.org_members.length > 0)
      .map((org: any) => {
        const members = org.org_members || [];
        // Use the first admin member's profile as the primary agent contact
        const adminMember = members.find((m: any) => m.role === "admin") || members[0];
        const profile = adminMember?.profiles;

        return {
          id: org.id,
          name: org.name,
          slug: org.slug,
          logo_url: org.logo_url,
          location: profile?.location || null,
          agentEmail: profile?.email || null,
          agentName: profile?.full_name || null,
          agentCount: members.length,
        };
      });

    // Group by location/region for convenience
    const grouped: Record<string, typeof agencies> = {};
    for (const agency of agencies) {
      const region = agency.location || "Unknown Region";
      if (!grouped[region]) {
        grouped[region] = [];
      }
      grouped[region].push(agency);
    }

    return NextResponse.json({ agencies, grouped });
  } catch (error) {
    console.error("Agencies error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
