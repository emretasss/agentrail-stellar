import { AlertTriangle, RefreshCw } from "lucide-react";
import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { captureProductError } from "@/lib/monitoring";

type Props = { children: ReactNode };
type State = { hasError: boolean };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    captureProductError(error, { componentStack: info.componentStack ?? "" });
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main className="grid min-h-screen place-items-center bg-slate-950 p-6 text-slate-100">
        <section className="w-full max-w-md rounded-2xl border border-red-400/20 bg-red-400/[.04] p-7 text-center">
          <AlertTriangle className="mx-auto mb-4 text-red-300" size={32} />
          <h1 className="text-xl font-semibold">AgentRail needs a quick reset</h1>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            The error was captured without exposing wallet data. Reload to safely restore the app.
          </p>
          <Button className="mt-6" onClick={() => window.location.reload()}>
            <RefreshCw size={16} />
            Reload workspace
          </Button>
        </section>
      </main>
    );
  }
}
