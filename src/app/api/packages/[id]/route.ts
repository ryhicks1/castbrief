import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(
  request: Request,
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

    // Verify ownership
    const { data: pkg } = await supabase
      .from("packages")
      .select("id")
      .eq("id", packageId)
      .eq("agent_id", user.id)
      .single();

    if (!pkg) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = await request.json();
    const { agent_notes, talent_updates } = body as {
      agent_notes?: string;
      talent_updates?: Array<{
        id: string;
        sort_order?: number;
        agent_note?: string;
        group_label?: string | null;
      }>;
    };

    // Update package-level fields
    if (agent_notes !== undefined) {
      await supabase
        .from("packages")
        .update({ agent_notes })
        .eq("id", packageId);
    }

    // Update individual talent entries
    if (talent_updates && talent_updates.length > 0) {
      for (const update of talent_updates) {
        const { id, ...fields } = update;
        if (Object.keys(fields).length > 0) {
          await supabase
            .from("package_talents")
            .update(fields)
            .eq("id", id)
            .eq("package_id", packageId);
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Package PATCH error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
