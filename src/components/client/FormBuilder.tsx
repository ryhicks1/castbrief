"use client";

import { useState } from "react";
import {
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  GripVertical,
  Eye,
  EyeOff,
  Type,
  Mail,
  Phone,
  AlignLeft,
  CircleDot,
  CheckSquare,
  ChevronDown as SelectIcon,
  Upload,
  Hash,
  Calendar,
  Heading,
  FileText,
  X,
} from "lucide-react";

export interface FormField {
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

interface FormBuilderProps {
  initialFields?: FormField[];
  formName?: string;
  onSave: (name: string, fields: FormField[]) => void;
  onCancel?: () => void;
}

const FIELD_TYPES: { value: FormField["type"]; label: string; icon: any }[] = [
  { value: "text", label: "Text", icon: Type },
  { value: "email", label: "Email", icon: Mail },
  { value: "phone", label: "Phone", icon: Phone },
  { value: "textarea", label: "Long Text", icon: AlignLeft },
  { value: "number", label: "Number", icon: Hash },
  { value: "date", label: "Date", icon: Calendar },
  { value: "radio", label: "Radio", icon: CircleDot },
  { value: "checkbox", label: "Checkbox", icon: CheckSquare },
  { value: "select", label: "Dropdown", icon: SelectIcon },
  { value: "file", label: "File Upload", icon: Upload },
  { value: "heading", label: "Heading", icon: Heading },
];

const OPTION_TYPES = ["radio", "checkbox", "select"];

const DEFAULT_TEMPLATE: FormField[] = [
  { id: "full_name", type: "text", label: "Full Name", required: true },
  { id: "email", type: "email", label: "Email", required: true },
  { id: "phone", type: "phone", label: "Phone", required: false },
  { id: "city_state", type: "text", label: "City / State", required: true },
  { id: "agent_manager", type: "text", label: "Agent / Manager", required: false },
  {
    id: "availability",
    type: "radio",
    label: "Available for filming dates?",
    required: true,
    options: ["Yes", "No", "Maybe"],
  },
  { id: "photo", type: "file", label: "Upload recent photo", required: false },
  { id: "instagram", type: "text", label: "Instagram handle", required: false, placeholder: "@handle" },
];

function generateId() {
  return "f_" + Math.random().toString(36).slice(2, 10);
}

function getFieldIcon(type: FormField["type"]) {
  const match = FIELD_TYPES.find((t) => t.value === type);
  if (!match) return Type;
  return match.icon;
}

export default function FormBuilder({
  initialFields,
  formName: initialName,
  onSave,
  onCancel,
}: FormBuilderProps) {
  const [name, setName] = useState(initialName || "");
  const [fields, setFields] = useState<FormField[]>(initialFields || []);
  const [preview, setPreview] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);

  // New field form state
  const [showAddField, setShowAddField] = useState(false);
  const [newType, setNewType] = useState<FormField["type"]>("text");
  const [newLabel, setNewLabel] = useState("");
  const [newRequired, setNewRequired] = useState(false);
  const [newOptions, setNewOptions] = useState<string[]>([""]);
  const [newPlaceholder, setNewPlaceholder] = useState("");

  function resetNewField() {
    setNewType("text");
    setNewLabel("");
    setNewRequired(false);
    setNewOptions([""]);
    setNewPlaceholder("");
    setShowAddField(false);
  }

  function addField() {
    if (!newLabel.trim()) return;
    const field: FormField = {
      id: generateId(),
      type: newType,
      label: newLabel.trim(),
      required: newRequired,
    };
    if (OPTION_TYPES.includes(newType)) {
      field.options = newOptions.filter((o) => o.trim()).map((o) => o.trim());
    }
    if (newPlaceholder.trim()) {
      field.placeholder = newPlaceholder.trim();
    }
    setFields([...fields, field]);
    resetNewField();
  }

  function removeField(id: string) {
    setFields(fields.filter((f) => f.id !== id));
    if (editingField === id) setEditingField(null);
  }

  function moveField(index: number, direction: "up" | "down") {
    const newFields = [...fields];
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= newFields.length) return;
    [newFields[index], newFields[target]] = [newFields[target], newFields[index]];
    setFields(newFields);
  }

  function updateField(id: string, updates: Partial<FormField>) {
    setFields(fields.map((f) => (f.id === id ? { ...f, ...updates } : f)));
  }

  function loadTemplate() {
    setFields(DEFAULT_TEMPLATE.map((f) => ({ ...f, id: generateId() })));
    if (!name) setName("Casting Submission Form");
  }

  function handleSave() {
    if (!name.trim() || fields.length === 0) return;
    onSave(name.trim(), fields);
  }

  return (
    <div className="space-y-6">
      {/* Form Name */}
      <div>
        <label className="block text-xs text-[#8B8D93] mb-1">Form Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Casting Submission Form"
          className="w-full rounded-lg border border-[#1E2128] bg-[#0F0F12] px-3 py-2 text-sm text-[#E8E3D8] placeholder-[#555] focus:border-[#C9A84C] focus:outline-none"
        />
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={loadTemplate}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[#1E2128] bg-[#161920] px-3 py-1.5 text-xs text-[#8B8D93] hover:text-[#E8E3D8] hover:border-[#2A2D35] transition"
        >
          <FileText size={12} />
          Load Default Template
        </button>
        <button
          type="button"
          onClick={() => setPreview(!preview)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[#1E2128] bg-[#161920] px-3 py-1.5 text-xs text-[#8B8D93] hover:text-[#E8E3D8] hover:border-[#2A2D35] transition"
        >
          {preview ? <EyeOff size={12} /> : <Eye size={12} />}
          {preview ? "Edit" : "Preview"}
        </button>
      </div>

      {/* Preview Mode */}
      {preview ? (
        <div className="rounded-xl border border-[#1E2128] bg-[#13151A] p-6">
          <h3 className="text-lg font-semibold text-[#E8E3D8] mb-4">{name || "Untitled Form"}</h3>
          <div className="space-y-4">
            {fields.map((field) => (
              <PreviewField key={field.id} field={field} />
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Fields List */}
          <div className="space-y-2">
            {fields.length === 0 && (
              <div className="rounded-xl border border-dashed border-[#1E2128] bg-[#13151A] p-8 text-center">
                <p className="text-sm text-[#8B8D93]">
                  No fields yet. Add fields below or load the default template.
                </p>
              </div>
            )}
            {fields.map((field, idx) => (
              <div
                key={field.id}
                className={`rounded-xl border p-3 transition ${
                  editingField === field.id
                    ? "border-[#C9A84C] bg-[#C9A84C]/5"
                    : "border-[#1E2128] bg-[#13151A]"
                }`}
              >
                <div className="flex items-center gap-2">
                  <GripVertical size={14} className="text-[#555] flex-shrink-0" />
                  {(() => {
                    const Icon = getFieldIcon(field.type);
                    return <Icon size={14} className="text-[#8B8D93] flex-shrink-0" />;
                  })()}
                  <span className="text-sm text-[#E8E3D8] flex-1 truncate">{field.label}</span>
                  {field.required && (
                    <span className="rounded-full bg-[#C9A84C]/10 px-2 py-0.5 text-[10px] text-[#C9A84C] flex-shrink-0">
                      Required
                    </span>
                  )}
                  <span className="text-[10px] text-[#555] flex-shrink-0">{field.type}</span>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => moveField(idx, "up")}
                      disabled={idx === 0}
                      className="p-1 text-[#555] hover:text-[#E8E3D8] disabled:opacity-30 transition"
                    >
                      <ChevronUp size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveField(idx, "down")}
                      disabled={idx === fields.length - 1}
                      className="p-1 text-[#555] hover:text-[#E8E3D8] disabled:opacity-30 transition"
                    >
                      <ChevronDown size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setEditingField(editingField === field.id ? null : field.id)
                      }
                      className="p-1 text-[#555] hover:text-[#C9A84C] transition"
                    >
                      <Type size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeField(field.id)}
                      className="p-1 text-[#555] hover:text-red-400 transition"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Inline edit */}
                {editingField === field.id && (
                  <div className="mt-3 pt-3 border-t border-[#1E2128] space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] text-[#8B8D93] mb-1">Label</label>
                        <input
                          type="text"
                          value={field.label}
                          onChange={(e) => updateField(field.id, { label: e.target.value })}
                          className="w-full rounded-lg border border-[#1E2128] bg-[#0F0F12] px-2 py-1.5 text-xs text-[#E8E3D8] focus:border-[#C9A84C] focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-[#8B8D93] mb-1">Placeholder</label>
                        <input
                          type="text"
                          value={field.placeholder || ""}
                          onChange={(e) =>
                            updateField(field.id, { placeholder: e.target.value || undefined })
                          }
                          className="w-full rounded-lg border border-[#1E2128] bg-[#0F0F12] px-2 py-1.5 text-xs text-[#E8E3D8] focus:border-[#C9A84C] focus:outline-none"
                        />
                      </div>
                    </div>
                    <label className="flex items-center gap-2 text-xs text-[#8B8D93] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={field.required}
                        onChange={(e) => updateField(field.id, { required: e.target.checked })}
                        className="rounded border-[#1E2128] bg-[#0F0F12] text-[#C9A84C]"
                      />
                      Required
                    </label>
                    {OPTION_TYPES.includes(field.type) && (
                      <div>
                        <label className="block text-[10px] text-[#8B8D93] mb-1">Options</label>
                        {(field.options || [""]).map((opt, oi) => (
                          <div key={oi} className="flex items-center gap-1 mb-1">
                            <input
                              type="text"
                              value={opt}
                              onChange={(e) => {
                                const opts = [...(field.options || [""])];
                                opts[oi] = e.target.value;
                                updateField(field.id, { options: opts });
                              }}
                              className="flex-1 rounded-lg border border-[#1E2128] bg-[#0F0F12] px-2 py-1 text-xs text-[#E8E3D8] focus:border-[#C9A84C] focus:outline-none"
                              placeholder={`Option ${oi + 1}`}
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const opts = (field.options || [""]).filter((_, i) => i !== oi);
                                updateField(field.id, { options: opts.length ? opts : [""] });
                              }}
                              className="p-0.5 text-[#555] hover:text-red-400"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() =>
                            updateField(field.id, { options: [...(field.options || [""]), ""] })
                          }
                          className="text-[10px] text-[#C9A84C] hover:underline mt-1"
                        >
                          + Add option
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Add Field */}
          {showAddField ? (
            <div className="rounded-xl border border-[#C9A84C]/30 bg-[#13151A] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold text-[#E8E3D8]">Add Field</h4>
                <button
                  type="button"
                  onClick={resetNewField}
                  className="p-1 text-[#555] hover:text-[#E8E3D8]"
                >
                  <X size={14} />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-[#8B8D93] mb-1">Type</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as FormField["type"])}
                    className="w-full rounded-lg border border-[#1E2128] bg-[#0F0F12] px-2 py-1.5 text-xs text-[#E8E3D8] focus:border-[#C9A84C] focus:outline-none"
                  >
                    {FIELD_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-[#8B8D93] mb-1">Label</label>
                  <input
                    type="text"
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    placeholder="Field label"
                    className="w-full rounded-lg border border-[#1E2128] bg-[#0F0F12] px-2 py-1.5 text-xs text-[#E8E3D8] placeholder-[#555] focus:border-[#C9A84C] focus:outline-none"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addField();
                      }
                    }}
                  />
                </div>
              </div>
              {!OPTION_TYPES.includes(newType) && newType !== "heading" && newType !== "file" && (
                <div>
                  <label className="block text-[10px] text-[#8B8D93] mb-1">Placeholder</label>
                  <input
                    type="text"
                    value={newPlaceholder}
                    onChange={(e) => setNewPlaceholder(e.target.value)}
                    placeholder="Optional placeholder text"
                    className="w-full rounded-lg border border-[#1E2128] bg-[#0F0F12] px-2 py-1.5 text-xs text-[#E8E3D8] placeholder-[#555] focus:border-[#C9A84C] focus:outline-none"
                  />
                </div>
              )}
              {OPTION_TYPES.includes(newType) && (
                <div>
                  <label className="block text-[10px] text-[#8B8D93] mb-1">Options</label>
                  {newOptions.map((opt, i) => (
                    <div key={i} className="flex items-center gap-1 mb-1">
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => {
                          const opts = [...newOptions];
                          opts[i] = e.target.value;
                          setNewOptions(opts);
                        }}
                        className="flex-1 rounded-lg border border-[#1E2128] bg-[#0F0F12] px-2 py-1 text-xs text-[#E8E3D8] focus:border-[#C9A84C] focus:outline-none"
                        placeholder={`Option ${i + 1}`}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const opts = newOptions.filter((_, idx) => idx !== i);
                          setNewOptions(opts.length ? opts : [""]);
                        }}
                        className="p-0.5 text-[#555] hover:text-red-400"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setNewOptions([...newOptions, ""])}
                    className="text-[10px] text-[#C9A84C] hover:underline mt-1"
                  >
                    + Add option
                  </button>
                </div>
              )}
              <label className="flex items-center gap-2 text-xs text-[#8B8D93] cursor-pointer">
                <input
                  type="checkbox"
                  checked={newRequired}
                  onChange={(e) => setNewRequired(e.target.checked)}
                  className="rounded border-[#1E2128] bg-[#0F0F12] text-[#C9A84C]"
                />
                Required
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={addField}
                  disabled={!newLabel.trim()}
                  className="inline-flex items-center gap-1 rounded-lg bg-[#C9A84C] px-3 py-1.5 text-xs font-semibold text-[#0D0F14] hover:bg-[#D4B35C] transition disabled:opacity-50"
                >
                  <Plus size={12} />
                  Add
                </button>
                <button
                  type="button"
                  onClick={resetNewField}
                  className="rounded-lg border border-[#1E2128] px-3 py-1.5 text-xs text-[#8B8D93] hover:text-[#E8E3D8] transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowAddField(true)}
              className="w-full rounded-xl border border-dashed border-[#1E2128] bg-[#13151A] p-3 text-xs text-[#8B8D93] hover:text-[#C9A84C] hover:border-[#C9A84C]/30 transition flex items-center justify-center gap-1.5"
            >
              <Plus size={14} />
              Add Field
            </button>
          )}
        </>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={!name.trim() || fields.length === 0}
          className="inline-flex items-center rounded-lg bg-gradient-to-r from-[#C9A84C] to-[#B8943F] px-5 py-2 text-sm font-semibold text-[#0D0F14] hover:from-[#D4B35C] hover:to-[#C9A84C] transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Save Form
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-[#1E2128] px-4 py-2 text-sm text-[#8B8D93] hover:text-[#E8E3D8] hover:border-[#2A2D35] transition"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}

function PreviewField({ field }: { field: FormField }) {
  const inputClass =
    "w-full rounded-lg border border-[#1E2128] bg-[#0F0F12] px-3 py-2 text-sm text-[#E8E3D8] placeholder-[#555]";

  if (field.type === "heading") {
    return (
      <h3 className="text-base font-semibold text-[#E8E3D8] pt-2">{field.label}</h3>
    );
  }

  return (
    <div>
      <label className="block text-xs text-[#8B8D93] mb-1">
        {field.label}
        {field.required && <span className="text-[#C9A84C] ml-0.5">*</span>}
      </label>
      {field.type === "textarea" ? (
        <textarea
          rows={3}
          placeholder={field.placeholder}
          className={`${inputClass} resize-none`}
          disabled
        />
      ) : field.type === "radio" ? (
        <div className="space-y-1.5">
          {(field.options || []).map((opt, i) => (
            <label key={i} className="flex items-center gap-2 text-sm text-[#E8E3D8]">
              <input type="radio" name={field.id} disabled className="text-[#C9A84C]" />
              {opt}
            </label>
          ))}
        </div>
      ) : field.type === "checkbox" ? (
        <div className="space-y-1.5">
          {(field.options || []).map((opt, i) => (
            <label key={i} className="flex items-center gap-2 text-sm text-[#E8E3D8]">
              <input type="checkbox" disabled className="text-[#C9A84C]" />
              {opt}
            </label>
          ))}
        </div>
      ) : field.type === "select" ? (
        <select className={inputClass} disabled>
          <option>Select...</option>
          {(field.options || []).map((opt, i) => (
            <option key={i}>{opt}</option>
          ))}
        </select>
      ) : field.type === "file" ? (
        <div className="flex items-center gap-2 rounded-lg border border-dashed border-[#1E2128] bg-[#0F0F12] px-4 py-3 text-xs text-[#555]">
          <Upload size={14} />
          Click to upload or drag and drop
        </div>
      ) : (
        <input
          type={field.type}
          placeholder={field.placeholder}
          className={inputClass}
          disabled
        />
      )}
    </div>
  );
}
