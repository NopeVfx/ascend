import { Suspense } from "react";
import { Premium } from "@/components/premium/Premium";

export const metadata = {
  title: "Premium — Ascend",
};

export default function PremiumPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 md:px-8 md:py-12">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-black uppercase-wide md:text-5xl">
          Go Premium
        </h1>
        <p className="mt-2 text-sm text-muted">
          Sharper reads. Longer roadmaps. Frontier-model analysis.
        </p>
      </header>
      <Suspense fallback={<div className="text-center text-sm text-muted">Loading…</div>}>
        <Premium />
      </Suspense>
    </div>
  );
}
