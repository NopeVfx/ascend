import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center px-4 py-12">
      <div className="w-full max-w-md border-2 border-border bg-surface p-6 md:p-8 brut-shadow">
        <Suspense fallback={<div className="text-sm text-muted">Loading…</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
