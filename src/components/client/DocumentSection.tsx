"use client";

import { useState, useRef } from "react";
import { FileText, File, Trash2, Download, Upload, Loader2 } from "lucide-react";

interface Document {
  id: string;
  name: string;
  url: string;
  file_type: string;
  size_bytes: number;
  created_at: string;
  created_by: string;
}

interface DocumentSectionProps {
  projectId?: string;
  roleId?: string;
  documents: Document[];
}

function fileIcon(fileType: string) {
  if (fileType === "pdf") return <FileText size={16} className="text-red-400" />;
  if (fileType === "doc" || fileType === "docx")
    return <FileText size={16} className="text-blue-400" />;
  return <File size={16} className="text-[#8B8D93]" />;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentSection({
  projectId,
  roleId,
  documents: initialDocuments,
}: DocumentSectionProps) {
  const [documents, setDocuments] = useState<Document[]>(initialDocuments);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("name", file.name);
      if (projectId) formData.append("project_id", projectId);
      if (roleId) formData.append("role_id", roleId);

      const res = await fetch("/api/documents", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const doc = await res.json();
        setDocuments((prev) => [doc, ...prev]);
      }
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleDelete(id: string) {
    setDeleting(id);
    try {
      const res = await fetch(`/api/documents?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setDocuments((prev) => prev.filter((d) => d.id !== id));
      }
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="rounded-xl border border-[#1E2128] bg-[#161920] p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-[#8B8D93]">
          {roleId ? "Sides & Documents" : "Documents"}
        </h3>
        <label className="inline-flex items-center gap-1.5 rounded-lg bg-[#1E2128] px-3 py-1.5 text-xs text-[#E8E3D8] hover:bg-[#262930] transition cursor-pointer">
          {uploading ? (
            <>
              <Loader2 size={13} className="animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload size={13} />
              Upload
            </>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={handleUpload}
            className="hidden"
            disabled={uploading}
          />
        </label>
      </div>

      {documents.length === 0 ? (
        <p className="text-xs text-[#8B8D93]">No documents uploaded yet.</p>
      ) : (
        <div className="space-y-2">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center gap-3 rounded-lg bg-[#0D0F14] px-3 py-2"
            >
              {fileIcon(doc.file_type)}
              <div className="min-w-0 flex-1">
                <p className="text-sm text-[#E8E3D8] truncate">{doc.name}</p>
                <p className="text-[10px] text-[#8B8D93]">
                  {formatSize(doc.size_bytes)} &middot;{" "}
                  {doc.file_type.toUpperCase()}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <a
                  href={`/api/documents/${doc.id}/download`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded p-1.5 text-[#8B8D93] hover:text-[#E8E3D8] hover:bg-[#1E2128] transition"
                  title="Download"
                >
                  <Download size={13} />
                </a>
                <button
                  onClick={() => handleDelete(doc.id)}
                  disabled={deleting === doc.id}
                  className="rounded p-1.5 text-[#8B8D93] hover:text-red-400 hover:bg-red-900/20 transition disabled:opacity-50"
                  title="Delete"
                >
                  {deleting === doc.id ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <Trash2 size={13} />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
