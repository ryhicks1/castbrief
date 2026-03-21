import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/supabase/org";

function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  const lines = text.split(/\r?\n/);

  for (const line of lines) {
    if (!line.trim()) continue;
    const fields: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (inQuotes) {
        if (char === '"' && line[i + 1] === '"') {
          current += '"';
          i++;
        } else if (char === '"') {
          inQuotes = false;
        } else {
          current += char;
        }
      } else {
        if (char === '"') {
          inQuotes = true;
        } else if (char === ",") {
          fields.push(current.trim());
          current = "";
        } else {
          current += char;
        }
      }
    }
    fields.push(current.trim());
    rows.push(fields);
  }

  return rows;
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

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "agent") {
      return NextResponse.json({ error: "Agents only" }, { status: 403 });
    }

    const orgMembership = await getCurrentOrg(supabase, user.id);
    if (!orgMembership) {
      return NextResponse.json({ error: "No organization" }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const text = await file.text();
    const rows = parseCSV(text);

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "Empty CSV file" },
        { status: 400 }
      );
    }

    // First row is headers
    const headers = rows[0].map((h) => h.toLowerCase().replace(/\s+/g, "_"));
    const nameIndex = headers.indexOf("full_name");

    if (nameIndex === -1) {
      return NextResponse.json(
        { error: "CSV must have a 'full_name' column" },
        { status: 400 }
      );
    }

    const emailIndex = headers.indexOf("email");
    const phoneIndex = headers.indexOf("phone");
    const ageIndex = headers.indexOf("age");
    const locationIndex = headers.indexOf("location");
    const culturalBgIndex = headers.indexOf("cultural_background");

    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const fullName = row[nameIndex]?.trim();

      if (!fullName) {
        skipped++;
        continue;
      }

      try {
        const talentData: Record<string, unknown> = {
          agent_id: user.id,
          org_id: orgMembership.orgId,
          full_name: fullName,
        };

        if (emailIndex >= 0 && row[emailIndex]) {
          talentData.email = row[emailIndex].trim();
        }
        if (phoneIndex >= 0 && row[phoneIndex]) {
          talentData.phone = row[phoneIndex].trim();
        }
        if (ageIndex >= 0 && row[ageIndex]) {
          const age = parseInt(row[ageIndex].trim(), 10);
          if (!isNaN(age)) talentData.age = age;
        }
        if (locationIndex >= 0 && row[locationIndex]) {
          talentData.location = row[locationIndex].trim();
        }
        if (culturalBgIndex >= 0 && row[culturalBgIndex]) {
          talentData.cultural_background = row[culturalBgIndex].trim();
        }

        const { error: insertError } = await supabase
          .from("talents")
          .insert(talentData);

        if (insertError) {
          errors.push(`Row ${i + 1} (${fullName}): ${insertError.message}`);
          skipped++;
        } else {
          imported++;
        }
      } catch (e) {
        errors.push(`Row ${i + 1} (${fullName}): Unexpected error`);
        skipped++;
      }
    }

    return NextResponse.json({ imported, skipped, errors });
  } catch (error) {
    console.error("Bulk import error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
