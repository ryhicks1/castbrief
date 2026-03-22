"use client";

const CHIP_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  default: { bg: "rgba(184, 150, 76, 0.15)", text: "#C9A84C", border: "#C9A84C33" },
  blue: { bg: "rgba(96, 165, 250, 0.15)", text: "#93C5FD", border: "#60A5FA33" },
  green: { bg: "rgba(74, 222, 128, 0.15)", text: "#86EFAC", border: "#4ADE8033" },
  purple: { bg: "rgba(167, 139, 250, 0.15)", text: "#C4B5FD", border: "#A78BFA33" },
  pink: { bg: "rgba(244, 114, 182, 0.15)", text: "#F9A8D4", border: "#F472B633" },
  orange: { bg: "rgba(251, 146, 60, 0.15)", text: "#FDBA74", border: "#FB923C33" },
  teal: { bg: "rgba(45, 212, 191, 0.15)", text: "#5EEAD4", border: "#2DD4BF33" },
};

interface ChipProps {
  label: string;
  color?: string;
  colorScheme?: keyof typeof CHIP_COLORS;
  active?: boolean;
  onRemove?: () => void;
  onClick?: () => void;
  className?: string;
}

export default function Chip({
  label,
  color,
  colorScheme,
  active = false,
  onRemove,
  onClick,
  className = "",
}: ChipProps) {
  // Determine colors: explicit color prop takes priority, then colorScheme, then default palette
  const palette = CHIP_COLORS[colorScheme ?? "default"];

  const style = active
    ? color
      ? { backgroundColor: color, color: "#0F0F12" }
      : { backgroundColor: palette.text, color: "#0F0F12" }
    : color && !colorScheme
      ? { backgroundColor: `${color}22`, borderColor: `${color}55`, color }
      : { backgroundColor: palette.bg, borderColor: palette.border, color: palette.text };

  return (
    <span
      onClick={onClick}
      style={style}
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium border transition-all duration-300 ${
        onClick ? "cursor-pointer hover:opacity-80" : ""
      } ${className}`}
    >
      {label}
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-0.5 hover:opacity-70"
        >
          &times;
        </button>
      )}
    </span>
  );
}
