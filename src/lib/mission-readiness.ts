export type MissionReadiness = {
  score: number;
  checks: Array<{ label: string; passed: boolean }>;
  nextSuggestion?: string;
};

export function assessMissionReadiness(goal: string): MissionReadiness {
  const text = goal.trim().toLowerCase();
  const checks = [
    { label: "Specific goal", passed: text.length >= 40 },
    { label: "Output defined", passed: /(return|deliver|produce|report|output|create)/.test(text) },
    { label: "Evidence requested", passed: /(evidence|source|proof|reference|reproduc)/.test(text) },
    { label: "Constraints included", passed: /(must|without|within|limit|constraint|do not|only)/.test(text) },
  ];
  const suggestions = [
    "Describe the business outcome and intended user in more detail.",
    "Name the exact artifact the agent must return.",
    "Ask for sources, proof links, or reproducible evidence.",
    "Add a limit, deadline, approved source list, or explicit exclusion.",
  ];
  const firstMissing = checks.findIndex(({ passed }) => !passed);
  return { score: checks.filter(({ passed }) => passed).length * 25, checks, nextSuggestion: firstMissing >= 0 ? suggestions[firstMissing] : undefined };
}
