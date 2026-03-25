import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: formId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const admin = createAdminClient();

    // Fetch form and verify project ownership
    const { data: form } = await admin
      .from("project_forms")
      .select("id, project_id, name, fields")
      .eq("id", formId)
      .single();

    if (!form) return NextResponse.json({ error: "Form not found" }, { status: 404 });

    const { data: project } = await supabase
      .from("projects")
      .select("id, client_id")
      .eq("id", form.project_id)
      .single();

    if (!project || project.client_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch responses
    const { data: responses, error } = await admin
      .from("form_responses")
      .select("id, form_id, user_id, talent_name, talent_email, data, file_urls, created_at")
      .eq("form_id", formId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Responses fetch error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Check if CSV format requested
    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format");

    if (format === "csv") {
      const fields = form.fields as Array<{
        id: string;
        type: string;
        label: string;
      }>;

      // Build CSV headers
      const headers = [
        "Submitted At",
        "Name",
        "Email",
        ...fields
          .filter((f) => f.type !== "heading")
          .map((f) => f.label),
        "File URLs",
      ];

      const escapeCsv = (val: string) => {
        if (val.includes(",") || val.includes('"') || val.includes("\n")) {
          return `"${val.replace(/"/g, '""')}"`;
        }
        return val;
      };

      const rows = (responses || []).map((r) => {
        const data = r.data as Record<string, any>;
        return [
          new Date(r.created_at).toISOString(),
          r.talent_name || "",
          r.talent_email || "",
          ...fields
            .filter((f) => f.type !== "heading")
            .map((f) => {
              const val = data[f.id];
              if (Array.isArray(val)) return val.join("; ");
              return val != null ? String(val) : "";
            }),
          Array.isArray(r.file_urls) ? (r.file_urls as string[]).join("; ") : "",
        ].map(escapeCsv);
      });

      const csv = [headers.map(escapeCsv).join(","), ...rows.map((r) => r.join(","))].join(
        "\n"
      );

      return new Response(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="${form.name.replace(/[^a-zA-Z0-9]/g, "_")}_responses.csv"`,
        },
      });
    }

    return NextResponse.json({ form, responses: responses || [] });
  } catch (error) {
    console.error("Responses GET error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
