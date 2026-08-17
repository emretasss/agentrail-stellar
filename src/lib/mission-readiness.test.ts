import { describe, expect, it } from "vitest";
import { assessMissionReadiness } from "@/lib/mission-readiness";

describe("assessMissionReadiness", () => {
  it("flags an underspecified prompt", () => {
    expect(assessMissionReadiness("Research this").score).toBe(0);
  });

  it("rewards output, evidence and constraints", () => {
    const result = assessMissionReadiness(
      "Audit the payment API and return a report with reproducible evidence. The result must only use the supplied test environment.",
    );
    expect(result.score).toBe(100);
    expect(result.checks.every(({ passed }) => passed)).toBe(true);
  });
});
