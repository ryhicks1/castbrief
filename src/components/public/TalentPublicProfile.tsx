import Image from "next/image";
import Link from "next/link";

const linkLabels: Record<string, { label: string; color: string }> = {
  casting_networks: { label: "Casting Networks", color: "bg-orange-500/20 text-orange-400" },
  actors_access: { label: "Actors Access", color: "bg-green-500/20 text-green-400" },
  spotlight: { label: "Spotlight", color: "bg-purple-500/20 text-purple-400" },
  showcast: { label: "Showcast", color: "bg-teal-500/20 text-teal-400" },
  imdb: { label: "IMDb", color: "bg-yellow-500/20 text-yellow-400" },
  youtube: { label: "YouTube", color: "bg-red-500/20 text-red-400" },
  tiktok: { label: "TikTok", color: "bg-blue-500/20 text-blue-400" },
  instagram: { label: "Instagram", color: "bg-pink-500/20 text-pink-400" },
};

interface TalentPublicProfileProps {
  talent: {
    id: string;
    full_name: string;
    age: number | null;
    gender: string | null;
    location: string | null;
    cultural_background: string | null;
    height_cm: number | null;
    weight_kg: number | null;
    about: string | null;
    special_skills: string[] | null;
    photo_url: string | null;
    links: Record<string, string> | null;
    talent_chips?: { chip_id: string; chips: { id: string; label: string; color: string } | { id: string; label: string; color: string }[] }[];
  };
  agencyName: string;
}

export default function TalentPublicProfile({ talent, agencyName }: TalentPublicProfileProps) {
  const activeLinks = Object.entries(talent.links || {}).filter(([, v]) => v && v.trim() !== "");
  const chips = (talent.talent_chips || []).map((tc) => {
    const chip = Array.isArray(tc.chips) ? tc.chips[0] : tc.chips;
    return chip;
  }).filter(Boolean);

  return (
    <div className="min-h-screen bg-[#0D0F14]">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link href="/" className="text-xs font-semibold text-[#B8964C] hover:text-[#D4B35C] transition">
            CastingBrief
          </Link>
        </div>

        <div className="rounded-2xl border border-[#1E2128] bg-[#13151A] overflow-hidden">
          {/* Photo + Info */}
          <div className="md:flex">
            {/* Photo */}
            <div className="md:w-1/3 shrink-0">
              {talent.photo_url ? (
                <div className="relative aspect-[3/4]">
                  <Image
                    src={talent.photo_url}
                    alt={talent.full_name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                </div>
              ) : (
                <div className="aspect-[3/4] bg-[#1E2128] flex items-center justify-center">
                  <span className="text-4xl font-bold text-[#8B8D93]">
                    {talent.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                  </span>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 p-6">
              <h1 className="text-2xl font-bold text-[#E8E3D8]">{talent.full_name}</h1>
              {agencyName && (
                <p className="text-sm text-[#C9A84C] mt-1">{agencyName}</p>
              )}

              <div className="flex flex-wrap gap-3 mt-4 text-sm text-[#8B8D93]">
                {talent.age && <span>Age {talent.age}</span>}
                {talent.gender && <span>{talent.gender}</span>}
                {talent.location && <span>{talent.location}</span>}
                {talent.cultural_background && <span>{talent.cultural_background}</span>}
              </div>

              {(talent.height_cm || talent.weight_kg) && (
                <div className="flex gap-3 mt-2 text-xs text-[#8B8D93]">
                  {talent.height_cm && <span>{talent.height_cm}cm</span>}
                  {talent.weight_kg && <span>{talent.weight_kg}kg</span>}
                </div>
              )}

              {/* Platform links */}
              {activeLinks.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-4">
                  {activeLinks.map(([key, url]) => {
                    const config = linkLabels[key] || { label: key, color: "bg-[#1E2128] text-[#8B8D93]" };
                    return (
                      <a
                        key={key}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium ${config.color} hover:opacity-80 transition`}
                      >
                        {config.label}
                      </a>
                    );
                  })}
                </div>
              )}

              {/* Tags */}
              {chips.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {chips.map((chip) => (
                    <span
                      key={chip.id}
                      className="rounded-full px-2.5 py-0.5 text-[10px] font-medium"
                      style={{
                        backgroundColor: `${chip.color}20`,
                        color: chip.color,
                      }}
                    >
                      {chip.label}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* About */}
          {talent.about && (
            <div className="border-t border-[#1E2128] p-6">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-[#8B8D93] mb-2">About</h2>
              <p className="text-sm text-[#E8E3D8] leading-relaxed whitespace-pre-line">{talent.about}</p>
            </div>
          )}

          {/* Skills */}
          {talent.special_skills && talent.special_skills.length > 0 && (
            <div className="border-t border-[#1E2128] p-6">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-[#8B8D93] mb-2">Skills</h2>
              <div className="flex flex-wrap gap-1.5">
                {talent.special_skills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full bg-[#1E2128] px-2.5 py-0.5 text-xs text-[#E8E3D8]"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-[10px] text-[#8B8D93] mt-6">
          Powered by <Link href="/" className="text-[#C9A84C] hover:underline">CastingBrief</Link>
        </p>
      </div>
    </div>
  );
}
