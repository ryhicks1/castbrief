"use client";

import { useState } from "react";
import { CheckCircle, Upload, X } from "lucide-react";

interface FormField {
  id: string;
  type:
    | "text"
    | "email"
    | "phone"
    | "textarea"
    | "radio"
    | "checkbox"
    | "select"
    | "file"
    | "number"
    | "date"
    | "heading";
  label: string;
  required: boolean;
  options?: string[];
  placeholder?: string;
}

interface FormRendererProps {
  formId: string;
  formName: string;
  fields: FormField[];
  projectName?: string;
  roleName?: string;
}

export default function FormRenderer({
  formId,
  formName,
  fields,
  projectName,
  roleName,
}: FormRendererProps) {
  const [data, setData] = useState<Record<string, any>>({});
  const [fileUrls, setFileUrls] = useState<string[]>([]);
  const [talentName, setTalentName] = useState("");
  const [talentEmail, setTalentEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [uploadingFields, setUploadingFields] = useState<Record<string, boolean>>({});

  // Check if name/email fields exist in form definition
  const hasNameField = fields.some(
    (f) => f.type === "text" && f.id === "full_name"
  );
  const hasEmailField = fields.some(
    (f) => f.type === "email" && f.id === "email"
  );

  function updateData(fieldId: string, value: any) {
    setData((prev) => ({ ...prev, [fieldId]: value }));
    if (fieldErrors[fieldId]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[fieldId];
        return next;
      });
    }
  }

  function toggleCheckbox(fieldId: string, option: string) {
    setData((prev) => {
      const current = Array.isArray(prev[fieldId]) ? prev[fieldId] : [];
      const next = current.includes(option)
        ? current.filter((o: string) => o !== option)
        : [...current, option];
      return { ...prev, [fieldId]: next };
    });
  }

  async function uploadFile(fieldId: string, file: File) {
    setUploadingFields((prev) => ({ ...prev, [fieldId]: true }));
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("path", "form-uploads");
      const res = await fetch("/api/upload/open-call", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Upload failed");
      }
      const d = await res.json();
      setFileUrls((prev) => [...prev, d.url]);
      updateData(fieldId, d.url);
    } catch (err: any) {
      setError("File upload failed: " + (err.message || "Please try again."));
    } finally {
      setUploadingFields((prev) => ({ ...prev, [fieldId]: false }));
    }
  }

  function validate(): boolean {
    const errors: Record<string, string> = {};

    if (!hasNameField && !talentName.trim()) {
      errors["_talent_name"] = "Name is required";
    }
    if (!hasEmailField && !talentEmail.trim()) {
      errors["_talent_email"] = "Email is required";
    }

    for (const field of fields) {
      if (!field.required || field.type === "heading") continue;
      const value = data[field.id];
      if (field.type === "file") {
        // File fields are optional for validation (URL stored in data)
        continue;
      }
      if (field.type === "checkbox") {
        if (!Array.isArray(value) || value.length === 0) {
          errors[field.id] = `${field.label} is required`;
        }
      } else if (value === undefined || value === null || value === "") {
        errors[field.id] = `${field.label} is required`;
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setError("");

    // Derive talent name/email from form fields if present
    const finalName = hasNameField ? data["full_name"] || "" : talentName;
    const finalEmail = hasEmailField ? data["email"] || "" : talentEmail;

    try {
      const res = await fetch(`/api/forms/${formId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          talent_name: finalName,
          talent_email: finalEmail,
          data,
          file_urls: fileUrls,
        }),
      });
      const result = await res.json();
      if (res.ok && result.success) {
        setSubmitted(true);
      } else {
        setError(result.error || "Submission failed. Please try again.");
      }
    } catch {
      setError("Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="text-center py-16">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 mb-6">
          <CheckCircle size={32} className="text-green-400" />
        </div>
        <h1 className="text-2xl font-bold text-[#E8E3D8] mb-2">
          Form submitted successfully!
        </h1>
        <p className="text-[#8B8D93]">
          Thank you for your submission. The team will review your response.
        </p>
      </div>
    );
  }

  const inputClass =
    "w-full rounded-lg border border-[#1E2128] bg-[#161920] px-3 py-2 text-sm text-[#E8E3D8] placeholder-[#555] focus:border-[#C9A84C] focus:outline-none";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#E8E3D8] mb-1">{formName}</h1>
        {(projectName || roleName) && (
          <p className="text-sm text-[#8B8D93]">
            {projectName}
            {roleName && ` \u00b7 ${roleName}`}
          </p>
        )}
      </div>

      {/* Built-in name/email if not in form fields */}
      {!hasNameField && (
        <div>
          <label className="block text-xs text-[#8B8D93] mb-1">
            Your Name <span className="text-[#C9A84C]">*</span>
          </label>
          <input
            type="text"
            value={talentName}
            onChange={(e) => {
              setTalentName(e.target.value);
              if (fieldErrors["_talent_name"]) {
                setFieldErrors((prev) => {
                  const next = { ...prev };
                  delete next["_talent_name"];
                  return next;
                });
              }
            }}
            className={inputClass}
            placeholder="Full name"
          />
          {fieldErrors["_talent_name"] && (
            <p className="mt-1 text-xs text-red-400">{fieldErrors["_talent_name"]}</p>
          )}
        </div>
      )}
      {!hasEmailField && (
        <div>
          <label className="block text-xs text-[#8B8D93] mb-1">
            Your Email <span className="text-[#C9A84C]">*</span>
          </label>
          <input
            type="email"
            value={talentEmail}
            onChange={(e) => {
              setTalentEmail(e.target.value);
              if (fieldErrors["_talent_email"]) {
                setFieldErrors((prev) => {
                  const next = { ...prev };
                  delete next["_talent_email"];
                  return next;
                });
              }
            }}
            className={inputClass}
            placeholder="you@email.com"
          />
          {fieldErrors["_talent_email"] && (
            <p className="mt-1 text-xs text-red-400">{fieldErrors["_talent_email"]}</p>
          )}
        </div>
      )}

      {/* Dynamic Fields */}
      {fields.map((field) => (
        <FieldInput
          key={field.id}
          field={field}
          value={data[field.id]}
          error={fieldErrors[field.id]}
          uploading={uploadingFields[field.id] || false}
          onChange={(val) => updateData(field.id, val)}
          onToggleCheckbox={(opt) => toggleCheckbox(field.id, opt)}
          onFileUpload={(file) => uploadFile(field.id, file)}
          inputClass={inputClass}
        />
      ))}

      {/* Error */}
      {error && <p className="text-sm text-red-400">{error}</p>}

      {/* Submit */}
      <button
        type="submit"
        disabled={submitting || Object.values(uploadingFields).some(Boolean)}
        className="w-full rounded-lg bg-gradient-to-r from-[#C9A84C] to-[#B8943F] px-4 py-3 text-sm font-semibold text-[#0D0F14] hover:from-[#D4B35C] hover:to-[#C9A84C] transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? "Submitting..." : "Submit"}
      </button>
    </form>
  );
}

function FieldInput({
  field,
  value,
  error,
  uploading,
  onChange,
  onToggleCheckbox,
  onFileUpload,
  inputClass,
}: {
  field: FormField;
  value: any;
  error?: string;
  uploading: boolean;
  onChange: (val: any) => void;
  onToggleCheckbox: (opt: string) => void;
  onFileUpload: (file: File) => void;
  inputClass: string;
}) {
  if (field.type === "heading") {
    return (
      <h3 className="text-base font-semibold text-[#E8E3D8] pt-2 border-t border-[#1E2128]">
        {field.label}
      </h3>
    );
  }

  const label = (
    <label className="block text-xs text-[#8B8D93] mb-1">
      {field.label}
      {field.required && <span className="text-[#C9A84C] ml-0.5">*</span>}
    </label>
  );

  const errorMsg = error ? (
    <p className="mt-1 text-xs text-red-400">{error}</p>
  ) : null;

  switch (field.type) {
    case "textarea":
      return (
        <div>
          {label}
          <textarea
            rows={3}
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            className={`${inputClass} resize-none`}
          />
          {errorMsg}
        </div>
      );

    case "radio":
      return (
        <div>
          {label}
          <div className="space-y-1.5">
            {(field.options || []).map((opt, i) => (
              <label
                key={i}
                className="flex items-center gap-2 text-sm text-[#E8E3D8] cursor-pointer"
              >
                <input
                  type="radio"
                  name={field.id}
                  value={opt}
                  checked={value === opt}
                  onChange={() => onChange(opt)}
                  className="text-[#C9A84C] border-[#1E2128] bg-[#161920] focus:ring-[#C9A84C]"
                />
                {opt}
              </label>
            ))}
          </div>
          {errorMsg}
        </div>
      );

    case "checkbox":
      return (
        <div>
          {label}
          <div className="space-y-1.5">
            {(field.options || []).map((opt, i) => (
              <label
                key={i}
                className="flex items-center gap-2 text-sm text-[#E8E3D8] cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={Array.isArray(value) && value.includes(opt)}
                  onChange={() => onToggleCheckbox(opt)}
                  className="rounded border-[#1E2128] bg-[#161920] text-[#C9A84C] focus:ring-[#C9A84C]"
                />
                {opt}
              </label>
            ))}
          </div>
          {errorMsg}
        </div>
      );

    case "select":
      return (
        <div>
          {label}
          <select
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            className={inputClass}
          >
            <option value="">Select...</option>
            {(field.options || []).map((opt, i) => (
              <option key={i} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          {errorMsg}
        </div>
      );

    case "file":
      return (
        <div>
          {label}
          <label className="flex items-center gap-2 cursor-pointer rounded-lg border border-dashed border-[#1E2128] bg-[#161920] px-4 py-3 text-xs text-[#8B8D93] hover:border-[#2A2D35] transition">
            <Upload size={14} />
            {uploading
              ? "Uploading..."
              : value
              ? "File uploaded - click to replace"
              : "Click to upload"}
            <input
              type="file"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onFileUpload(file);
              }}
              className="hidden"
              disabled={uploading}
            />
          </label>
          {value && !uploading && (
            <p className="mt-1 text-xs text-green-400">File uploaded</p>
          )}
          {errorMsg}
        </div>
      );

    default:
      return (
        <div>
          {label}
          <input
            type={field.type === "phone" ? "tel" : field.type}
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            className={inputClass}
          />
          {errorMsg}
        </div>
      );
  }
}
