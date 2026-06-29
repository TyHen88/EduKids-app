import type { Metadata } from "next";

import { ToanchetTester } from "./toanchet-tester";

export const metadata: Metadata = {
  title: "Toanchet Pay — Sandbox Test",
  robots: { index: false, follow: false },
};

type PageProps = { params: Promise<{ lang: string }> };

export default async function PaymentTestPage({ params }: PageProps) {
  await params; // satisfy the [lang] segment; copy here is English-only (dev tool)

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:py-12">
      <header className="mb-6">
        <p className="text-xs font-bold uppercase tracking-wide text-indigo-500">
          ACLEDA · UAT Sandbox
        </p>
        <h1 className="text-2xl font-black text-slate-800 sm:text-3xl">
          Toanchet Pay — KHQR String test
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Calls the live <code className="rounded bg-slate-100 px-1">openSessionV2</code>{" "}
          endpoint (operationType 5) and renders the returned KHQR. The{" "}
          <strong>sample</strong> replay is known-good and will show a real QR.
          <br />
          This page is sandbox-only — no real money moves.
        </p>
      </header>

      <ToanchetTester />
    </main>
  );
}
