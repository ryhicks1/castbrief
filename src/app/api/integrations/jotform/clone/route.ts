import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/supabase/org";

const JOTFORM_API = "https://api.jotform.com";

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
    if (!orgMembership) {
      return NextResponse.json({ error: "No organization" }, { status: 403 });
    }

    // Get JotForm API key from org
    const { data: org } = await supabase
      .from("organizations")
      .select("jotform_api_key")
      .eq("id", orgMembership.orgId)
      .single();

    const apiKey = org?.jotform_api_key;
    if (!apiKey) {
      return NextResponse.json(
        { error: "JotForm not connected. Please add your API key in Settings." },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { templateFormId, projectName, roleName, customQuestions } = body;

    if (!templateFormId) {
      return NextResponse.json(
        { error: "Template form ID is required" },
        { status: 400 }
      );
    }

    // Step 1: Clone the template form
    const cloneRes = await fetch(
      `${JOTFORM_API}/form/${templateFormId}/clone?apiKey=${apiKey}`,
      { method: "POST" }
    );

    if (!cloneRes.ok) {
      const cloneErr = await cloneRes.json().catch(() => null);
      return NextResponse.json(
        {
          error:
            cloneErr?.message ||
            "Failed to clone form. Check the template form ID.",
        },
        { status: 400 }
      );
    }

    const cloneData = await cloneRes.json();
    const clonedId = cloneData.content?.id;

    if (!clonedId) {
      return NextResponse.json(
        { error: "Clone succeeded but no form ID returned" },
        { status: 500 }
      );
    }

    // Step 2: Rename the cloned form
    const formTitle = [projectName, roleName, "Talent Form"]
      .filter(Boolean)
      .join(" - ");

    await fetch(
      `${JOTFORM_API}/form/${clonedId}/properties?apiKey=${apiKey}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          properties: { title: formTitle },
        }),
      }
    );

    // Step 3: Add custom questions if any
    if (customQuestions && Array.isArray(customQuestions) && customQuestions.length > 0) {
      for (const q of customQuestions) {
        const questionData: Record<string, any> = {
          type: mapQuestionType(q.type),
          text: q.label,
          required: q.required ? "Yes" : "No",
        };

        if (q.options && Array.isArray(q.options)) {
          questionData.options = q.options.join("|");
        }

        await fetch(
          `${JOTFORM_API}/form/${clonedId}/questions?apiKey=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ question: questionData }),
          }
        );
      }
    }

    // Step 4: Get the form URL
    const formRes = await fetch(
      `${JOTFORM_API}/form/${clonedId}?apiKey=${apiKey}`
    );
    let formUrl = "";
    if (formRes.ok) {
      const formData = await formRes.json();
      formUrl = formData.content?.url || `https://form.jotform.com/${clonedId}`;
    } else {
      formUrl = `https://form.jotform.com/${clonedId}`;
    }

    return NextResponse.json({
      formId: clonedId,
      formUrl,
      formTitle,
    });
  } catch (error) {
    console.error("JotForm clone error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

function mapQuestionType(type: string): string {
  const typeMap: Record<string, string> = {
    text: "control_textbox",
    textarea: "control_textarea",
    email: "control_email",
    phone: "control_phone",
    dropdown: "control_dropdown",
    radio: "control_radio",
    checkbox: "control_checkbox",
    number: "control_number",
    date: "control_datetime",
    file: "control_fileupload",
    fullname: "control_fullname",
    address: "control_address",
  };
  return typeMap[type] || "control_textbox";
}
