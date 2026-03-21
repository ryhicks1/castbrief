"use client";

import TalentForm from "@/components/agent/TalentForm";

interface ChipData {
  id: string;
  label: string;
  color: string;
}

interface TalentData {
  id: string;
  agent_id: string;
  full_name: string;
  age: number | null;
  location: string;
  cultural_background: string;
  height_cm: number | null;
  weight_kg: number | null;
  about: string;
  special_skills: string[];
  photo_url: string | null;
  links: Record<string, string>;
  email: string | null;
  phone: string | null;
  editing_locked: boolean;
  talent_chips?: { chip_id: string; chips: ChipData }[];
}

interface TalentProfileClientProps {
  talent: TalentData;
  chips: ChipData[];
  agencyName: string;
  isLocked: boolean;
}

export default function TalentProfileClient({
  talent,
  chips,
  agencyName,
  isLocked,
}: TalentProfileClientProps) {
  // Strip email and phone from what is displayed — talent should not see agent-internal contact fields
  const talentForForm = {
    ...talent,
    email: null,
    phone: null,
  };

  return (
    <div className="min-h-screen bg-[#0D0F14] px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center justify-between">
          <span className="text-2xl font-bold text-[#C9A84C]">CastBrief</span>
          <span className="text-sm text-[#8B8D93]">
            Roster: <span className="text-[#E8E3D8]">{agencyName}</span>
          </span>
        </div>

        {isLocked && (
          <div className="mb-6 rounded-lg border border-[#2A2D35] bg-[#1E2128] p-3">
            <p className="text-sm text-[#8B8D93]">
              Your profile is currently locked for editing by your agent.
              Contact your agent if you need to make changes.
            </p>
          </div>
        )}

        <TalentForm
          talent={talentForForm}
          chips={chips}
          agentId={talent.agent_id}
          isLocked={isLocked}
        />
      </div>
    </div>
  );
}
