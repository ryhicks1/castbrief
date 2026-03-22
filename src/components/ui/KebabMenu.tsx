"use client";

import { useState, useRef, useEffect } from "react";
import { MoreVertical } from "lucide-react";

export interface KebabMenuItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
}

interface KebabMenuProps {
  items: KebabMenuItem[];
  className?: string;
}

export default function KebabMenu({ items, className = "" }: KebabMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div ref={menuRef} className={`relative ${className}`}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen((prev) => !prev);
        }}
        className="rounded-lg p-1.5 text-[#8B8D93] hover:bg-[#1E2128] hover:text-[#E8E3D8] transition"
        aria-label="Package actions"
      >
        <MoreVertical size={16} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 min-w-[180px] rounded-lg border border-[#1E2128] bg-[#13151A] shadow-xl shadow-black/40 py-1 animate-[fade-in_0.15s_ease-out]">
          {items.map((item, i) => (
            <button
              key={i}
              onClick={(e) => {
                e.stopPropagation();
                setOpen(false);
                item.onClick();
              }}
              className={`flex w-full items-center gap-2.5 px-3 py-2 text-sm transition ${
                item.danger
                  ? "text-red-400 hover:bg-red-500/10"
                  : "text-[#E8E3D8] hover:bg-[#1E2128]"
              }`}
            >
              {item.icon && <span className="shrink-0 opacity-70">{item.icon}</span>}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
