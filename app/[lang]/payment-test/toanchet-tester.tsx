"use client";

import { useState, useTransition } from "react";

import { khqrStringTest, type KhqrTestInput, type KhqrTestResult } from "@/actions/toanchet";

const inputCls =
  "w-full rounded-xl border-2 border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-400";
const labelCls = "block text-xs font-bold text-slate-600 mb-1";

export const ToanchetTester = () => {
  const [mode, setMode] = useState<KhqrTestInput["mode"]>("sample");
  const [amount, setAmount] = useState("100");
  const [currency, setCurrency] = useState("KHR");
  const [desc, setDesc] = useState("EduKids Pro");
  const [expiry, setExpiry] = useState("5");
  const [result, setResult] = useState<KhqrTestResult | null>(null);
  const [pending, startTransition] = useTransition();

  const run = () => {
    startTransition(async () => {
      const res = await khqrStringTest({
        mode,
        amount,
        currency,
        desc,
        expiryMinutes: expiry,
      });
      setResult(res);
    });
  };

  const isGenerate = mode === "generate";

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="rounded-2xl border-2 border-slate-100 bg-white p-5 shadow-sm">
        <div className="mb-4 flex gap-2">
          <button
            type="button"
            onClick={() => setMode("sample")}
            className={`flex-1 rounded-xl px-3 py-2 text-sm font-bold transition-colors ${
              mode === "sample"
                ? "bg-indigo-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Sample (known-good)
          </button>
          <button
            type="button"
            onClick={() => setMode("generate")}
            className={`flex-1 rounded-xl px-3 py-2 text-sm font-bold transition-colors ${
              isGenerate
                ? "bg-indigo-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Generate (needs secret)
          </button>
        </div>

        <fieldset
          disabled={!isGenerate}
          className={`grid grid-cols-2 gap-3 sm:grid-cols-4 ${
            isGenerate ? "" : "opacity-50"
          }`}
        >
          <div className="col-span-1">
            <label className={labelCls}>Amount</label>
            <input className={inputCls} value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div className="col-span-1">
            <label className={labelCls}>Currency</label>
            <select
              className={inputCls}
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
            >
              <option value="KHR">KHR</option>
              <option value="USD">USD</option>
            </select>
          </div>
          <div className="col-span-2">
            <label className={labelCls}>Description</label>
            <input className={inputCls} value={desc} onChange={(e) => setDesc(e.target.value)} />
          </div>
          <div className="col-span-1">
            <label className={labelCls}>Expiry (min)</label>
            <input className={inputCls} value={expiry} onChange={(e) => setExpiry(e.target.value)} />
          </div>
        </fieldset>

        {isGenerate && (
          <p className="mt-3 text-xs text-amber-600">
            ⚠️ Generate uses a placeholder hash formula + <code>TOANCHET_SECRET</code>. Until
            ACLEDA confirms the exact hash recipe, expect the bank to reject it.
          </p>
        )}

        <button
          type="button"
          onClick={run}
          disabled={pending}
          className="mt-4 w-full rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
        >
          {pending ? "Calling sandbox…" : "Run openSessionV2"}
        </button>
      </div>

      {/* Result */}
      {result && (
        <div className="rounded-2xl border-2 border-slate-100 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
                result.ok ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
              }`}
            >
              {result.ok ? "SUCCESS" : "FAILED"}
            </span>
            <span className="text-xs text-slate-500">
              HTTP {result.httpStatus}
              {result.code !== undefined && ` · code ${result.code}`}
              {result.message && ` · ${result.message}`}
            </span>
          </div>

          {result.note && (
            <p className="mb-4 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
              {result.note}
            </p>
          )}

          {result.qrBase64 && (
            <div className="mb-4 flex flex-col items-center">
              {/* eslint-disable-next-line @next/next/no-img-element -- base64 data URI from the bank */}
              <img
                src={`data:image/png;base64,${result.qrBase64}`}
                alt="KHQR"
                className="h-56 w-56 rounded-xl border-2 border-slate-200"
              />
              <p className="mt-2 text-xs font-bold text-slate-500">Scan with any KHQR / Bakong app</p>
            </div>
          )}

          {(result.sessionid || result.paymentTokenid) && (
            <dl className="mb-4 grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
              {result.sessionid && (
                <div className="rounded-lg bg-slate-50 p-2">
                  <dt className="font-bold text-slate-500">sessionid</dt>
                  <dd className="break-all font-mono text-slate-700">{result.sessionid}</dd>
                </div>
              )}
              {result.paymentTokenid && (
                <div className="rounded-lg bg-slate-50 p-2">
                  <dt className="font-bold text-slate-500">paymentTokenid</dt>
                  <dd className="break-all font-mono text-slate-700">{result.paymentTokenid}</dd>
                </div>
              )}
            </dl>
          )}

          {result.qrValue && (
            <Details label="KHQR string (qrValue)" value={result.qrValue} />
          )}
          <Details label="Request body sent" value={JSON.stringify(result.sentBody, null, 2)} />
          {result.raw && <Details label="Raw response" value={result.raw} />}
        </div>
      )}
    </div>
  );
};

const Details = ({ label, value }: { label: string; value: string }) => (
  <details className="mt-2 rounded-lg border border-slate-100">
    <summary className="cursor-pointer px-3 py-2 text-xs font-bold text-slate-600">
      {label}
    </summary>
    <pre className="overflow-x-auto whitespace-pre-wrap break-all px-3 pb-3 text-[11px] leading-relaxed text-slate-600">
      {value}
    </pre>
  </details>
);
