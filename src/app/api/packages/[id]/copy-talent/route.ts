import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sourcePackageId } = await params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { targetPackageId } = body;

    if (!targetPackageId) {
      return NextResponse.json({ error: "targetPackageId required" }, { status: 400 });
    }

    // Verify ownership of both packages
    const { data: sourcePkg } = await supabase
      .from("packages")
      .select("id")
      .eq("id", sourcePackageId)
      .eq("agent_id", user.id)
      .single();

    const { data: targetPkg } = await supabase
      .from("packages")
      .select("id")
      .eq("id", targetPackageId)
      .eq("agent_id", user.id)
      .single();

    if (!sourcePkg || !targetPkg) {
      return NextResponse.json({ error: "Package not found" }, { status: 404 });
    }

    // Get source talents
    const { data: sourceTalents } = await supabase
      .from("package_talents")
      .select("talent_id, sort_order")
      .eq("package_id", sourcePackageId);

    if (!sourceTalents || sourceTalents.length === 0) {
      return NextResponse.json({ error: "No talent to copy" }, { status: 400 });
    }

    // Get existing talent in target to avoid duplicates
    const { data: existingTalent } = await supabase
      .from("package_talents")
      .select("talent_id")
      .eq("package_id", targetPackageId);

    const existingIds = new Set((existingTalent || []).map((t) => t.talent_id));
    const maxSort = (existingTalent || []).length;

    const newRows = sourceTalents
      .filter((t) => !existingIds.has(t.talent_id))
      .map((t, i) => ({
        package_id: targetPackageId,
        talent_id: t.talent_id,
        sort_order: maxSort + i,
      }));

    if (newRows.length === 0) {
      return NextResponse.json({ copied: 0, message: "All talent already in target package" });
    }

    await supabase.from("package_talents").insert(newRows);

    return NextResponse.json({ copied: newRows.length });
  } catch (error) {
    console.error("Copy talent error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
