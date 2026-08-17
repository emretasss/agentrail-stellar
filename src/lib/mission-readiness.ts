export type MissionReadiness = {
  score: number;
  checks: Array<{ label: string; passed: boolean }>;
};

export function assessMissionReadiness(goal: string): MissionReadiness {
  const text = goal.trim().toLowerCase();
  const checks = [
    { label: "Specific goal", passed: text.length >= 40 },
    { label: "Output defined", passed: /(return|deliver|produce|report|output|create)/.test(text) },
    { label: "Evidence requested", passed: /(evidence|source|proof|reference|reproduc)/.test(text) },
    { label: "Constraints included", passed: /(must|without|within|limit|constraint|do not|only)/.test(text) },
  ];
  return { score: checks.filter(({ passed }) => passed).length * 25, checks };
}
