import { ImageResponse } from "next/og";
import { createAdminClient } from "@/lib/supabase/admin";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = createAdminClient();

  const { data: pkg } = await supabase
    .from("packages")
    .select(
      `
      name,
      profiles:agent_id(full_name, agency_name),
      package_talents(id)
    `
    )
    .eq("token", token)
    .single();

  const agentProfile = pkg?.profiles as any;
  const packageName = pkg?.name || "Talent Package";
  const agencyName =
    agentProfile?.agency_name || agentProfile?.full_name || "CastingBrief";
  const talentCount = pkg?.package_talents?.length ?? 0;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#0F0F12",
          padding: "60px",
        }}
      >
        {/* Gold accent line */}
        <div
          style={{
            width: "80px",
            height: "4px",
            backgroundColor: "#B8964C",
            marginBottom: "32px",
            borderRadius: "2px",
            display: "flex",
          }}
        />

        {/* Branding */}
        <div
          style={{
            fontSize: "24px",
            fontWeight: 600,
            color: "#B8964C",
            letterSpacing: "0.1em",
            textTransform: "uppercase" as const,
            marginBottom: "24px",
            display: "flex",
          }}
        >
          CastingBrief
        </div>

        {/* Package name */}
        <div
          style={{
            fontSize: "52px",
            fontWeight: 700,
            color: "#E8E3D8",
            textAlign: "center",
            lineHeight: 1.2,
            maxWidth: "900px",
            marginBottom: "20px",
            display: "flex",
          }}
        >
          {packageName}
        </div>

        {/* Agency / agent */}
        <div
          style={{
            fontSize: "22px",
            color: "#8B8D93",
            marginBottom: "32px",
            display: "flex",
          }}
        >
          by {agencyName}
        </div>

        {/* Talent count pill */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            backgroundColor: "rgba(184, 150, 76, 0.12)",
            border: "1px solid rgba(184, 150, 76, 0.25)",
            borderRadius: "999px",
            padding: "10px 28px",
            fontSize: "18px",
            color: "#B8964C",
          }}
        >
          {talentCount} {talentCount === 1 ? "talent" : "talents"}
        </div>
      </div>
    ),
    { ...size }
  );
}
