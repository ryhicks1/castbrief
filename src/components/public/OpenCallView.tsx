"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { LOCATIONS, LOCATIONS_BY_COUNTRY } from "@/lib/constants/locations";
import {
  CheckCircle,
  Upload,
  FileDown,
  ChevronRight,
  User,
  MapPin,
  ExternalLink,
} from "lucide-react";

interface RoleDoc {
  id: string;
  name: string;
  url: string;
  file_type: string;
}

interface Role {
  id: string;
  name: string;
  brief: string | null;
  documents: RoleDoc[];
}

interface ProjectDoc {
  id: string;
  name: string;
  url: string;
  file_type: string;
}

interface OpenCallViewProps {
  project: {
    id: string;
    name: string;
    brand: string | null;
    type: string;
  };
  roles: Role[];
  projectDocuments: ProjectDoc[];
  token: string;
  openCallFormUrl?: string | null;
  showProjectDocs?: boolean;
  showRoleDocs?: boolean;
}

export default function OpenCallView({
  project,
  roles,
  projectDocuments,
  token,
  openCallFormUrl,
  showProjectDocs = true,
  showRoleDocs = true,
}: OpenCallViewProps) {
  const formRef = useRef<HTMLDivElement>(null);
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("");

  // Form state
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [age, setAge] = useState("");
  const [notes, setNotes] = useState("");
  const [formCompleted, setFormCompleted] = useState(false);

  // File uploads
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [photoUrl, setPhotoUrl] = useState("");
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function checkAuth() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setIsLoggedIn(true);
        setUserEmail(user.email || "");
        setEmail(user.email || "");
        // Try to get profile name
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .single();
        if (profile?.full_name) {
          setUserName(profile.full_name);
          setFullName(profile.full_name);
        }
      } else {
        setIsLoggedIn(false);
      }
    }
    checkAuth();
  }, []);

  async function uploadSingleFile(file: File): Promise<string | null> {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("path", "open-call");
      const res = await fetch("/api/upload/open-call", { method: "POST", body: formData });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Upload failed");
      }
      const data = await res.json();
      return data.url;
    } catch (err: any) {
      setError("File upload failed: " + (err.message || "Please try again."));
      return null;
    }
  }

  function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      setUploadingPhoto(true);
      setError("");
      uploadSingleFile(file).then((url) => {
        if (url) setPhotoUrl(url);
        setUploadingPhoto(false);
      });
    }
  }

  function handleMediaSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setMediaFiles((prev) => [...prev, ...files]);
    setUploadingMedia(true);
    setError("");

    Promise.all(files.map((f) => uploadSingleFile(f))).then((urls) => {
      const validUrls = urls.filter(Boolean) as string[];
      setMediaUrls((prev) => [...prev, ...validUrls]);
      setUploadingMedia(false);
    });
  }

  function removeMediaFile(index: number) {
    setMediaFiles((prev) => prev.filter((_, i) => i !== index));
    setMediaUrls((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedRoleId) return;
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/open-call/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: project.id,
          role_id: selectedRoleId,
          token,
          full_name: fullName,
          email,
          phone,
          location,
          age: age ? parseInt(age) : null,
          photo_url: photoUrl || null,
          media_url: mediaUrls.length > 0 ? mediaUrls.join(",") : null,
          notes,
          form_completed: formCompleted,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSubmitted(true);
      } else {
        setError(data.error || "Submission failed. Please try again.");
      }
    } catch {
      setError("Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const selectedRole = roles.find((r) => r.id === selectedRoleId);

  if (submitted) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 sm:px-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 mb-6">
            <CheckCircle size={32} className="text-green-400" />
          </div>
          <h1 className="text-2xl font-bold text-[#E8E3D8] mb-2">
            Submission Received!
          </h1>
          <p className="text-[#8B8D93]">
            Your submission for{" "}
            <span className="text-[#E8E3D8]">{selectedRole?.name}</span> in{" "}
            <span className="text-[#E8E3D8]">{project.name}</span> has been
            received. The casting team will review your submission.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#E8E3D8] mb-1">
          {project.name}
        </h1>
        {project.brand && (
          <p className="text-sm text-[#8B8D93]">
            {project.brand} &middot; {project.type}
          </p>
        )}
        <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-[#C9A84C]/10 px-3 py-1 text-xs text-[#C9A84C]">
          Open Call
        </div>
      </div>

      {/* Project documents */}
      {showProjectDocs && projectDocuments.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[#8B8D93] mb-2">
            Project Documents
          </h2>
          <div className="flex flex-wrap gap-2">
            {projectDocuments.map((doc) => (
              <a
                key={doc.id}
                href={`/api/documents/${doc.id}/download${userEmail ? `?watermark=${encodeURIComponent(userEmail)}` : ""}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-lg border border-[#1E2128] bg-[#161920] px-3 py-2 text-xs text-[#8B8D93] hover:text-[#E8E3D8] hover:border-[#2A2D35] transition"
              >
                <FileDown size={12} />
                {doc.name}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Step 1: Role Selection */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold text-[#E8E3D8] mb-3">
          1. Select a Role
        </h2>
        {roles.length === 0 ? (
          <p className="text-sm text-[#8B8D93]">
            No roles are currently available for submission.
          </p>
        ) : (
          <div className="space-y-2">
            {roles.map((role) => (
              <button
                key={role.id}
                onClick={() => {
                  setSelectedRoleId(role.id);
                  setTimeout(() => {
                    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }, 100);
                }}
                className={`w-full text-left rounded-xl border p-4 transition ${
                  selectedRoleId === role.id
                    ? "border-[#C9A84C] bg-[#C9A84C]/5"
                    : "border-[#1E2128] bg-[#161920] hover:border-[#2A2D35]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-[#E8E3D8]">
                      {role.name}
                    </h3>
                    {role.brief && (
                      <p className="text-xs text-[#8B8D93] mt-1">
                        {role.brief}
                      </p>
                    )}
                  </div>
                  {selectedRoleId === role.id && (
                    <div className="w-5 h-5 rounded-full bg-[#C9A84C] flex items-center justify-center">
                      <CheckCircle size={14} className="text-[#0D0F14]" />
                    </div>
                  )}
                </div>
                {showRoleDocs && role.documents.length > 0 && selectedRoleId === role.id && (
                  <div className="mt-3 pt-3 border-t border-[#1E2128]">
                    <p className="text-[10px] uppercase tracking-wider text-[#8B8D93] mb-2">
                      Sides / Documents
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {role.documents.map((doc) => (
                        <a
                          key={doc.id}
                          href={`/api/documents/${doc.id}/download${userEmail ? `?watermark=${encodeURIComponent(userEmail)}` : ""}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-[#C9A84C] hover:underline"
                        >
                          <FileDown size={11} />
                          {doc.name}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* External form redirect */}
      {selectedRoleId && openCallFormUrl && (
        <div ref={formRef} className="mb-8 rounded-xl border border-[#1E2128] bg-[#161920] p-6 text-center">
          <ExternalLink size={24} className="text-[#C9A84C] mx-auto mb-3" />
          <h2 className="text-sm font-semibold text-[#E8E3D8] mb-2">
            Complete Your Submission
          </h2>
          <p className="text-xs text-[#8B8D93] mb-4">
            This open call uses an external submission form. Click below to apply.
          </p>
          <a
            href={openCallFormUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#C9A84C] to-[#B8943F] px-6 py-3 text-sm font-semibold text-[#0D0F14] hover:from-[#D4B35C] hover:to-[#C9A84C] transition"
          >
            <ExternalLink size={14} />
            Open Submission Form
          </a>
        </div>
      )}

      {/* Step 2: Auth Gate */}
      <div ref={openCallFormUrl ? undefined : formRef} />
      {selectedRoleId && !openCallFormUrl && isLoggedIn === false && (
        <div className="mb-8 rounded-xl border border-[#1E2128] bg-[#161920] p-6 text-center">
          <User size={24} className="text-[#8B8D93] mx-auto mb-3" />
          <h2 className="text-sm font-semibold text-[#E8E3D8] mb-2">
            Sign in to submit
          </h2>
          <p className="text-xs text-[#8B8D93] mb-4">
            You need an account to submit your application.
          </p>
          <div className="flex gap-3 justify-center">
            <a
              href={`/login?redirectTo=/open-call/${token}`}
              className="inline-flex items-center rounded-lg border border-[#1E2128] bg-[#161920] px-4 py-2 text-sm text-[#E8E3D8] hover:border-[#2A2D35] transition"
            >
              Log in
            </a>
            <a
              href={`/signup?redirectTo=/open-call/${token}`}
              className="inline-flex items-center rounded-lg bg-gradient-to-r from-[#C9A84C] to-[#B8943F] px-4 py-2 text-sm font-semibold text-[#0D0F14] hover:from-[#D4B35C] hover:to-[#C9A84C] transition"
            >
              Sign up
            </a>
          </div>
        </div>
      )}

      {/* Step 3: Submission Form */}
      {selectedRoleId && !openCallFormUrl && isLoggedIn === true && (
        <form onSubmit={handleSubmit}>
          <h2 className="text-sm font-semibold text-[#E8E3D8] mb-3">
            2. Your Details
          </h2>

          <div className="space-y-4 mb-6">
            {/* Headshot upload */}
            <div>
              <label className="block text-xs text-[#8B8D93] mb-1">
                Headshot
              </label>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer rounded-lg border border-[#1E2128] bg-[#161920] px-4 py-2.5 text-xs text-[#8B8D93] hover:border-[#2A2D35] transition">
                  <Upload size={14} />
                  {uploadingPhoto
                    ? "Uploading..."
                    : photoUrl
                    ? "Change Photo"
                    : "Upload Photo"}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoSelect}
                    className="hidden"
                    disabled={uploadingPhoto}
                  />
                </label>
                {photoUrl && (
                  <span className="text-xs text-green-400">Uploaded</span>
                )}
              </div>
            </div>

            {/* Self-tape / media — multiple files */}
            <div>
              <label className="block text-xs text-[#8B8D93] mb-1">
                Self-tape / Media (multiple files allowed)
              </label>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer rounded-lg border border-[#1E2128] bg-[#161920] px-4 py-2.5 text-xs text-[#8B8D93] hover:border-[#2A2D35] transition">
                  <Upload size={14} />
                  {uploadingMedia ? "Uploading..." : "Add Files"}
                  <input
                    type="file"
                    accept="video/*,audio/*,image/*,.pdf"
                    onChange={handleMediaSelect}
                    className="hidden"
                    disabled={uploadingMedia}
                    multiple
                  />
                </label>
                {mediaUrls.length > 0 && (
                  <span className="text-xs text-green-400">
                    {mediaUrls.length} file{mediaUrls.length !== 1 ? "s" : ""} uploaded
                  </span>
                )}
              </div>
              {mediaFiles.length > 0 && (
                <div className="mt-2 space-y-1">
                  {mediaFiles.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-[#8B8D93]">
                      <span className={mediaUrls[i] ? "text-green-400" : "text-[#8B8D93]"}>
                        {mediaUrls[i] ? "✓" : "○"}
                      </span>
                      <span className="truncate max-w-[200px]">{f.name}</span>
                      <span className="text-[#555]">({(f.size / 1024 / 1024).toFixed(1)}MB)</span>
                      <button
                        type="button"
                        onClick={() => removeMediaFile(i)}
                        className="text-red-400 hover:text-red-300 ml-auto"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Name & Email row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-[#8B8D93] mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="w-full rounded-lg border border-[#1E2128] bg-[#161920] px-3 py-2 text-sm text-[#E8E3D8] placeholder-[#555] focus:border-[#C9A84C] focus:outline-none"
                  placeholder="Your full name"
                />
              </div>
              <div>
                <label className="block text-xs text-[#8B8D93] mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded-lg border border-[#1E2128] bg-[#161920] px-3 py-2 text-sm text-[#E8E3D8] placeholder-[#555] focus:border-[#C9A84C] focus:outline-none"
                  placeholder="your@email.com"
                />
              </div>
            </div>

            {/* Phone & Age row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-[#8B8D93] mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-lg border border-[#1E2128] bg-[#161920] px-3 py-2 text-sm text-[#E8E3D8] placeholder-[#555] focus:border-[#C9A84C] focus:outline-none"
                  placeholder="+1 (555) 000-0000"
                />
              </div>
              <div>
                <label className="block text-xs text-[#8B8D93] mb-1">
                  Age
                </label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  min={1}
                  max={120}
                  className="w-full rounded-lg border border-[#1E2128] bg-[#161920] px-3 py-2 text-sm text-[#E8E3D8] placeholder-[#555] focus:border-[#C9A84C] focus:outline-none"
                  placeholder="Age"
                />
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="block text-xs text-[#8B8D93] mb-1">
                Location
              </label>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full rounded-lg border border-[#1E2128] bg-[#161920] px-3 py-2 text-sm text-[#E8E3D8] focus:border-[#C9A84C] focus:outline-none"
              >
                <option value="">Select location...</option>
                {Object.entries(LOCATIONS_BY_COUNTRY).map(
                  ([country, locs]) => (
                    <optgroup key={country} label={country}>
                      {locs.map((loc) => (
                        <option
                          key={loc.code}
                          value={`${loc.city}, ${loc.country}`}
                        >
                          {loc.city}
                        </option>
                      ))}
                    </optgroup>
                  )
                )}
              </select>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs text-[#8B8D93] mb-1">
                Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-[#1E2128] bg-[#161920] px-3 py-2 text-sm text-[#E8E3D8] placeholder-[#555] focus:border-[#C9A84C] focus:outline-none resize-none"
                placeholder="Anything else you'd like to share..."
              />
            </div>

            {/* Form completed checkbox (if role has documents) */}
            {selectedRole && selectedRole.documents.length > 0 && (
              <label className="flex items-center gap-2 text-xs text-[#8B8D93] cursor-pointer">
                <input
                  type="checkbox"
                  checked={formCompleted}
                  onChange={(e) => setFormCompleted(e.target.checked)}
                  className="rounded border-[#1E2128] bg-[#161920] text-[#C9A84C] focus:ring-[#C9A84C]"
                />
                I have reviewed and completed any required forms
              </label>
            )}
          </div>

          {error && (
            <p className="text-sm text-red-400 mb-4">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting || !fullName || !email || uploadingPhoto || uploadingMedia}
            className="w-full rounded-lg bg-gradient-to-r from-[#C9A84C] to-[#B8943F] px-4 py-3 text-sm font-semibold text-[#0D0F14] hover:from-[#D4B35C] hover:to-[#C9A84C] transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Submitting..." : "Submit Application"}
          </button>
        </form>
      )}

      {/* Loading state for auth check */}
      {selectedRoleId && !openCallFormUrl && isLoggedIn === null && (
        <div className="text-center py-8">
          <p className="text-sm text-[#8B8D93]">Checking authentication...</p>
        </div>
      )}
    </div>
  );
}
