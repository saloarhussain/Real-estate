"use client";

import React, { useState, useMemo } from "react";
import { BarChart, Bar, ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { IndianRupee, Calendar, Percent, Clock, Wallet, LayoutGrid, ChevronDown, ChevronRight } from "lucide-react";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function fmtINR(n: number) {
  if (!isFinite(n)) return "—";
  const sign = n < 0 ? "-" : "";
  n = Math.abs(Math.round(n));
  return sign + "₹" + n.toLocaleString("en-IN");
}

function fmtDate(month: number, startMonthIdx: number, startYear: number) {
  const abs = startMonthIdx + month - 1;
  const y = startYear + Math.floor(abs / 12);
  const m = abs % 12;
  return `${MONTHS[m]} ${y}`;
}

interface SimulateParams {
  principal: number;
  annualRate: number;
  tenureYears: number;
  startMonthIdx: number;
  startYear: number;
  prepay: boolean;
  prepayAmount: number;
  prepayMonthsOfYear: number[];
  mode: string;
  lumpsum: {
    enabled: boolean;
    amount: number;
    monthIdx: number;
    year: number;
  };
}

interface SimulatedRow {
  month: number;
  calMonthIdx: number;
  emi: number;
  interest: number;
  principal: number;
  prepay: number;
  balance: number;
}

interface YearlyRow {
  label: string;
  emi: number;
  principal: number;
  interest: number;
  prepay: number;
  balance: number;
}

function simulate({ principal, annualRate, tenureYears, startMonthIdx, startYear, prepay, prepayAmount, prepayMonthsOfYear, mode, lumpsum }: SimulateParams) {
  const r = annualRate / 12 / 100;
  const totalMonths = tenureYears * 12;
  const emiInit = r === 0 ? principal / totalMonths : (principal * r * Math.pow(1 + r, totalMonths)) / (Math.pow(1 + r, totalMonths) - 1);

  let balance = principal;
  let emi = emiInit;
  const rows: SimulatedRow[] = [];
  const prepaySet = new Set(prepayMonthsOfYear);
  let month = 0;
  const maxIterations = totalMonths + 12 * 30;

  while (balance > 1 && month < maxIterations) {
    month += 1;
    const absoluteMonthIdx = startMonthIdx + month - 1;
    const calMonthIdx = absoluteMonthIdx % 12;
    const calYear = startYear + Math.floor(absoluteMonthIdx / 12);
    const interest = balance * r;
    let principalComponent = emi - interest;
    if (principalComponent > balance) principalComponent = balance;
    balance -= principalComponent;
    const emiPaid = interest + principalComponent;

    let prepayThisMonth = 0;

    if (prepay && balance > 0 && prepaySet.has(calMonthIdx) && month < totalMonths) {
      const applied = Math.min(prepayAmount, balance);
      prepayThisMonth += applied;
      balance -= applied;
    }

    if (lumpsum && lumpsum.enabled && balance > 0 && month < totalMonths && calMonthIdx === lumpsum.monthIdx && calYear === lumpsum.year) {
      const applied = Math.min(lumpsum.amount, balance);
      prepayThisMonth += applied;
      balance -= applied;
    }

    if (prepayThisMonth > 0) {
      const remainingOriginalMonths = totalMonths - month;
      if (mode === "reduceEmi" && balance > 0 && remainingOriginalMonths > 0) {
        emi = r === 0
          ? balance / remainingOriginalMonths
          : (balance * r * Math.pow(1 + r, remainingOriginalMonths)) / (Math.pow(1 + r, remainingOriginalMonths) - 1);
      }
    }

    rows.push({ month, calMonthIdx, emi: emiPaid, interest, principal: principalComponent, prepay: prepayThisMonth, balance: Math.max(balance, 0) });
    if (balance <= 1) break;
  }

  const totalInterest = rows.reduce((s, x) => s + x.interest, 0);
  return { emiInit, rows, totalMonths: rows.length, totalInterest };
}

function aggregateYearly(rows: SimulatedRow[], startMonthIdx: number, startYear: number): YearlyRow[] {
  const byYear = new Map<string, YearlyRow>();
  rows.forEach((row) => {
    const absoluteMonthIdx = startMonthIdx + row.month - 1;
    const label = `${startYear + Math.floor(absoluteMonthIdx / 12)}`;
    if (!byYear.has(label)) {
      byYear.set(label, { label, emi: 0, principal: 0, interest: 0, prepay: 0, balance: 0 });
    }
    const entry = byYear.get(label)!;
    entry.emi += row.emi;
    entry.principal += row.principal;
    entry.interest += row.interest;
    entry.prepay += row.prepay;
    entry.balance = row.balance;
  });
  return Array.from(byYear.values());
}

export default function AmortizationCalculator() {
  const [principal, setPrincipal] = useState<number>(4800000);
  const [rate, setRate] = useState<number>(7.65);
  const [tenure, setTenure] = useState<number>(30);
  const [startMonthIdx, setStartMonthIdx] = useState<number>(8); // September
  const [startYear, setStartYear] = useState<number>(2026);

  const [prepay, setPrepay] = useState<boolean>(true);
  const [prepayFrequency, setPrepayFrequency] = useState<string>("once"); // "once" | "twice"
  const [prepayAmount, setPrepayAmount] = useState<number>(400000);
  const [month1, setMonth1] = useState<number>(9); // October
  const [month2, setMonth2] = useState<number>(2); // March
  const [mode, setMode] = useState<string>("reduceEmi");
  const [granularity, setGranularity] = useState<string>("yearly"); // "monthly" | "yearly"

  const [lumpsumEnabled, setLumpsumEnabled] = useState<boolean>(false);
  const [lumpsumAmount, setLumpsumAmount] = useState<number>(2500000);
  const [lumpsumMonthIdx, setLumpsumMonthIdx] = useState<number>(startMonthIdx);
  const [lumpsumYear, setLumpsumYear] = useState<number>(startYear + 1);

  const months = prepayFrequency === "once" ? [month1] : (month1 === month2 ? [month1] : [month1, month2]);
  const lumpsum = { enabled: lumpsumEnabled, amount: lumpsumAmount, monthIdx: lumpsumMonthIdx, year: lumpsumYear };

  const result = useMemo(
    () => simulate({ principal, annualRate: rate, tenureYears: tenure, startMonthIdx, startYear, prepay, prepayAmount, prepayMonthsOfYear: months, mode, lumpsum }),
    [principal, rate, tenure, startMonthIdx, startYear, prepay, prepayAmount, prepayFrequency, month1, month2, mode, lumpsumEnabled, lumpsumAmount, lumpsumMonthIdx, lumpsumYear]
  );

  const yearlyRows = useMemo(() => aggregateYearly(result.rows, startMonthIdx, startYear), [result.rows, startMonthIdx, startYear]);
  const monthlyRows = useMemo(() => result.rows.map((r) => ({ ...r, label: fmtDate(r.month, startMonthIdx, startYear) })), [result.rows, startMonthIdx, startYear]);

  const monthsByYear = useMemo(() => {
    const map = new Map<string, (SimulatedRow & { label: string })[]>();
    monthlyRows.forEach((row) => {
      const absoluteMonthIdx = startMonthIdx + row.month - 1;
      const yearLabel = `${startYear + Math.floor(absoluteMonthIdx / 12)}`;
      if (!map.has(yearLabel)) map.set(yearLabel, []);
      map.get(yearLabel)!.push(row);
    });
    return map;
  }, [monthlyRows, startMonthIdx, startYear]);

  const [expandedYears, setExpandedYears] = useState<Set<string>>(new Set());
  const toggleYear = (label: string) => {
    setExpandedYears((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  };

  const chartData = granularity === "yearly" ? yearlyRows : monthlyRows;
  const chartDataSampled = useMemo(() => {
    if (granularity === "yearly") return chartData;
    // sample monthly data so the chart stays readable over long tenures
    const step = Math.max(Math.floor(chartData.length / 60), 1);
    return chartData.filter((_, i) => i % step === 0 || i === chartData.length - 1);
  }, [chartData, granularity]);

  const inputCls = "w-full rounded-lg px-3 py-2.5 text-[15px] outline-none transition-colors";

  return (
    <div style={{ "--ink": "#0E1620", "--panel": "#161F2B", "--panel2": "#1C2836", "--line": "#2A3746", "--gold": "#D8AE55", "--gold-dim": "#8A6F35", "--teal": "#4FA88F", "--coral": "#E2725B", "--text": "#EDEFF2", "--text-dim": "#93A0AF" } as React.CSSProperties} className="w-full min-h-full">
      <style>{`
        .amz-root { background: var(--ink); color: var(--text); }
        .amz-display { font-family: 'Space Grotesk', 'Inter', system-ui, sans-serif; }
        .amz-mono { font-family: 'IBM Plex Mono', 'Menlo', monospace; font-variant-numeric: tabular-nums; }
        .amz-panel { background: var(--panel); border: 1px solid var(--line); border-radius: 16px; }
        .amz-input { background: var(--panel2); border: 1px solid var(--line); color: var(--text); }
        .amz-input:focus { border-color: var(--gold-dim); }
        .amz-label { color: var(--text-dim); font-size: 12px; letter-spacing: 0.02em; text-transform: uppercase; }
        .amz-toggle-on { background: var(--gold); color: #171009; }
        .amz-toggle-off { background: var(--panel2); color: var(--text-dim); border: 1px solid var(--line); }
        .amz-seg { background: var(--panel2); border: 1px solid var(--line); color: var(--text-dim); }
        .amz-seg-active { background: rgba(216,174,85,0.14); border: 1px solid var(--gold-dim); color: var(--gold); }
        .amz-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
        .amz-scrollbar::-webkit-scrollbar-thumb { background: var(--line); border-radius: 8px; }
        .amz-sticky { position: sticky; top: 0; background: var(--panel); z-index: 1; }
        input[type=range] { accent-color: var(--gold); }
        select { color-scheme: dark; }
      `}</style>

      <div className="amz-root p-5 sm:p-8 rounded-2xl">
        <div className="mb-8">
          <div className="amz-label mb-2 flex items-center gap-1.5" style={{ color: "var(--gold)" }}><LayoutGrid size={13} /> Amortization breakdown</div>
          <h1 className="amz-display text-3xl sm:text-4xl font-semibold tracking-tight">Principal vs. Interest, Month by Month</h1>
          <p className="mt-2 text-sm sm:text-base" style={{ color: "var(--text-dim)" }}>
            See exactly how much of each EMI goes toward principal vs. interest — switch between monthly and yearly view.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6">
          {/* Inputs */}
          <div className="amz-panel p-5 sm:p-6 space-y-6 h-fit text-left">
            <div>
              <div className="amz-label mb-2 flex items-center gap-1.5"><IndianRupee size={13} /> Loan amount</div>
              <input type="number" className={`${inputCls} amz-input amz-mono`} value={principal} min={100000} step={10000}
                onChange={(e) => setPrincipal(Math.max(0, Number(e.target.value)))} />
              <input type="range" className="w-full mt-2" min={100000} max={20000000} step={50000} value={principal} onChange={(e) => setPrincipal(Number(e.target.value))} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="amz-label mb-2 flex items-center gap-1.5"><Percent size={13} /> Interest rate</div>
                <input type="number" className={`${inputCls} amz-input amz-mono`} value={rate} min={1} max={20} step={0.05}
                  onChange={(e) => setRate(Math.max(0.1, Number(e.target.value)))} />
              </div>
              <div>
                <div className="amz-label mb-2 flex items-center gap-1.5"><Clock size={13} /> Tenure (yrs)</div>
                <input type="number" className={`${inputCls} amz-input amz-mono`} value={tenure} min={1} max={35} step={1}
                  onChange={(e) => setTenure(Math.max(1, Math.min(35, Number(e.target.value))))} />
              </div>
            </div>

            <div>
              <div className="amz-label mb-2 flex items-center gap-1.5"><Calendar size={13} /> Loan start</div>
              <div className="grid grid-cols-2 gap-3">
                <select className={`${inputCls} amz-input`} value={startMonthIdx} onChange={(e) => setStartMonthIdx(Number(e.target.value))}>
                  {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
                </select>
                <input type="number" className={`${inputCls} amz-input amz-mono`} value={startYear} onChange={(e) => setStartYear(Number(e.target.value))} />
              </div>
            </div>

            <div className="h-px" style={{ background: "var(--line)" }} />

            <div className="flex items-center justify-between">
              <div className="amz-label flex items-center gap-1.5" style={{ color: "var(--text)" }}><Wallet size={14} /> Prepayment</div>
              <button onClick={() => setPrepay(!prepay)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer border-none ${prepay ? "amz-toggle-on" : "amz-toggle-off"}`}>
                {prepay ? "ON" : "OFF"}
              </button>
            </div>

            {prepay && (
              <div className="space-y-4">
                <div>
                  <div className="amz-label mb-2">Amount, each time</div>
                  <input type="number" className={`${inputCls} amz-input amz-mono`} value={prepayAmount} min={0} step={5000}
                    onChange={(e) => setPrepayAmount(Math.max(0, Number(e.target.value)))} />
                </div>
                <div>
                  <div className="amz-label mb-2">How often?</div>
                  <div className="flex gap-2 mb-3">
                    <button type="button" onClick={() => setPrepayFrequency("once")} className={`flex-1 px-3 py-2 rounded-lg text-sm cursor-pointer ${prepayFrequency === "once" ? "amz-seg-active" : "amz-seg"}`}>Once a year</button>
                    <button type="button" onClick={() => setPrepayFrequency("twice")} className={`flex-1 px-3 py-2 rounded-lg text-sm cursor-pointer ${prepayFrequency === "twice" ? "amz-seg-active" : "amz-seg"}`}>Twice a year</button>
                  </div>
                  {prepayFrequency === "once" ? (
                    <>
                      <div className="amz-label mb-2">Which month?</div>
                      <select className={`${inputCls} amz-input`} value={month1} onChange={(e) => setMonth1(Number(e.target.value))}>
                        {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
                      </select>
                    </>
                  ) : (
                    <>
                      <div className="amz-label mb-2">Which two months?</div>
                      <div className="grid grid-cols-2 gap-3">
                        <select className={`${inputCls} amz-input`} value={month1} onChange={(e) => setMonth1(Number(e.target.value))}>
                          {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
                        </select>
                        <select className={`${inputCls} amz-input`} value={month2} onChange={(e) => setMonth2(Number(e.target.value))}>
                          {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
                        </select>
                      </div>
                    </>
                  )}
                </div>
                <div>
                  <div className="amz-label mb-2">Reduce</div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setMode("reduceTenure")} className={`flex-1 px-3 py-2 rounded-lg text-sm cursor-pointer ${mode === "reduceTenure" ? "amz-seg-active" : "amz-seg"}`}>Tenure</button>
                    <button type="button" onClick={() => setMode("reduceEmi")} className={`flex-1 px-3 py-2 rounded-lg text-sm cursor-pointer ${mode === "reduceEmi" ? "amz-seg-active" : "amz-seg"}`}>EMI</button>
                  </div>
                </div>
              </div>
            )}

            <div className="h-px" style={{ background: "var(--line)" }} />

            <div className="flex items-center justify-between">
              <div className="amz-label flex items-center gap-1.5" style={{ color: "var(--text)" }}><IndianRupee size={14} /> One-time lumpsum</div>
              <button onClick={() => setLumpsumEnabled(!lumpsumEnabled)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer border-none ${lumpsumEnabled ? "amz-toggle-on" : "amz-toggle-off"}`}>
                {lumpsumEnabled ? "ON" : "OFF"}
              </button>
            </div>
            {lumpsumEnabled && (
              <div className="space-y-4">
                <div>
                  <div className="amz-label mb-2">Amount</div>
                  <input type="number" className={`${inputCls} amz-input amz-mono`} value={lumpsumAmount} min={0} step={10000}
                    onChange={(e) => setLumpsumAmount(Math.max(0, Number(e.target.value)))} />
                </div>
                <div>
                  <div className="amz-label mb-2 flex items-center gap-1.5"><Calendar size={13} /> When you'll pay it</div>
                  <div className="grid grid-cols-2 gap-3">
                    <select className={`${inputCls} amz-input`} value={lumpsumMonthIdx} onChange={(e) => setLumpsumMonthIdx(Number(e.target.value))}>
                      {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
                    </select>
                    <input type="number" className={`${inputCls} amz-input amz-mono`} value={lumpsumYear} onChange={(e) => setLumpsumYear(Number(e.target.value))} />
                  </div>
                </div>
                <p className="text-xs" style={{ color: "var(--text-dim)" }}>
                  Applied once, on top of any recurring prepayment above — e.g. a bonus, gift, or sale proceeds landing at a specific time.
                </p>
              </div>
            )}

            <div className="h-px" style={{ background: "var(--line)" }} />

            <div>
              <div className="amz-label mb-2">Chart view</div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setGranularity("monthly")} className={`flex-1 px-3 py-2 rounded-lg text-sm cursor-pointer ${granularity === "monthly" ? "amz-seg-active" : "amz-seg"}`}>Monthly</button>
                <button type="button" onClick={() => setGranularity("yearly")} className={`flex-1 px-3 py-2 rounded-lg text-sm cursor-pointer ${granularity === "yearly" ? "amz-seg-active" : "amz-seg"}`}>Yearly</button>
              </div>
              <p className="text-xs mt-2" style={{ color: "var(--text-dim)" }}>The table below is always yearly — click a row to expand its months.</p>
            </div>
          </div>

          {/* Results */}
          <div className="space-y-6 text-left">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="amz-panel p-4">
                <div className="amz-label">Starting EMI</div>
                <div className="amz-mono text-lg mt-1 font-medium">{fmtINR(result.emiInit)}</div>
              </div>
              <div className="amz-panel p-4">
                <div className="amz-label">Total interest</div>
                <div className="amz-mono text-lg mt-1 font-medium" style={{ color: "var(--coral)" }}>{fmtINR(result.totalInterest)}</div>
              </div>
              <div className="amz-panel p-4">
                <div className="amz-label">Payoff in</div>
                <div className="amz-mono text-lg mt-1 font-medium" style={{ color: "var(--teal)" }}>{result.totalMonths} months</div>
              </div>
            </div>

            {/* Chart */}
            <div className="amz-panel p-4 sm:p-5">
              <div className="amz-label mb-3">EMI, principal, interest & prepayment — {granularity === "yearly" ? "by year" : "by month (sampled)"}</div>
              <div style={{ width: "100%", height: 300 }}>
                <ResponsiveContainer>
                  <ComposedChart data={chartDataSampled} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid stroke="var(--line)" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="label" tick={{ fill: "var(--text-dim)", fontSize: 10 }} axisLine={{ stroke: "var(--line)" }} tickLine={false}
                      interval={Math.max(Math.floor(chartDataSampled.length / 8), 1)} />
                    <YAxis tick={{ fill: "var(--text-dim)", fontSize: 11 }} axisLine={false} tickLine={false}
                      tickFormatter={(v) => granularity === "yearly" ? `₹${(v / 100000).toFixed(0)}L` : `₹${(v / 1000).toFixed(0)}k`} />
                    <Tooltip contentStyle={{ background: "var(--panel2)", border: "1px solid var(--line)", borderRadius: 10, fontSize: 12 }}
                      labelStyle={{ color: "var(--text)" }} formatter={(value: any) => [fmtINR(Number(value)), ""]} />
                    <Legend wrapperStyle={{ fontSize: 12, color: "var(--text-dim)" }} />
                    <Bar dataKey="principal" stackId="a" fill="var(--teal)" name="Principal" />
                    <Bar dataKey="interest" stackId="a" fill="var(--coral)" name="Interest" />
                    {(prepay || lumpsumEnabled) && <Bar dataKey="prepay" stackId="a" fill="var(--gold)" name="Prepayment" radius={[3, 3, 0, 0]} />}
                    <Line type="monotone" dataKey="emi" stroke="#EDEFF2" strokeWidth={2} dot={false} name="EMI" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              <p className="text-xs mt-3" style={{ color: "var(--text-dim)" }}>
                The white line is your EMI amount that period. Stacked bars show how that same EMI splits into principal vs. interest, with any prepayment stacked on top in gold.
              </p>
            </div>

            {/* Table */}
            <div className="amz-panel p-4 sm:p-5">
              <div className="amz-label mb-3">Year-by-year breakdown — click a row to expand its months</div>
              <div className="overflow-auto amz-scrollbar" style={{ maxHeight: 460 }}>
                <table className="w-full text-sm amz-mono">
                  <thead>
                    <tr style={{ color: "var(--text-dim)" }} className="text-left">
                      <th className="amz-sticky pb-2 pr-3 font-normal">Year</th>
                      <th className="amz-sticky pb-2 pr-3 font-normal">EMI</th>
                      <th className="amz-sticky pb-2 pr-3 font-normal" style={{ color: "var(--teal)" }}>Principal</th>
                      <th className="amz-sticky pb-2 pr-3 font-normal" style={{ color: "var(--coral)" }}>Interest</th>
                      {prepay && <th className="amz-sticky pb-2 pr-3 font-normal" style={{ color: "var(--gold)" }}>Prepaid</th>}
                      <th className="amz-sticky pb-2 font-normal">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {yearlyRows.map((row, i) => {
                      const isOpen = expandedYears.has(row.label);
                      const monthRows = monthsByYear.get(row.label) || [];
                      return (
                        <React.Fragment key={row.label}>
                          <tr
                            style={{ borderTop: "1px solid var(--line)", cursor: "pointer" }}
                            onClick={() => toggleYear(row.label)}
                          >
                            <td className="py-2 pr-3">
                              <span className="inline-flex items-center gap-1.5">
                                {isOpen ? <ChevronDown size={14} color="var(--text-dim)" /> : <ChevronRight size={14} color="var(--text-dim)" />}
                                {row.label}
                              </span>
                            </td>
                            <td className="py-2 pr-3">{fmtINR(row.emi)}</td>
                            <td className="py-2 pr-3" style={{ color: "var(--teal)" }}>{fmtINR(row.principal)}</td>
                            <td className="py-2 pr-3" style={{ color: "var(--coral)" }}>{fmtINR(row.interest)}</td>
                            {prepay && <td className="py-2 pr-3" style={{ color: row.prepay > 0 ? "var(--gold)" : "var(--text-dim)" }}>{row.prepay > 0 ? fmtINR(row.prepay) : "—"}</td>}
                            <td className="py-2" style={{ color: "var(--text-dim)" }}>{fmtINR(row.balance)}</td>
                          </tr>
                          {isOpen && monthRows.map((mRow, j) => (
                            <tr key={`${row.label}-${j}`} style={{ background: "var(--panel2)" }}>
                              <td className="py-1.5 pr-3 pl-6" style={{ color: "var(--text-dim)", fontSize: "13px" }}>{mRow.label}</td>
                              <td className="py-1.5 pr-3" style={{ fontSize: "13px" }}>{fmtINR(mRow.emi)}</td>
                              <td className="py-1.5 pr-3" style={{ color: "var(--teal)", fontSize: "13px" }}>{fmtINR(mRow.principal)}</td>
                              <td className="py-1.5 pr-3" style={{ color: "var(--coral)", fontSize: "13px" }}>{fmtINR(mRow.interest)}</td>
                              {prepay && <td className="py-1.5 pr-3" style={{ color: mRow.prepay > 0 ? "var(--gold)" : "var(--text-dim)", fontSize: "13px" }}>{mRow.prepay > 0 ? fmtINR(mRow.prepay) : "—"}</td>}
                              <td className="py-1.5" style={{ color: "var(--text-dim)", fontSize: "13px" }}>{fmtINR(mRow.balance)}</td>
                            </tr>
                          ))}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
