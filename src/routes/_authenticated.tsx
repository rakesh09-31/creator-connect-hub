import { useEffect } from "react";
import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { AlertCircle, RefreshCw } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { LoadingScreen } from "@/components/LoadingScreen";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated")({
  component: AuthGate,
});

function AuthGate() {
  const navigate = useNavigate();
  const { loading, session, profile, error, retry } = useAuth();

  useEffect(() => {
    if (!loading && !session) {
      navigate({ to: "/login", replace: true });
    }
  }, [loading, session, navigate]);

  // If session or profile is still resolving, show clean loading screen
  if (loading || (session && !profile && !error)) {
    return <LoadingScreen message="Loading account..." />;
  }

  // If there is an authentication or database fetch error and no cached profile
  if (error && !profile) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-surface/80 border border-border rounded-2xl p-6 shadow-xl flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mb-4">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold mb-2">Connection Issue</h2>
          <p className="text-sm text-muted-foreground mb-6">
            We couldn't load your account details. This may be due to a temporary network issue.
          </p>
          <div className="flex gap-3 w-full">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => navigate({ to: "/login", replace: true })}
            >
              Back to Login
            </Button>
            <Button
              className="flex-1 bg-gradient-brand text-white shadow-brand hover:opacity-90"
              onClick={() => retry()}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return <LoadingScreen message="Redirecting to login..." />;
  }

  return <Outlet />;
}

