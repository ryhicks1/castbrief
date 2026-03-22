"use client";

import { useState, useRef, useEffect } from "react";

interface Option {
  value: string;
  label: string;
}

interface MultiSelectProps {
  options: Option[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  label?: string;
}

export default function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Select...",
  label,
}: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const allSelected = options.length > 0 && selected.length === options.length;

  function toggleAll() {
    if (allSelected) {
      onChange([]);
    } else {
      onChange(options.map((o) => o.value));
    }
  }

  function toggle(value: string) {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  }

  const selectedLabels = options
    .filter((o) => selected.includes(o.value))
    .map((o) => o.label);

  let displayText: string;
  if (selected.length === 0) {
    displayText = placeholder;
  } else if (selected.length === 1) {
    displayText = selectedLabels[0];
  } else if (selected.length === options.length) {
    displayText = `All selected (${selected.length})`;
  } else {
    displayText = `${selected.length} selected`;
  }

  return (
    <div ref={ref} className="relative">
      {label && (
        <label className="mb-1.5 block text-sm font-medium text-[#E8E3D8]">
          {label}
        </label>
      )}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={`flex w-full items-center justify-between rounded-lg border bg-[#1E2128] px-3 py-2 text-sm transition-all duration-300 ${
          open
            ? "border-[#B8964C] ring-1 ring-[#B8964C]"
            : "border-[#2A2D35]"
        } ${selected.length === 0 ? "text-[#8B8D93]" : "text-[#E8E3D8]"}`}
      >
        <span className="truncate">{displayText}</span>
        <svg
          className={`ml-2 h-4 w-4 shrink-0 text-[#8B8D93] transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {open && (
        <div role="listbox" className="absolute z-50 mt-1 w-full rounded-lg border border-[#2A2D35] bg-[#1E2128] py-1 shadow-xl">
          {options.length > 1 && (
            <>
              <label className="flex cursor-pointer items-center gap-2 px-3 py-1.5 hover:bg-[#262930] transition-colors">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  className="h-3.5 w-3.5 rounded border-[#2A2D35] bg-[#0F0F12] text-[#B8964C] accent-[#B8964C] focus:ring-[#B8964C] focus:ring-offset-0"
                />
                <span className="text-sm font-medium text-[#B8964C]">
                  Select All
                </span>
              </label>
              <div className="mx-3 border-t border-[#2A2D35]" />
            </>
          )}
          <div className="max-h-48 overflow-y-auto">
            {options.map((option) => (
              <label
                key={option.value}
                role="option"
                aria-selected={selected.includes(option.value)}
                className="flex cursor-pointer items-center gap-2 px-3 py-1.5 hover:bg-[#262930] transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(option.value)}
                  onChange={() => toggle(option.value)}
                  className="h-3.5 w-3.5 rounded border-[#2A2D35] bg-[#0F0F12] text-[#B8964C] accent-[#B8964C] focus:ring-[#B8964C] focus:ring-offset-0"
                />
                <span className="text-sm text-[#E8E3D8]">{option.label}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
