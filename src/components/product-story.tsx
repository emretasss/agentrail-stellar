import {
  ArrowRight,
  BadgeCheck,
  Bot,
  Braces,
  Fingerprint,
  Globe2,
  LockKeyhole,
  RadioTower,
  Scale,
  Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const flow = [
  {
    icon: Sparkles,
    title: "Scope",
    copy: "AI turns an idea into measurable deliverables and acceptance criteria.",
    tone: "violet",
  },
  {
    icon: LockKeyhole,
    title: "Protect",
    copy: "The buyer locks XLM in a non-custodial Soroban escrow.",
    tone: "emerald",
  },
  {
    icon: Fingerprint,
    title: "Prove",
    copy: "Brief and delivery hashes form a privacy-preserving audit trail.",
    tone: "cyan",
  },
  {
    icon: BadgeCheck,
    title: "Settle",
    copy: "Approval releases funds and adds portable reputation to the agent.",
    tone: "amber",
  },
];

export function ProductStory() {
  return (
    <section className="mt-4 grid gap-4 xl:grid-cols-[1.35fr_.65fr]">
      <Card className="overflow-hidden">
        <CardHeader className="border-b border-white/[.055]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <Badge variant="secondary" className="mb-3">How AgentRail works</Badge>
              <CardTitle className="text-lg text-white">One verifiable path from intent to settlement.</CardTitle>
            </div>
            <RadioTower className="hidden text-emerald-400/50 sm:block" size={22} />
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-4">
          {flow.map(({ icon: Icon, title, copy, tone }, index) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06 }}
              className="relative rounded-xl border border-white/[.055] bg-white/[.018] p-4"
            >
              <span
                className={
                  {
                    violet: "bg-violet-400/10 text-violet-300",
                    emerald: "bg-emerald-400/10 text-emerald-300",
                    cyan: "bg-cyan-400/10 text-cyan-300",
                    amber: "bg-amber-400/10 text-amber-300",
                  }[tone]
                }
              >
                <span className="grid size-9 place-items-center rounded-lg bg-inherit text-inherit">
                  <Icon size={16} />
                </span>
              </span>
              <span className="mt-4 block text-[9px] font-semibold uppercase tracking-[.15em] text-slate-700">
                0{index + 1}
              </span>
              <strong className="mt-1 block text-sm text-slate-200">{title}</strong>
              <p className="mt-2 text-[10px] leading-5 text-slate-600">{copy}</p>
              {index < flow.length - 1 && (
                <ArrowRight className="absolute -right-2.5 top-1/2 z-10 hidden text-slate-800 xl:block" size={14} />
              )}
            </motion.div>
          ))}
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader>
          <Badge variant="secondary" className="mb-2 w-fit">
            <Globe2 size={11} />
            Product wedge
          </Badge>
          <CardTitle className="text-lg leading-7 text-white">
            Trust infrastructure for paid AI work.
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          {[
            [Bot, "For buyers", "Clear scope, protected payment, verifiable delivery."],
            [Braces, "For agent builders", "Discovery, portable reputation, global settlement."],
            [Scale, "For teams", "Public evidence without exposing private work content."],
          ].map(([Icon, title, copy]) => (
            <div key={String(title)} className="flex gap-3 rounded-xl border border-white/[.05] bg-white/[.018] p-3">
              <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-white/[.035] text-slate-400">
                <Icon size={15} />
              </span>
              <div>
                <strong className="block text-xs text-slate-300">{String(title)}</strong>
                <p className="mt-1 text-[10px] leading-4 text-slate-600">{String(copy)}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </section>
  );
}
