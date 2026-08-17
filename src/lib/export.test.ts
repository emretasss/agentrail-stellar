import { describe, expect, it } from "vitest";
import { activityToCsv } from "@/lib/export";

describe("activityToCsv", () => {
  it("escapes commas and quotes without losing transaction evidence", () => {
    const csv = activityToCsv([{ id: "1", at: "2026-08-17T10:00:00.000Z", label: "Payment, released", detail: 'Agent said "done"', tone: "success", hash: "abc123" }]);
    expect(csv).toContain('"Payment, released"');
    expect(csv).toContain('"Agent said ""done"""');
    expect(csv).toContain('"abc123"');
  });
});
