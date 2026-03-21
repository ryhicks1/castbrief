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
