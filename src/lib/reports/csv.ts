export interface TalentReportRow {
  full_name: string;
  age: number | null;
  location: string | null;
  agency_name: string | null;
  email: string | null;
  phone: string | null;
  cultural_background: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  links: Record<string, string>;
  tags: string[];
  client_status: string | null;
  client_rating: number | null;
  client_comment: string | null;
}

function escapeCSV(value: string | null | undefined): string {
  if (value == null) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

const LINK_KEYS = [
  "casting_networks",
  "actors_access",
  "spotlight",
  "showcast",
  "imdb",
  "youtube",
  "tiktok",
  "instagram",
];

export function generateTalentCSV(
  talents: TalentReportRow[],
  options?: { includeClientFeedback?: boolean }
): string {
  const includeClientFeedback = options?.includeClientFeedback ?? false;

  const headers = [
    "Name",
    "Age",
    "Location",
    "Agency",
    "Email",
    "Phone",
    "Cultural Background",
    "Height (cm)",
    "Weight (kg)",
    ...LINK_KEYS.map((k) => k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())),
    "Tags",
  ];

  if (includeClientFeedback) {
    headers.push("Client Status", "Client Rating", "Client Comment");
  }

  const rows = talents.map((t) => {
    const row = [
      escapeCSV(t.full_name),
      escapeCSV(t.age != null ? String(t.age) : ""),
      escapeCSV(t.location),
      escapeCSV(t.agency_name),
      escapeCSV(t.email),
      escapeCSV(t.phone),
      escapeCSV(t.cultural_background),
      escapeCSV(t.height_cm != null ? String(t.height_cm) : ""),
      escapeCSV(t.weight_kg != null ? String(t.weight_kg) : ""),
      ...LINK_KEYS.map((k) => escapeCSV(t.links?.[k] || "")),
      escapeCSV(t.tags?.join(", ")),
    ];

    if (includeClientFeedback) {
      row.push(
        escapeCSV(t.client_status),
        escapeCSV(t.client_rating != null ? String(t.client_rating) : ""),
        escapeCSV(t.client_comment)
      );
    }

    return row.join(",");
  });

  return [headers.join(","), ...rows].join("\n");
}
