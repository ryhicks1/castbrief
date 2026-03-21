import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { token, ...updates } = body;

    if (!token) {
      return NextResponse.json({ error: "Token required" }, { status: 401 });
    }

    const supabase = createAdminClient();

    // Verify the package_talent belongs to a package with this token
    const { data: pt, error: ptError } = await supabase
      .from("package_talents")
      .select("id, package_id, packages!inner(id, token, status)")
      .eq("id", id)
      .single();

    if (ptError || !pt) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const pkg = (pt as any).packages;
    if (pkg.token !== token) {
      return NextResponse.json({ error: "Invalid token" }, { status: 403 });
    }

    // Only allow specific fields to be updated
    const allowed: Record<string, any> = {};
    if ("client_pick" in updates) allowed.client_pick = updates.client_pick;
    if ("client_comment" in updates)
      allowed.client_comment = updates.client_comment;
    if ("is_hidden_by_client" in updates)
      allowed.is_hidden_by_client = updates.is_hidden_by_client;

    if (Object.keys(allowed).length === 0) {
      return NextResponse.json({ error: "No valid fields" }, { status: 400 });
    }

    const { error: updateError } = await supabase
      .from("package_talents")
      .update(allowed)
      .eq("id", id);

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    // Update package status to 'viewed' on first interaction
    if (pkg.status === "sent") {
      await supabase
        .from("packages")
        .update({ status: "viewed", last_viewed_at: new Date().toISOString() })
        .eq("id", pkg.id);
    } else {
      await supabase
        .from("packages")
        .update({ last_viewed_at: new Date().toISOString() })
        .eq("id", pkg.id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Package talent update error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
