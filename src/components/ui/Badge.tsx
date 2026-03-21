"use client";

const colorMap = {
  green: { dot: "bg-green-400", text: "text-green-400", bg: "bg-green-400/10" },
  gold: { dot: "bg-[#C9A84C]", text: "text-[#C9A84C]", bg: "bg-[#C9A84C]/10" },
  muted: { dot: "bg-gray-400", text: "text-gray-400", bg: "bg-gray-400/10" },
  red: { dot: "bg-red-400", text: "text-red-400", bg: "bg-red-400/10" },
} as const;

interface BadgeProps {
  label: string;
  color?: keyof typeof colorMap;
  className?: string;
}

export default function Badge({
  label,
  color = "gold",
  className = "",
}: BadgeProps) {
  const c = colorMap[color];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${c.bg} ${c.text} ${className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
      {label}
    </span>
  );
}
