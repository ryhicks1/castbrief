"use client";

const sizeMap = {
  sm: "h-8 w-8 text-xs",
  md: "h-11 w-11 text-sm",
  lg: "h-16 w-16 text-lg",
} as const;

interface AvatarProps {
  src?: string | null;
  name: string;
  size?: keyof typeof sizeMap;
  className?: string;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function Avatar({
  src,
  name,
  size = "md",
  className = "",
}: AvatarProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`rounded-full object-cover ${sizeMap[size]} ${className}`}
      />
    );
  }

  return (
    <div
      className={`flex items-center justify-center rounded-full bg-[#C9A84C] font-semibold text-[#0D0F14] ${sizeMap[size]} ${className}`}
    >
      {getInitials(name)}
    </div>
  );
}

/* ─── InitialsAvatar ─── reusable initials-only avatar with custom pixel size */
export function InitialsAvatar({
  name,
  size = 40,
}: {
  name: string;
  size?: number;
}) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      className="rounded-full flex items-center justify-center shrink-0 font-semibold"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.35,
        background: "linear-gradient(135deg, #C9A84C, #8B6D1A)",
        color: "#0D0F14",
      }}
    >
      {initials}
    </div>
  );
}

/* ─── TalentPhoto ─── photo-centric display for talent cards */

const photoSizeMap = {
  sm: { width: "w-10", height: "h-10", fontSize: "text-sm" },
  md: { width: "w-20", height: "h-20", fontSize: "text-xl" },
  lg: { width: "w-full", height: "h-full", fontSize: "text-3xl" },
} as const;

export function TalentPhoto({
  photo_url,
  name,
  size = "lg",
  className = "",
  aspectRatio = "3/4",
}: {
  photo_url?: string | null;
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  aspectRatio?: string;
}) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  if (photo_url) {
    return (
      <div
        className={`relative overflow-hidden ${className}`}
        style={{ aspectRatio }}
      >
        <img
          src={photo_url}
          alt={name}
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>
    );
  }

  // Placeholder with gradient + initials
  return (
    <div
      className={`relative overflow-hidden flex items-center justify-center ${className}`}
      style={{
        aspectRatio,
        background: "linear-gradient(160deg, #1E2128 0%, #2A2D35 100%)",
      }}
    >
      <span
        className={`font-semibold ${photoSizeMap[size].fontSize}`}
        style={{
          background: "linear-gradient(135deg, #C9A84C, #8B6D1A)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        {initials}
      </span>
    </div>
  );
}
