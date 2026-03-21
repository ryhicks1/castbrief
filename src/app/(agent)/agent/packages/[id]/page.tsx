import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import PackageReviewClient from "@/components/agent/PackageReviewClient";
import { ensureOrg, orgFilter } from "@/lib/supabase/org";

export default async function PackageReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const orgMembership = (await ensureOrg(supabase, user.id))!;

  const { data: pkg } = await supabase
    .from("packages")
    .select(
      `id, name, token, client_name, client_email, status, agent_notes,
       created_at, last_viewed_at, dropbox_folder_url,
       package_talents(
         id, talent_id, sort_order, client_pick, client_comment,
         client_status, client_rating,
         is_hidden_by_client, media_requested, upload_status,
         upload_token, agent_note, group_label,
         talents(
           id, full_name, age, location, cultural_background,
           height_cm, weight_kg, photo_url, links,
           talent_chips(chip_id, chips(id, label, color))
         )
       )`
    )
    .eq("id", id)
    .eq(orgFilter(orgMembership.orgId, user.id).column, orgFilter(orgMembership.orgId, user.id).value)
    .single();

  if (!pkg) redirect("/agent/dashboard");

  // Normalize joined data
  const talents = pkg.package_talents
    .map(
      (pt: {
        id: string;
        talent_id: string;
        sort_order: number;
        client_pick: boolean;
        client_comment: string | null;
        client_status: string | null;
        client_rating: number | null;
        is_hidden_by_client: boolean;
        media_requested: boolean;
        upload_status: string;
        upload_token: string | null;
        agent_note: string | null;
        group_label: string | null;
        talents:
          | {
              id: string;
              full_name: string;
              age: number | null;
              location: string | null;
              cultural_background: string | null;
              height_cm: number | null;
              weight_kg: number | null;
              photo_url: string | null;
              links: Record<string, string>;
              talent_chips: Array<{
                chip_id: string;
                chips:
                  | { id: string; label: string; color: string }
                  | { id: string; label: string; color: string }[];
              }>;
            }
          | Array<any>;
      }) => {
        const talent = Array.isArray(pt.talents)
          ? pt.talents[0]
          : pt.talents;
        if (!talent) return null;

        const chips = (talent.talent_chips || []).map(
          (tc: {
            chip_id: string;
            chips:
              | { id: string; label: string; color: string }
              | { id: string; label: string; color: string }[];
          }) => {
            const chip = Array.isArray(tc.chips)
              ? tc.chips[0]
              : tc.chips;
            return chip;
          }
        ).filter(Boolean);

        return {
          packageTalentId: pt.id,
          talentId: talent.id,
          sortOrder: pt.sort_order,
          clientPick: pt.client_pick,
          clientComment: pt.client_comment,
          clientStatus: pt.client_status as 'yes' | 'no' | 'maybe' | null,
          clientRating: pt.client_rating,
          isHiddenByClient: pt.is_hidden_by_client,
          mediaRequested: pt.media_requested,
          uploadStatus: pt.upload_status,
          agentNote: pt.agent_note,
          groupLabel: pt.group_label,
          full_name: talent.full_name,
          age: talent.age,
          location: talent.location,
          cultural_background: talent.cultural_background,
          photo_url: talent.photo_url,
          height_cm: talent.height_cm,
          weight_kg: talent.weight_kg,
          links: talent.links || {},
          chips,
        };
      }
    )
    .filter((t): t is NonNullable<typeof t> => t !== null)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <PackageReviewClient
      pkg={{
        id: pkg.id,
        name: pkg.name,
        token: pkg.token,
        client_name: pkg.client_name,
        client_email: pkg.client_email,
        status: pkg.status,
        agent_notes: pkg.agent_notes,
        created_at: pkg.created_at,
        last_viewed_at: pkg.last_viewed_at,
        dropbox_folder_url: pkg.dropbox_folder_url,
      }}
      talents={talents as any}
      agencyName={orgMembership.org?.name || ""}
    />
  );
}
