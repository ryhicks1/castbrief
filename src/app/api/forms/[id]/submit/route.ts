import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: formId } = await params;
    const admin = createAdminClient();

    // Fetch form definition
    const { data: form, error: formError } = await admin
      .from("project_forms")
      .select("id, name, fields")
      .eq("id", formId)
      .single();

    if (formError || !form) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    const body = await request.json();
    const { talent_name, talent_email, data, file_urls } = body;

    if (!talent_name || !talent_email) {
      return NextResponse.json(
        { error: "talent_name and talent_email are required" },
        { status: 400 }
      );
    }

    // Validate required fields against form definition
    const fields = form.fields as Array<{
      id: string;
      type: string;
      label: string;
      required: boolean;
    }>;
    const missingFields: string[] = [];

    for (const field of fields) {
      if (field.required && field.type !== "heading" && field.type !== "file") {
        const value = data?.[field.id];
        if (value === undefined || value === null || value === "") {
          missingFields.push(field.label);
        }
      }
    }

    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(", ")}` },
        { status: 400 }
      );
    }

    // Insert response
    const { data: response, error: insertError } = await admin
      .from("form_responses")
      .insert({
        form_id: formId,
        talent_name,
        talent_email,
        data: data || {},
        file_urls: file_urls || [],
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("Form response insert error:", insertError);
      return NextResponse.json(
        { error: "Failed to submit form" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, id: response.id });
  } catch (error) {
    console.error("Form submit error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
