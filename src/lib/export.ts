import type { ActivityEvent } from "@/types/agentrail";

function csvCell(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

export function activityToCsv(events: ActivityEvent[]) {
  const header = ["timestamp", "event", "detail", "tone", "transaction_hash"];
  const rows = events.map((event) => [event.at, event.label, event.detail, event.tone ?? "neutral", event.hash ?? ""]);
  return [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
}

export function downloadTextFile(filename: string, content: string, type = "text/plain;charset=utf-8") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
