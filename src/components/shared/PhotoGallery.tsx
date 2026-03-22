"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface PhotoGalleryProps {
  photos: Array<{ url: string; label?: string }>;
  initialIndex: number;
  onClose: () => void;
}

export default function PhotoGallery({
  photos,
  initialIndex,
  onClose,
}: PhotoGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const goNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % photos.length);
  }, [photos.length]);

  const goPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length);
  }, [photos.length]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, goNext, goPrev]);

  const current = photos[currentIndex];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 rounded-lg bg-black/50 p-2 text-white/80 hover:text-white hover:bg-black/70 transition"
      >
        <X size={20} />
      </button>

      {/* Left arrow */}
      {photos.length > 1 && (
        <button
          onClick={goPrev}
          className="absolute left-4 z-10 rounded-lg bg-black/50 p-2 text-white/80 hover:text-white hover:bg-black/70 transition"
        >
          <ChevronLeft size={24} />
        </button>
      )}

      {/* Photo */}
      <div className="relative w-[90vw] h-[85vh]">
        <Image
          src={current.url}
          alt={current.label || `Photo ${currentIndex + 1}`}
          fill
          sizes="90vw"
          quality={85}
          priority
          className="object-contain rounded-lg"
        />

        {/* Label badge */}
        {current.label && (
          <span className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-white/90 uppercase tracking-wider">
            {current.label}
          </span>
        )}

        {/* Counter */}
        {photos.length > 1 && (
          <span className="absolute top-4 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-xs text-white/70">
            {currentIndex + 1} / {photos.length}
          </span>
        )}
      </div>

      {/* Right arrow */}
      {photos.length > 1 && (
        <button
          onClick={goNext}
          className="absolute right-4 z-10 rounded-lg bg-black/50 p-2 text-white/80 hover:text-white hover:bg-black/70 transition"
        >
          <ChevronRight size={24} />
        </button>
      )}
    </div>
  );
}
