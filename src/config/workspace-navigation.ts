import {
  Bot,
  BrainCircuit,
  BriefcaseBusiness,
  Blocks,
  LayoutDashboard,
  ShieldCheck,
  TrendingUp,
  Users,
  type LucideIcon,
} from "lucide-react";

export type AppView =
  | "overview"
  | "discover"
  | "jobs"
  | "copilot"
  | "growth"
  | "validation"
  | "network";

export type WorkspaceNavItem = {
  id: AppView;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
  description: string;
  group: "workspace" | "launch";
  badge?: "AI" | "NEW";
};

export const workspaceNavigation: WorkspaceNavItem[] = [
  {
    id: "overview",
    label: "Command center",
    shortLabel: "Home",
    icon: LayoutDashboard,
    description: "Live protocol health, settlement and reputation",
    group: "workspace",
  },
  {
    id: "discover",
    label: "Agent network",
    shortLabel: "Agents",
    icon: Bot,
    description: "Discover and hire verifiable AI services",
    group: "workspace",
  },
  {
    id: "jobs",
    label: "Escrow operations",
    shortLabel: "Jobs",
    icon: BriefcaseBusiness,
    description: "Manage funding, delivery and settlement",
    group: "workspace",
  },
  {
    id: "copilot",
    label: "Mission Copilot",
    shortLabel: "Copilot",
    icon: BrainCircuit,
    description: "Design a measurable agent mission with AI",
    group: "workspace",
    badge: "AI",
  },
  {
    id: "network",
    label: "Network explorer",
    shortLabel: "Network",
    icon: Blocks,
    description: "Inspect contract state and Stellar settlement health",
    group: "launch",
  },
  {
    id: "growth",
    label: "Growth Lab",
    shortLabel: "Grow",
    icon: TrendingUp,
    description: "Complete and share a real Testnet mission",
    group: "launch",
    badge: "NEW",
  },
  {
    id: "validation",
    label: "Validation hub",
    shortLabel: "Proof",
    icon: Users,
    description: "Track feedback and real-user evidence",
    group: "launch",
  },
];

export const workspaceViews = workspaceNavigation.map(({ id }) => id);

export function getWorkspaceNavItem(view: AppView) {
  return workspaceNavigation.find(({ id }) => id === view)!;
}

export function getWorkspaceGroup(group: WorkspaceNavItem["group"]) {
  return workspaceNavigation.filter((item) => item.group === group);
}

export const workspaceMobileNavigation = workspaceNavigation;
