import { AlertTriangle, CheckCircle2, Wallet } from "lucide-react";
import { walletMatchesConfiguredNetwork, type WalletState } from "@/lib/stellar";

export function NetworkGuard({ wallet }: { wallet: WalletState | null }) {
  if (!wallet) return <div className="flex items-center gap-2 border-b border-white/[.045] bg-[#746cff]/[.035] px-4 py-2 text-[9px] text-slate-600 sm:px-6"><Wallet size={11} className="text-[#aaa5ff]" />Connect a Stellar Testnet wallet to sign escrow operations.</div>;
  const valid = walletMatchesConfiguredNetwork(wallet);
  return <div className={`flex items-center gap-2 border-b px-4 py-2 text-[9px] sm:px-6 ${valid ? "border-[#61f6c2]/[.06] bg-[#61f6c2]/[.025] text-slate-600" : "border-amber-300/10 bg-amber-300/[.045] text-amber-200"}`}>{valid ? <CheckCircle2 size={11} className="text-[#61f6c2]" /> : <AlertTriangle size={11} />}{valid ? `Wallet verified on ${wallet.network}` : `Wrong wallet network: ${wallet.network}. Switch to Stellar Testnet before signing.`}</div>;
}
