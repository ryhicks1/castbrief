"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui";
import {
  X,
  Upload,
  FileText,
  Check,
  Loader2,
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  Sparkles,
  AlertCircle,
} from "lucide-react";

interface ProjectAnalysis {
  project: {
    name: string;
    brand: string;
    type: string;
    location: string;
    deadline: string | null;
    director: string | null;
    castingDirector: string | null;
    productionDates: string | null;
  };
  roles: Array<{
    name: string;
    description: string;
    ageRange: string | null;
    gender: string | null;
    speaking: boolean;
    characteristics: string[];
    include: boolean;
  }>;
  selfTapeInstructions: Array<{
    roleName: string;
    videos: Array<{ label: string; description: string }>;
    photos: string[];
    filmingNotes: string[];
    referenceLinks: string[];
  }>;
  formQuestions: Array<{
    roleName: string;
    questions: Array<{
      type: "text" | "radio" | "textarea" | "checkbox";
      label: string;
      options?: string[];
      required: boolean;
    }>;
  }>;
}

interface SmartProjectCreatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectCreated: (projectId: string) => void;
}

type Stage = "upload" | "analyzing" | "review" | "creating" | "done";

const PROJECT_TYPES = [
  { value: "film", label: "Film" },
  { value: "tv_series", label: "TV Series" },
  { value: "commercial", label: "Commercial" },
  { value: "short_film", label: "Short Film" },
  { value: "music_video", label: "Music Video" },
  { value: "web_series", label: "Web Series" },
  { value: "theatre", label: "Theatre" },
  { value: "vertical_short", label: "Vertical Short" },
];

interface CreationStep {
  label: string;
  status: "pending" | "active" | "done" | "error";
}

export default function SmartProjectCreatorModal({
  isOpen,
  onClose,
  onProjectCreated,
}: SmartProjectCreatorModalProps) {
  const [stage, setStage] = useState<Stage>("upload");
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  // Options checkboxes
  const [optFillDetails, setOptFillDetails] = useState(true);
  const [optCreateRoles, setOptCreateRoles] = useState(true);
  const [optBreakdownSides, setOptBreakdownSides] = useState(true);
  const [optSelfTape, setOptSelfTape] = useState(true);
  const [optForms, setOptForms] = useState(true);

  // Analysis result
  const [analysis, setAnalysis] = useState<ProjectAnalysis | null>(null);
  const [uploadedFileUrls, setUploadedFileUrls] = useState<
    Array<{ name: string; url: string }>
  >([]);

  // Review stage — expanded sections
  const [expandedSelfTape, setExpandedSelfTape] = useState<Set<string>>(
    new Set()
  );
  const [expandedForms, setExpandedForms] = useState<Set<string>>(new Set());

  // Creation stage
  const [creationSteps, setCreationSteps] = useState<CreationStep[]>([]);
  const [createdProjectId, setCreatedProjectId] = useState<string | null>(null);
  const [creationSummary, setCreationSummary] = useState<{
    name: string;
    rolesCreated: number;
    formsCreated: number;
    documentsCreated: number;
  } | null>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const droppedFiles = Array.from(e.dataTransfer.files).filter(
      (f) =>
        f.type === "application/pdf" ||
        f.type ===
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );
    if (droppedFiles.length > 0) {
      setFiles((prev) => [...prev, ...droppedFiles]);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    if (selected.length > 0) {
      setFiles((prev) => [...prev, ...selected]);
    }
    e.target.value = "";
  };

  const removeFile = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  async function handleAnalyze() {
    if (files.length === 0) return;
    setError(null);
    setStage("analyzing");

    try {
      const formData = new FormData();
      for (const file of files) {
        formData.append("files", file);
      }
      formData.append("optFillDetails", String(optFillDetails));
      formData.append("optCreateRoles", String(optCreateRoles));
      formData.append("optSelfTape", String(optSelfTape));
      formData.append("optForms", String(optForms));

      const res = await fetch("/api/projects/smart-create/analyze", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Analysis failed");
      }

      const data = await res.json();

      // Add include flag to roles
      const rolesWithInclude = (data.analysis.roles || []).map((r: any) => ({
        ...r,
        include: true,
      }));

      setAnalysis({ ...data.analysis, roles: rolesWithInclude });
      setUploadedFileUrls(data.uploadedFiles || []);
      setStage("review");
    } catch (err: any) {
      setError(err.message || "Failed to analyze documents");
      setStage("upload");
    }
  }

  function toggleRole(idx: number) {
    if (!analysis) return;
    setAnalysis({
      ...analysis,
      roles: analysis.roles.map((r, i) =>
        i === idx ? { ...r, include: !r.include } : r
      ),
    });
  }

  function updateProject(field: string, value: any) {
    if (!analysis) return;
    setAnalysis({
      ...analysis,
      project: { ...analysis.project, [field]: value },
    });
  }

  function updateRole(idx: number, field: string, value: any) {
    if (!analysis) return;
    setAnalysis({
      ...analysis,
      roles: analysis.roles.map((r, i) =>
        i === idx ? { ...r, [field]: value } : r
      ),
    });
  }

  function addRole() {
    if (!analysis) return;
    setAnalysis({
      ...analysis,
      roles: [
        ...analysis.roles,
        {
          name: "New Role",
          description: "",
          ageRange: null,
          gender: null,
          speaking: true,
          characteristics: [],
          include: true,
        },
      ],
    });
  }

  function updateSelfTapeField(
    roleIdx: number,
    field: string,
    value: any
  ) {
    if (!analysis) return;
    setAnalysis({
      ...analysis,
      selfTapeInstructions: analysis.selfTapeInstructions.map((s, i) =>
        i === roleIdx ? { ...s, [field]: value } : s
      ),
    });
  }

  function updateFormQuestion(
    roleIdx: number,
    qIdx: number,
    field: string,
    value: any
  ) {
    if (!analysis) return;
    setAnalysis({
      ...analysis,
      formQuestions: analysis.formQuestions.map((fq, ri) =>
        ri === roleIdx
          ? {
              ...fq,
              questions: fq.questions.map((q, qi) =>
                qi === qIdx ? { ...q, [field]: value } : q
              ),
            }
          : fq
      ),
    });
  }

  function removeFormQuestion(roleIdx: number, qIdx: number) {
    if (!analysis) return;
    setAnalysis({
      ...analysis,
      formQuestions: analysis.formQuestions.map((fq, ri) =>
        ri === roleIdx
          ? { ...fq, questions: fq.questions.filter((_, qi) => qi !== qIdx) }
          : fq
      ),
    });
  }

  function addFormQuestion(roleIdx: number) {
    if (!analysis) return;
    setAnalysis({
      ...analysis,
      formQuestions: analysis.formQuestions.map((fq, ri) =>
        ri === roleIdx
          ? {
              ...fq,
              questions: [
                ...fq.questions,
                { type: "text" as const, label: "", required: false },
              ],
            }
          : fq
      ),
    });
  }

  async function handleCreateEverything() {
    if (!analysis) return;
    setStage("creating");
    setError(null);

    const steps: CreationStep[] = [
      { label: "Creating project...", status: "pending" },
      { label: "Creating roles...", status: "pending" },
    ];
    if (optBreakdownSides) {
      steps.push({ label: "Generating sides...", status: "pending" });
    }
    if (optForms && analysis.formQuestions.length > 0) {
      steps.push({ label: "Creating forms...", status: "pending" });
    }
    if (optSelfTape && analysis.selfTapeInstructions.length > 0) {
      steps.push({
        label: "Generating self-tape instructions...",
        status: "pending",
      });
    }
    steps.push({ label: "Setting up Dropbox folders...", status: "pending" });
    setCreationSteps(steps);

    try {
      const res = await fetch("/api/projects/smart-create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project: analysis.project,
          roles: analysis.roles.filter((r) => r.include),
          selfTapeInstructions: optSelfTape
            ? analysis.selfTapeInstructions
            : [],
          formQuestions: optForms ? analysis.formQuestions : [],
          uploadedFiles: uploadedFileUrls,
          options: {
            breakdownSides: optBreakdownSides,
            createForms: optForms,
            createSelfTape: optSelfTape,
          },
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create project");
      }

      const data = await res.json();

      // Mark all steps done
      setCreationSteps((prev) =>
        prev.map((s) => ({ ...s, status: "done" as const }))
      );

      setCreatedProjectId(data.projectId);
      setCreationSummary({
        name: analysis.project.name,
        rolesCreated: data.summary?.rolesCreated || 0,
        formsCreated: data.summary?.formsCreated || 0,
        documentsCreated: data.summary?.documentsCreated || 0,
      });

      // Brief pause to show completed steps, then move to done
      setTimeout(() => setStage("done"), 800);
    } catch (err: any) {
      setError(err.message || "Failed to create project");
      setCreationSteps((prev) =>
        prev.map((s) =>
          s.status === "pending" || s.status === "active"
            ? { ...s, status: "error" as const }
            : s
        )
      );
    }
  }

  if (!isOpen) return null;

  const includedCount = analysis?.roles.filter((r) => r.include).length || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl border border-[#1E2128] bg-[#13151A] shadow-2xl mx-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#1E2128] px-6 py-4 shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-[#C9A84C]" />
            <h2 className="text-lg font-semibold text-[#E8E3D8]">
              Smart Project Creator
            </h2>
          </div>
          <button
            onClick={stage === "done" ? () => onProjectCreated(createdProjectId!) : onClose}
            className="text-[#8B8D93] hover:text-[#E8E3D8] transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {error && (
            <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400 flex items-start gap-2">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* ==================== UPLOAD STAGE ==================== */}
          {stage === "upload" && (
            <div>
              <p className="text-sm text-[#8B8D93] mb-6">
                Upload your documents and we&apos;ll set everything up
                automatically.
              </p>

              {/* Drop zone */}
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-xl p-8 text-center transition ${
                  dragActive
                    ? "border-[#C9A84C] bg-[#C9A84C]/5"
                    : "border-[#2A2D35] hover:border-[#3A3D45]"
                }`}
              >
                <Upload
                  size={36}
                  className={`mx-auto mb-3 ${
                    dragActive ? "text-[#C9A84C]" : "text-[#8B8D93]"
                  }`}
                />
                <p className="text-sm text-[#E8E3D8] mb-1">
                  Drag & drop your casting documents here
                </p>
                <p className="text-xs text-[#8B8D93] mb-4">
                  PDF files supported. Scripts, self-tape docs, job info sheets.
                </p>
                <label className="inline-flex items-center gap-2 cursor-pointer rounded-lg bg-[#1E2128] border border-[#2A2D35] px-4 py-2 text-sm text-[#E8E3D8] hover:bg-[#262930] transition">
                  Browse Files
                  <input
                    type="file"
                    accept=".pdf"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
              </div>

              {/* File list */}
              {files.length > 0 && (
                <div className="mt-4 space-y-2">
                  {files.map((file, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-lg border border-[#2A2D35] bg-[#161920] px-4 py-2.5"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <FileText size={16} className="text-[#C9A84C] shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm text-[#E8E3D8] truncate">
                            {file.name}
                          </p>
                          <p className="text-xs text-[#8B8D93]">
                            {formatFileSize(file.size)}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeFile(idx)}
                        className="text-[#8B8D93] hover:text-red-400 transition p-1"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Options */}
              <div className="mt-6 space-y-2">
                <p className="text-xs font-medium text-[#8B8D93] uppercase tracking-wider mb-2">
                  What to create
                </p>
                <OptionCheckbox
                  checked={optFillDetails}
                  onChange={setOptFillDetails}
                  label="Fill in Project Details"
                />
                <OptionCheckbox
                  checked={optCreateRoles}
                  onChange={setOptCreateRoles}
                  label="Create Roles (including non-speaking)"
                />
                <OptionCheckbox
                  checked={optBreakdownSides}
                  onChange={setOptBreakdownSides}
                  label="Break down script into sides"
                />
                <OptionCheckbox
                  checked={optSelfTape}
                  onChange={setOptSelfTape}
                  label="Create Self-Tape Instructions for each role"
                />
                <OptionCheckbox
                  checked={optForms}
                  onChange={setOptForms}
                  label="Create Job Forms for the project"
                />
              </div>
            </div>
          )}

          {/* ==================== ANALYZING STAGE ==================== */}
          {stage === "analyzing" && (
            <div className="text-center py-16">
              <Loader2
                size={40}
                className="mx-auto text-[#C9A84C] animate-spin mb-4"
              />
              <h3 className="text-lg font-medium text-[#E8E3D8] mb-2">
                Analyzing your documents...
              </h3>
              <p className="text-sm text-[#8B8D93]">
                AI is reading through {files.length} document
                {files.length !== 1 ? "s" : ""} and extracting project details,
                roles, and instructions. This may take 30-60 seconds.
              </p>
            </div>
          )}

          {/* ==================== REVIEW STAGE ==================== */}
          {stage === "review" && analysis && (
            <div className="space-y-6">
              {/* Project Details */}
              <section>
                <h3 className="text-sm font-semibold text-[#E8E3D8] uppercase tracking-wider mb-3">
                  Project Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <FieldInput
                    label="Project Name"
                    value={analysis.project.name}
                    onChange={(v) => updateProject("name", v)}
                  />
                  <FieldInput
                    label="Brand / Studio"
                    value={analysis.project.brand}
                    onChange={(v) => updateProject("brand", v)}
                  />
                  <div>
                    <label className="block text-xs text-[#8B8D93] mb-1">
                      Type
                    </label>
                    <select
                      value={analysis.project.type}
                      onChange={(e) => updateProject("type", e.target.value)}
                      className="w-full rounded-lg border border-[#2A2D35] bg-[#0D0F14] px-3 py-2 text-sm text-[#E8E3D8] focus:border-[#C9A84C] focus:outline-none"
                    >
                      {PROJECT_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <FieldInput
                    label="Location"
                    value={analysis.project.location}
                    onChange={(v) => updateProject("location", v)}
                  />
                  <div>
                    <label className="block text-xs text-[#8B8D93] mb-1">
                      Deadline
                    </label>
                    <input
                      type="date"
                      value={analysis.project.deadline || ""}
                      onChange={(e) =>
                        updateProject("deadline", e.target.value || null)
                      }
                      className="w-full rounded-lg border border-[#2A2D35] bg-[#0D0F14] px-3 py-2 text-sm text-[#E8E3D8] focus:border-[#C9A84C] focus:outline-none"
                    />
                  </div>
                  <FieldInput
                    label="Director"
                    value={analysis.project.director || ""}
                    onChange={(v) => updateProject("director", v || null)}
                  />
                  <FieldInput
                    label="Casting Director"
                    value={analysis.project.castingDirector || ""}
                    onChange={(v) =>
                      updateProject("castingDirector", v || null)
                    }
                  />
                  <FieldInput
                    label="Production Dates"
                    value={analysis.project.productionDates || ""}
                    onChange={(v) =>
                      updateProject("productionDates", v || null)
                    }
                  />
                </div>
              </section>

              {/* Roles */}
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-[#E8E3D8] uppercase tracking-wider">
                    Roles ({includedCount} of {analysis.roles.length} selected)
                  </h3>
                  <button
                    onClick={addRole}
                    className="flex items-center gap-1 text-xs text-[#C9A84C] hover:text-[#D4B35C] transition"
                  >
                    <Plus size={12} />
                    Add Role
                  </button>
                </div>
                <div className="space-y-2">
                  {analysis.roles.map((role, idx) => (
                    <div
                      key={idx}
                      className={`rounded-lg border p-3 transition ${
                        role.include
                          ? "border-[#2A2D35] bg-[#161920]"
                          : "border-[#1E2128] bg-[#0D0F14] opacity-50"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <button
                          onClick={() => toggleRole(idx)}
                          className={`mt-1 w-5 h-5 rounded border flex-shrink-0 flex items-center justify-center transition ${
                            role.include
                              ? "border-[#C9A84C] bg-[#C9A84C]"
                              : "border-[#3A3D45] bg-transparent"
                          }`}
                        >
                          {role.include && (
                            <Check size={12} className="text-[#0D0F14]" />
                          )}
                        </button>
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <input
                              value={role.name}
                              onChange={(e) =>
                                updateRole(idx, "name", e.target.value)
                              }
                              className="bg-transparent border-b border-transparent hover:border-[#2A2D35] focus:border-[#C9A84C] text-sm font-medium text-[#E8E3D8] focus:outline-none px-0 py-0.5"
                            />
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full ${
                                role.speaking
                                  ? "bg-[#C9A84C]/15 text-[#C9A84C]"
                                  : "bg-[#1E2128] text-[#8B8D93]"
                              }`}
                            >
                              {role.speaking ? "Speaking" : "Non-speaking"}
                            </span>
                            {role.ageRange && (
                              <span className="text-[10px] text-[#8B8D93]">
                                {role.ageRange}
                              </span>
                            )}
                            {role.gender && (
                              <span className="text-[10px] text-[#8B8D93]">
                                {role.gender}
                              </span>
                            )}
                          </div>
                          <textarea
                            value={role.description}
                            onChange={(e) =>
                              updateRole(idx, "description", e.target.value)
                            }
                            rows={2}
                            className="w-full rounded border border-[#2A2D35] bg-[#0D0F14] px-2 py-1.5 text-xs text-[#8B8D93] focus:border-[#C9A84C] focus:outline-none resize-none"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Self-Tape Instructions */}
              {optSelfTape && analysis.selfTapeInstructions.length > 0 && (
                <section>
                  <h3 className="text-sm font-semibold text-[#E8E3D8] uppercase tracking-wider mb-3">
                    Self-Tape Instructions
                  </h3>
                  <div className="space-y-2">
                    {analysis.selfTapeInstructions.map((st, idx) => {
                      const isExpanded = expandedSelfTape.has(st.roleName);
                      return (
                        <div
                          key={idx}
                          className="rounded-lg border border-[#2A2D35] bg-[#161920]"
                        >
                          <button
                            onClick={() => {
                              setExpandedSelfTape((prev) => {
                                const next = new Set(prev);
                                if (next.has(st.roleName))
                                  next.delete(st.roleName);
                                else next.add(st.roleName);
                                return next;
                              });
                            }}
                            className="w-full flex items-center justify-between px-4 py-3 text-left"
                          >
                            <span className="text-sm font-medium text-[#E8E3D8]">
                              {st.roleName}
                            </span>
                            {isExpanded ? (
                              <ChevronDown
                                size={14}
                                className="text-[#8B8D93]"
                              />
                            ) : (
                              <ChevronRight
                                size={14}
                                className="text-[#8B8D93]"
                              />
                            )}
                          </button>
                          {isExpanded && (
                            <div className="px-4 pb-4 space-y-3 border-t border-[#1E2128] pt-3">
                              {st.videos.length > 0 && (
                                <div>
                                  <p className="text-[10px] uppercase tracking-wider text-[#8B8D93] mb-1.5">
                                    Videos
                                  </p>
                                  {st.videos.map((v, vi) => (
                                    <div
                                      key={vi}
                                      className="mb-2 space-y-1"
                                    >
                                      <input
                                        value={v.label}
                                        onChange={(e) => {
                                          const newVideos = [...st.videos];
                                          newVideos[vi] = {
                                            ...v,
                                            label: e.target.value,
                                          };
                                          updateSelfTapeField(
                                            idx,
                                            "videos",
                                            newVideos
                                          );
                                        }}
                                        className="w-full rounded border border-[#2A2D35] bg-[#0D0F14] px-2 py-1 text-xs text-[#E8E3D8] focus:border-[#C9A84C] focus:outline-none"
                                        placeholder="Video label"
                                      />
                                      <textarea
                                        value={v.description}
                                        onChange={(e) => {
                                          const newVideos = [...st.videos];
                                          newVideos[vi] = {
                                            ...v,
                                            description: e.target.value,
                                          };
                                          updateSelfTapeField(
                                            idx,
                                            "videos",
                                            newVideos
                                          );
                                        }}
                                        rows={2}
                                        className="w-full rounded border border-[#2A2D35] bg-[#0D0F14] px-2 py-1 text-xs text-[#8B8D93] focus:border-[#C9A84C] focus:outline-none resize-none"
                                        placeholder="Description"
                                      />
                                    </div>
                                  ))}
                                </div>
                              )}
                              {st.photos.length > 0 && (
                                <div>
                                  <p className="text-[10px] uppercase tracking-wider text-[#8B8D93] mb-1.5">
                                    Photos
                                  </p>
                                  {st.photos.map((p, pi) => (
                                    <input
                                      key={pi}
                                      value={p}
                                      onChange={(e) => {
                                        const newPhotos = [...st.photos];
                                        newPhotos[pi] = e.target.value;
                                        updateSelfTapeField(
                                          idx,
                                          "photos",
                                          newPhotos
                                        );
                                      }}
                                      className="w-full mb-1 rounded border border-[#2A2D35] bg-[#0D0F14] px-2 py-1 text-xs text-[#E8E3D8] focus:border-[#C9A84C] focus:outline-none"
                                    />
                                  ))}
                                </div>
                              )}
                              {st.filmingNotes.length > 0 && (
                                <div>
                                  <p className="text-[10px] uppercase tracking-wider text-[#8B8D93] mb-1.5">
                                    Filming Notes
                                  </p>
                                  {st.filmingNotes.map((n, ni) => (
                                    <input
                                      key={ni}
                                      value={n}
                                      onChange={(e) => {
                                        const newNotes = [
                                          ...st.filmingNotes,
                                        ];
                                        newNotes[ni] = e.target.value;
                                        updateSelfTapeField(
                                          idx,
                                          "filmingNotes",
                                          newNotes
                                        );
                                      }}
                                      className="w-full mb-1 rounded border border-[#2A2D35] bg-[#0D0F14] px-2 py-1 text-xs text-[#E8E3D8] focus:border-[#C9A84C] focus:outline-none"
                                    />
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* Form Questions */}
              {optForms && analysis.formQuestions.length > 0 && (
                <section>
                  <h3 className="text-sm font-semibold text-[#E8E3D8] uppercase tracking-wider mb-1">
                    Form Questions
                  </h3>
                  <p className="text-[10px] text-[#8B8D93] mb-3">
                    Standard fields (name, email, phone, location) are always
                    included.
                  </p>
                  <div className="space-y-2">
                    {analysis.formQuestions.map((fq, roleIdx) => {
                      const isExpanded = expandedForms.has(fq.roleName);
                      return (
                        <div
                          key={roleIdx}
                          className="rounded-lg border border-[#2A2D35] bg-[#161920]"
                        >
                          <button
                            onClick={() => {
                              setExpandedForms((prev) => {
                                const next = new Set(prev);
                                if (next.has(fq.roleName))
                                  next.delete(fq.roleName);
                                else next.add(fq.roleName);
                                return next;
                              });
                            }}
                            className="w-full flex items-center justify-between px-4 py-3 text-left"
                          >
                            <span className="text-sm font-medium text-[#E8E3D8]">
                              {fq.roleName}{" "}
                              <span className="text-xs text-[#8B8D93]">
                                ({fq.questions.length} questions)
                              </span>
                            </span>
                            {isExpanded ? (
                              <ChevronDown
                                size={14}
                                className="text-[#8B8D93]"
                              />
                            ) : (
                              <ChevronRight
                                size={14}
                                className="text-[#8B8D93]"
                              />
                            )}
                          </button>
                          {isExpanded && (
                            <div className="px-4 pb-4 space-y-2 border-t border-[#1E2128] pt-3">
                              {fq.questions.map((q, qIdx) => (
                                <div
                                  key={qIdx}
                                  className="flex items-start gap-2"
                                >
                                  <select
                                    value={q.type}
                                    onChange={(e) =>
                                      updateFormQuestion(
                                        roleIdx,
                                        qIdx,
                                        "type",
                                        e.target.value
                                      )
                                    }
                                    className="w-24 shrink-0 rounded border border-[#2A2D35] bg-[#0D0F14] px-2 py-1 text-xs text-[#8B8D93] focus:border-[#C9A84C] focus:outline-none"
                                  >
                                    <option value="text">Text</option>
                                    <option value="textarea">
                                      Long Text
                                    </option>
                                    <option value="radio">Radio</option>
                                    <option value="checkbox">
                                      Checkbox
                                    </option>
                                  </select>
                                  <input
                                    value={q.label}
                                    onChange={(e) =>
                                      updateFormQuestion(
                                        roleIdx,
                                        qIdx,
                                        "label",
                                        e.target.value
                                      )
                                    }
                                    className="flex-1 rounded border border-[#2A2D35] bg-[#0D0F14] px-2 py-1 text-xs text-[#E8E3D8] focus:border-[#C9A84C] focus:outline-none"
                                    placeholder="Question label"
                                  />
                                  <button
                                    onClick={() =>
                                      removeFormQuestion(roleIdx, qIdx)
                                    }
                                    className="text-[#8B8D93] hover:text-red-400 transition p-1 shrink-0"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              ))}
                              <button
                                onClick={() => addFormQuestion(roleIdx)}
                                className="flex items-center gap-1 text-xs text-[#C9A84C] hover:text-[#D4B35C] transition mt-1"
                              >
                                <Plus size={12} />
                                Add Question
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}
            </div>
          )}

          {/* ==================== CREATING STAGE ==================== */}
          {stage === "creating" && (
            <div className="py-8">
              <div className="max-w-sm mx-auto space-y-3">
                {creationSteps.map((step, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    {step.status === "done" ? (
                      <div className="w-5 h-5 rounded-full bg-emerald-500/15 flex items-center justify-center shrink-0">
                        <Check size={12} className="text-emerald-400" />
                      </div>
                    ) : step.status === "error" ? (
                      <div className="w-5 h-5 rounded-full bg-red-500/15 flex items-center justify-center shrink-0">
                        <AlertCircle size={12} className="text-red-400" />
                      </div>
                    ) : step.status === "active" ? (
                      <Loader2
                        size={18}
                        className="text-[#C9A84C] animate-spin shrink-0"
                      />
                    ) : (
                      <div className="w-5 h-5 rounded-full border border-[#2A2D35] shrink-0" />
                    )}
                    <span
                      className={`text-sm ${
                        step.status === "done"
                          ? "text-[#8B8D93]"
                          : step.status === "error"
                          ? "text-red-400"
                          : step.status === "active"
                          ? "text-[#E8E3D8]"
                          : "text-[#6B7280]"
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ==================== DONE STAGE ==================== */}
          {stage === "done" && creationSummary && (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                <Check size={32} className="text-emerald-400" />
              </div>
              <h3 className="text-lg font-medium text-[#E8E3D8] mb-2">
                Project created successfully!
              </h3>
              <p className="text-sm text-[#8B8D93]">
                Project &lsquo;{creationSummary.name}&rsquo; created with{" "}
                {creationSummary.rolesCreated} role
                {creationSummary.rolesCreated !== 1 ? "s" : ""}
                {creationSummary.formsCreated > 0
                  ? `, ${creationSummary.formsCreated} form${
                      creationSummary.formsCreated !== 1 ? "s" : ""
                    }`
                  : ""}
                {creationSummary.documentsCreated > 0
                  ? `, ${creationSummary.documentsCreated} document${
                      creationSummary.documentsCreated !== 1 ? "s" : ""
                    }`
                  : ""}
                .
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        {stage === "upload" && (
          <div className="border-t border-[#1E2128] px-6 py-4 flex justify-end shrink-0">
            <Button
              variant="primary"
              size="md"
              onClick={handleAnalyze}
              disabled={files.length === 0}
            >
              <Sparkles size={14} className="mr-2" />
              Analyze Documents
            </Button>
          </div>
        )}

        {stage === "review" && (
          <div className="border-t border-[#1E2128] px-6 py-4 flex justify-between items-center shrink-0">
            <span className="text-xs text-[#8B8D93]">
              {includedCount} role{includedCount !== 1 ? "s" : ""} selected
            </span>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={onClose}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleCreateEverything}
                disabled={includedCount === 0}
              >
                Create Everything
              </Button>
            </div>
          </div>
        )}

        {stage === "creating" && error && (
          <div className="border-t border-[#1E2128] px-6 py-4 flex justify-end shrink-0">
            <Button
              variant="primary"
              size="sm"
              onClick={handleCreateEverything}
            >
              Retry
            </Button>
          </div>
        )}

        {stage === "done" && (
          <div className="border-t border-[#1E2128] px-6 py-4 flex justify-end shrink-0">
            <Button
              variant="primary"
              size="sm"
              onClick={() => onProjectCreated(createdProjectId!)}
            >
              View Project &rarr;
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function OptionCheckbox({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="flex items-center gap-2.5 w-full text-left"
    >
      <div
        className={`w-4 h-4 rounded border flex items-center justify-center transition ${
          checked
            ? "border-[#C9A84C] bg-[#C9A84C]"
            : "border-[#3A3D45] bg-transparent"
        }`}
      >
        {checked && <Check size={10} className="text-[#0D0F14]" />}
      </div>
      <span className="text-sm text-[#E8E3D8]">{label}</span>
    </button>
  );
}

function FieldInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-xs text-[#8B8D93] mb-1">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-[#2A2D35] bg-[#0D0F14] px-3 py-2 text-sm text-[#E8E3D8] focus:border-[#C9A84C] focus:outline-none"
      />
    </div>
  );
}
