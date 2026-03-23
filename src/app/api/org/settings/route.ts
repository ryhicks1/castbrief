import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/supabase/org";

export async function PATCH(request: Request) {
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
    const { name, logo_url, contact_email, contact_phone, website, brand_color } = body;

    // Build update object with only provided fields
    const updates: Record<string, any> = {};
    if (name !== undefined) {
      if (!name?.trim()) {
        return NextResponse.json({ error: "Name required" }, { status: 400 });
      }
      updates.name = name.trim();
    }
    if (logo_url !== undefined) updates.logo_url = logo_url;
    if (contact_email !== undefined) updates.contact_email = contact_email || null;
    if (contact_phone !== undefined) updates.contact_phone = contact_phone || null;
    if (website !== undefined) updates.website = website || null;
    if (brand_color !== undefined) updates.brand_color = brand_color || null;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const { error } = await supabase
      .from("organizations")
      .update(updates)
      .eq("id", orgMembership.orgId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update org settings error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
