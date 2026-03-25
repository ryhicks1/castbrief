import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/supabase/org";

const JOTFORM_API = "https://api.jotform.com";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orgMembership = await getCurrentOrg(supabase, user.id);
    if (!orgMembership) {
      return NextResponse.json({ error: "No organization" }, { status: 403 });
    }

    // Get JotForm API key
    const { data: org } = await supabase
      .from("organizations")
      .select("jotform_api_key")
      .eq("id", orgMembership.orgId)
      .single();

    const apiKey = org?.jotform_api_key;
    if (!apiKey) {
      return NextResponse.json(
        { error: "JotForm not connected" },
        { status: 400 }
      );
    }

    // Fetch all forms
    const res = await fetch(
      `${JOTFORM_API}/user/forms?apiKey=${apiKey}&limit=100&orderby=created_at`,
      { next: { revalidate: 0 } }
    );

    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to fetch forms from JotForm" },
        { status: 502 }
      );
    }

    const data = await res.json();
    const forms = (data.content || []).map((f: any) => ({
      id: f.id,
      title: f.title,
      url: f.url,
      status: f.status,
      responseCount: parseInt(f.count || "0", 10),
      createdAt: f.created_at,
    }));

    return NextResponse.json({ forms });
  } catch (error) {
    console.error("JotForm forms GET error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
