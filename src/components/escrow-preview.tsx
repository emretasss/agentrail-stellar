import { Clock3, FileKey2, LockKeyhole } from "lucide-react";

export function EscrowPreview({ amount, ledgers, brief }: { amount: string; ledgers: string; brief: string }) {
  const ledgerCount = Number(ledgers);
  const hours = Number.isFinite(ledgerCount) ? Math.max(0, Math.round((ledgerCount * 5) / 360) / 10) : 0;
  const ready = Number(amount) > 0 && brief.trim().length >= 20 && ledgerCount >= 100;
  const items = [
    { icon: LockKeyhole, label: "Escrow lock", value: Number(amount) > 0 ? `${amount} XLM` : "Add value" },
    { icon: FileKey2, label: "Scope proof", value: brief.trim().length >= 20 ? "SHA-256 ready" : "Add detail" },
    { icon: Clock3, label: "Estimated window", value: ledgerCount >= 100 ? `≈ ${hours} hours` : "Set deadline" },
  ];
  return <div className={`rounded-xl border p-3 ${ready ? "border-[#61f6c2]/10 bg-[#61f6c2]/[.025]" : "border-white/[.06] bg-white/[.02]"}`}><div className="mb-3 flex items-center justify-between"><span className="text-[9px] font-bold uppercase tracking-[.14em] text-slate-600">Signing preview</span><span className={`text-[9px] ${ready ? "text-[#61f6c2]" : "text-amber-300"}`}>{ready ? "Ready for review" : "Incomplete"}</span></div><div className="grid grid-cols-3 gap-2">{items.map(({ icon: Icon, label, value }) => <div key={label} className="rounded-lg bg-black/20 p-2.5"><Icon size={12} className="text-[#8f88ff]" /><span className="mt-2 block text-[8px] uppercase tracking-wider text-slate-700">{label}</span><strong className="mt-1 block text-[9px] font-medium text-slate-400">{value}</strong></div>)}</div></div>;
}
