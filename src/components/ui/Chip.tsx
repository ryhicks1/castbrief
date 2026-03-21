"use client";

interface ChipProps {
  label: string;
  color?: string;
  active?: boolean;
  onRemove?: () => void;
  onClick?: () => void;
  className?: string;
}

export default function Chip({
  label,
  color = "#B8964C",
  active = false,
  onRemove,
  onClick,
  className = "",
}: ChipProps) {
  const style = active
    ? { backgroundColor: color, color: "#0F0F12" }
    : { borderColor: color, color };

  return (
    <span
      onClick={onClick}
      style={style}
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium transition-all duration-300 ${
        active ? "" : "border bg-transparent"
      } ${onClick ? "cursor-pointer hover:opacity-80" : ""} ${className}`}
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
