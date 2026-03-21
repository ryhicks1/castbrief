import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/supabase/org";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: packageId } = await params;
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

    // Verify user owns this package via org_id
    const { data: pkg } = await supabase
      .from("packages")
      .select("id, name, client_name, client_email, org_id, agent_id")
      .eq("id", packageId)
      .eq("org_id", orgMembership.orgId)
      .single();

    if (!pkg) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Fetch package_talents where client_status = 'yes' OR client_rating > 0
    const { data: selectedTalents } = await supabase
      .from("package_talents")
      .select("talent_id, sort_order")
      .eq("package_id", packageId)
      .or("client_status.eq.yes,client_rating.gt.0");

    if (!selectedTalents || selectedTalents.length === 0) {
      return NextResponse.json(
        { error: "No selected talent to copy" },
        { status: 400 }
      );
    }

    // Create new package
    const { data: newPkg, error: createError } = await supabase
      .from("packages")
      .insert({
        name: `${pkg.name} (Callback)`,
        client_name: pkg.client_name,
        client_email: pkg.client_email,
        status: "draft",
        org_id: pkg.org_id,
        agent_id: pkg.agent_id,
      })
      .select("id, token")
      .single();

    if (createError || !newPkg) {
      console.error("Failed to create package:", createError);
      return NextResponse.json(
        { error: "Failed to create package" },
        { status: 500 }
      );
    }

    // Create package_talents rows for selected talent (clean slate)
    const talentRows = selectedTalents.map((t, index) => ({
      package_id: newPkg.id,
      talent_id: t.talent_id,
      sort_order: index,
    }));

    const { error: talentError } = await supabase
      .from("package_talents")
      .insert(talentRows);

    if (talentError) {
      console.error("Failed to copy talents:", talentError);
      return NextResponse.json(
        { error: "Failed to copy talents" },
        { status: 500 }
      );
    }

    return NextResponse.json({ id: newPkg.id, token: newPkg.token });
  } catch (error) {
    console.error("Copy package error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
