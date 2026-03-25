import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/supabase/org";

const JOTFORM_API = "https://api.jotform.com";

function maskApiKey(key: string): string {
  if (key.length <= 8) return "****";
  return key.slice(0, 4) + "****" + key.slice(-4);
}

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

    // Get the stored API key
    const { data: org } = await supabase
      .from("organizations")
      .select("jotform_api_key")
      .eq("id", orgMembership.orgId)
      .single();

    const apiKey = org?.jotform_api_key;
    if (!apiKey) {
      return NextResponse.json({
        connected: false,
        apiKey: null,
        forms: [],
      });
    }

    // Fetch forms list from JotForm
    let forms: any[] = [];
    try {
      const res = await fetch(
        `${JOTFORM_API}/user/forms?apiKey=${apiKey}&limit=50&orderby=created_at`,
        { next: { revalidate: 0 } }
      );
      if (res.ok) {
        const data = await res.json();
        forms = (data.content || []).map((f: any) => ({
          id: f.id,
          title: f.title,
          url: f.url,
          status: f.status,
          responseCount: parseInt(f.count || "0", 10),
        }));
      }
    } catch {
      // If form fetch fails, still return connected status
    }

    return NextResponse.json({
      connected: true,
      apiKey: maskApiKey(apiKey),
      forms,
    });
  } catch (error) {
    console.error("JotForm GET error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orgMembership = await getCurrentOrg(supabase, user.id);
    if (!orgMembership || orgMembership.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { apiKey } = body;

    if (!apiKey || typeof apiKey !== "string" || apiKey.trim().length < 10) {
      return NextResponse.json(
        { error: "Invalid API key" },
        { status: 400 }
      );
    }

    // Test the key against JotForm API
    const testRes = await fetch(`${JOTFORM_API}/user?apiKey=${apiKey.trim()}`);
    if (!testRes.ok) {
      return NextResponse.json(
        { error: "Invalid JotForm API key. Please check and try again." },
        { status: 400 }
      );
    }

    const testData = await testRes.json();
    const formCountRes = await fetch(
      `${JOTFORM_API}/user/forms?apiKey=${apiKey.trim()}&limit=1`
    );
    let formCount = 0;
    if (formCountRes.ok) {
      const formData = await formCountRes.json();
      formCount = formData.resultSet?.count || 0;
    }

    // Store on the organization
    const { error } = await supabase
      .from("organizations")
      .update({ jotform_api_key: apiKey.trim() })
      .eq("id", orgMembership.orgId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      formCount,
      username: testData.content?.username || null,
    });
  } catch (error) {
    console.error("JotForm POST error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orgMembership = await getCurrentOrg(supabase, user.id);
    if (!orgMembership || orgMembership.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { error } = await supabase
      .from("organizations")
      .update({ jotform_api_key: null })
      .eq("id", orgMembership.orgId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("JotForm DELETE error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
