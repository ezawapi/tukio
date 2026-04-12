import { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props { children: ReactNode; }
interface State { hasError: boolean; error: Error | null; }

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background p-6">
          <div className="mx-auto max-w-md space-y-6 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
            <h1 className="font-display text-2xl font-bold text-foreground">Oups, quelque chose s'est mal passé</h1>
            <p className="font-body text-sm text-muted-foreground">
              Une erreur inattendue est survenue. Veuillez rafraîchir la page ou revenir à l'accueil.
            </p>
            {this.state.error && (
              <pre className="mx-auto max-w-full overflow-auto rounded-lg bg-muted p-3 text-left text-xs text-muted-foreground">
                {this.state.error.message}
              </pre>
            )}
            <div className="flex justify-center gap-3">
              <Button onClick={() => window.location.reload()} variant="outline" className="gap-2">
                <RefreshCw className="h-4 w-4" /> Rafraîchir
              </Button>
              <Button onClick={this.handleReset} className="gap-2">
                Retour à l'accueil
              </Button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
