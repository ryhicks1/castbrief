import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/supabase/org";

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

    const { email, role } = await request.json();
    if (!email?.trim()) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }
    if (!["admin", "agent", "viewer"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    // Find user by email in profiles
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .eq("email", email.trim())
      .single();

    if (!profile) {
      return NextResponse.json(
        { error: "No user found with that email. They must sign up first." },
        { status: 404 }
      );
    }

    // Check if already a member
    const { data: existing } = await supabase
      .from("org_members")
      .select("id")
      .eq("org_id", orgMembership.orgId)
      .eq("user_id", profile.id)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "User is already a member of this organization" },
        { status: 409 }
      );
    }

    const { data, error } = await supabase
      .from("org_members")
      .insert({
        org_id: orgMembership.orgId,
        user_id: profile.id,
        role,
      })
      .select("id, user_id, role")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      member: {
        id: data.id,
        userId: data.user_id,
        role: data.role,
        fullName: profile.full_name || "Unknown",
        email: profile.email || "",
      },
    });
  } catch (error) {
    console.error("Invite member error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

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

    const { memberId, role } = await request.json();
    if (!memberId || !["admin", "agent", "viewer"].includes(role)) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { error } = await supabase
      .from("org_members")
      .update({ role })
      .eq("id", memberId)
      .eq("org_id", orgMembership.orgId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update member role error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
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

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "ID required" }, { status: 400 });
    }

    // Prevent removing self
    const { data: member } = await supabase
      .from("org_members")
      .select("user_id")
      .eq("id", id)
      .eq("org_id", orgMembership.orgId)
      .single();

    if (member?.user_id === user.id) {
      return NextResponse.json(
        { error: "Cannot remove yourself" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("org_members")
      .delete()
      .eq("id", id)
      .eq("org_id", orgMembership.orgId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Remove member error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
