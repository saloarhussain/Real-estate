"use client";

import React, { useState, useMemo } from "react";
import { BarChart, Bar, ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { IndianRupee, Calendar, Percent, Clock, Wallet, LayoutGrid, ChevronDown, ChevronRight, Plus, Trash2, Building } from "lucide-react";

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

interface LumpsumItem {
  id: string;
  amount: number;
  monthIdx: number;
  year: number;
  reduceMode: "reduceTenure" | "reduceEmi";
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
  lumpsumEnabled: boolean;
  lumpsums: LumpsumItem[];
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

function simulate({ principal, annualRate, tenureYears, startMonthIdx, startYear, prepay, prepayAmount, prepayMonthsOfYear, mode, lumpsumEnabled, lumpsums }: SimulateParams) {
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
    let shouldRecalculateEmi = false;

    if (prepay && balance > 0 && prepaySet.has(calMonthIdx) && month < totalMonths) {
      const applied = Math.min(prepayAmount, balance);
      prepayThisMonth += applied;
      balance -= applied;
      if (mode === "reduceEmi") {
        shouldRecalculateEmi = true;
      }
    }

    if (lumpsumEnabled && lumpsums && lumpsums.length > 0) {
      lumpsums.forEach((item) => {
        if (balance > 0 && month < totalMonths && calMonthIdx === item.monthIdx && calYear === item.year) {
          const applied = Math.min(item.amount, balance);
          prepayThisMonth += applied;
          balance -= applied;
          if (item.reduceMode === "reduceEmi") {
            shouldRecalculateEmi = true;
          }
        }
      });
    }

    if (prepayThisMonth > 0) {
      const remainingOriginalMonths = totalMonths - month;
      if (shouldRecalculateEmi && balance > 0 && remainingOriginalMonths > 0) {
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

  const [usePropertyCostCalc, setUsePropertyCostCalc] = useState<boolean>(false);
  const [propertyCost, setPropertyCost] = useState<number>(6000000);
  const [downPaymentPercent, setDownPaymentPercent] = useState<number>(20);
  const [stampDutyPercent, setStampDutyPercent] = useState<number>(5);
  const [registrationPercent, setRegistrationPercent] = useState<number>(1);

  const [prepay, setPrepay] = useState<boolean>(true);
  const [prepayFrequency, setPrepayFrequency] = useState<string>("once"); // "once" | "twice"
  const [prepayAmount, setPrepayAmount] = useState<number>(400000);
  const [month1, setMonth1] = useState<number>(9); // October
  const [month2, setMonth2] = useState<number>(2); // March
  const [mode, setMode] = useState<string>("reduceEmi");
  const [granularity, setGranularity] = useState<string>("yearly"); // "monthly" | "yearly"

  const [lumpsumEnabled, setLumpsumEnabled] = useState<boolean>(false);
  const [lumpsums, setLumpsums] = useState<LumpsumItem[]>([
    { id: "1", amount: 2500000, monthIdx: startMonthIdx, year: startYear + 1, reduceMode: "reduceTenure" }
  ]);

  const downPaymentAmount = (propertyCost * downPaymentPercent) / 100;
  const stampDutyAmount = (propertyCost * stampDutyPercent) / 100;
  const registrationAmount = (propertyCost * registrationPercent) / 100;
  const totalCashRequired = downPaymentAmount + stampDutyAmount + registrationAmount;

  const calculatedPrincipal = useMemo(() => {
    if (usePropertyCostCalc) {
      return Math.max(0, propertyCost - downPaymentAmount);
    }
    return principal;
  }, [usePropertyCostCalc, propertyCost, downPaymentAmount, principal]);

  const addLumpsum = () => {
    const nextYear = lumpsums.length > 0 ? lumpsums[lumpsums.length - 1].year + 1 : startYear + 1;
    setLumpsums([
      ...lumpsums,
      {
        id: Math.random().toString(36).substring(2, 9),
        amount: 500000,
        monthIdx: startMonthIdx,
        year: Math.min(startYear + tenure, nextYear),
        reduceMode: "reduceTenure"
      }
    ]);
  };

  const removeLumpsum = (id: string) => {
    setLumpsums(lumpsums.filter((x) => x.id !== id));
  };

  const updateLumpsum = (id: string, key: keyof LumpsumItem, value: any) => {
    setLumpsums(lumpsums.map((x) => x.id === id ? { ...x, [key]: value } : x));
  };

  const months = prepayFrequency === "once" ? [month1] : (month1 === month2 ? [month1] : [month1, month2]);

  const result = useMemo(
    () => simulate({ principal: calculatedPrincipal, annualRate: rate, tenureYears: tenure, startMonthIdx, startYear, prepay, prepayAmount, prepayMonthsOfYear: months, mode, lumpsumEnabled, lumpsums }),
    [calculatedPrincipal, rate, tenure, startMonthIdx, startYear, prepay, prepayAmount, prepayFrequency, month1, month2, mode, lumpsumEnabled, lumpsums]
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

  const showPrepayColumn = prepay || lumpsumEnabled;

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

      <div className="amz-root px-3 py-5 sm:p-8 rounded-2xl">
        <div className="mb-8">
          <div className="amz-label mb-2 flex items-center gap-1.5" style={{ color: "var(--gold)" }}><LayoutGrid size={13} /> Amortization breakdown</div>
          <h1 className="amz-display text-3xl sm:text-4xl font-semibold tracking-tight">Principal vs. Interest, Month by Month</h1>
          <p className="mt-2 text-sm sm:text-base" style={{ color: "var(--text-dim)" }}>
            See exactly how much of each EMI goes toward principal vs. interest — switch between monthly and yearly view.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6">
          {/* Inputs */}
          <div className="amz-panel px-4 py-5 sm:p-6 space-y-6 h-fit text-left">
            <div className="flex items-center justify-between">
              <div className="amz-label flex items-center gap-1.5" style={{ color: "var(--text)" }}><Building size={14} /> Calculate from Property Cost</div>
              <button type="button" onClick={() => setUsePropertyCostCalc(!usePropertyCostCalc)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer border-none ${usePropertyCostCalc ? "amz-toggle-on" : "amz-toggle-off"}`}>
                {usePropertyCostCalc ? "ON" : "OFF"}
              </button>
            </div>

            {usePropertyCostCalc ? (
              <div className="space-y-4 p-3.5 rounded-xl border text-left" style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.015)" }}>
                <div>
                  <div className="amz-label mb-2 flex items-center gap-1.5"><IndianRupee size={11} /> Property Cost</div>
                  <input type="number" className={`${inputCls} amz-input amz-mono`} value={propertyCost} min={100000} step={50000}
                    onChange={(e) => setPropertyCost(Math.max(0, Number(e.target.value)))} />
                  <input type="range" className="w-full mt-2" min={100000} max={50000000} step={100000} value={propertyCost} onChange={(e) => setPropertyCost(Number(e.target.value))} />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <div className="amz-label mb-1.5">Down Pay %</div>
                    <input type="number" className={`${inputCls} amz-input amz-mono`} value={downPaymentPercent} min={0} max={100} step={1}
                      onChange={(e) => setDownPaymentPercent(Math.max(0, Math.min(100, Number(e.target.value))))} />
                  </div>
                  <div>
                    <div className="amz-label mb-1.5">Stamp %</div>
                    <input type="number" className={`${inputCls} amz-input amz-mono`} value={stampDutyPercent} min={0} max={20} step={0.1}
                      onChange={(e) => setStampDutyPercent(Math.max(0, Math.min(20, Number(e.target.value))))} />
                  </div>
                  <div>
                    <div className="amz-label mb-1.5">Reg. Fee %</div>
                    <input type="number" className={`${inputCls} amz-input amz-mono`} value={registrationPercent} min={0} max={10} step={0.1}
                      onChange={(e) => setRegistrationPercent(Math.max(0, Math.min(10, Number(e.target.value))))} />
                  </div>
                </div>

                <div className="h-px" style={{ background: "var(--line)" }} />

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span style={{ color: "var(--text-dim)" }}>Down Payment (Cash):</span>
                    <span className="amz-mono font-medium">{fmtINR(downPaymentAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: "var(--text-dim)" }}>Stamp Duty (Cash):</span>
                    <span className="amz-mono font-medium">{fmtINR(stampDutyAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: "var(--text-dim)" }}>Registration (Cash):</span>
                    <span className="amz-mono font-medium">{fmtINR(registrationAmount)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-dashed" style={{ borderColor: "var(--line)" }}>
                    <span className="font-semibold text-[13px]" style={{ color: "var(--gold)" }}>Total Cash Needed:</span>
                    <span className="amz-mono font-bold text-[13px]" style={{ color: "var(--gold)" }}>{fmtINR(totalCashRequired)}</span>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span className="font-semibold text-[13px]" style={{ color: "var(--teal)" }}>Sanctioned Loan:</span>
                    <span className="amz-mono font-bold text-[13px]" style={{ color: "var(--teal)" }}>{fmtINR(calculatedPrincipal)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <div className="amz-label mb-2 flex items-center gap-1.5"><IndianRupee size={13} /> Loan amount</div>
                <input type="number" className={`${inputCls} amz-input amz-mono`} value={principal} min={100000} step={10000}
                  onChange={(e) => setPrincipal(Math.max(0, Number(e.target.value)))} />
                <input type="range" className="w-full mt-2" min={100000} max={20000000} step={50000} value={principal} onChange={(e) => setPrincipal(Number(e.target.value))} />
              </div>
            )}

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
              <div className="amz-label flex items-center gap-1.5" style={{ color: "var(--text)" }}><IndianRupee size={14} /> Lumpsum prepayments</div>
              <button onClick={() => setLumpsumEnabled(!lumpsumEnabled)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer border-none ${lumpsumEnabled ? "amz-toggle-on" : "amz-toggle-off"}`}>
                {lumpsumEnabled ? "ON" : "OFF"}
              </button>
            </div>
            {lumpsumEnabled && (
              <div className="space-y-4">
                {lumpsums.map((item, index) => (
                  <div key={item.id} className="p-3.5 rounded-xl border space-y-3 relative" style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.015)" }}>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold tracking-wider uppercase" style={{ color: "var(--gold)" }}>Lumpsum #{index + 1}</span>
                      <button
                        type="button"
                        onClick={() => removeLumpsum(item.id)}
                        className="p-1 rounded hover:bg-red-950/30 text-red-400 hover:text-red-300 transition-colors cursor-pointer border-none bg-transparent"
                        title="Remove lumpsum"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div>
                      <div className="amz-label mb-1.5">Amount</div>
                      <input type="number" className={`${inputCls} amz-input amz-mono`} value={item.amount} min={0} step={10000}
                        onChange={(e) => updateLumpsum(item.id, "amount", Math.max(0, Number(e.target.value)))} />
                    </div>
                    <div>
                      <div className="amz-label mb-1.5 flex items-center gap-1.5"><Calendar size={13} /> When you'll pay it</div>
                      <div className="grid grid-cols-2 gap-3">
                        <select className={`${inputCls} amz-input`} value={item.monthIdx} onChange={(e) => updateLumpsum(item.id, "monthIdx", Number(e.target.value))}>
                          {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
                        </select>
                        <input type="number" className={`${inputCls} amz-input amz-mono`} value={item.year} onChange={(e) => updateLumpsum(item.id, "year", Number(e.target.value))} />
                      </div>
                    </div>
                    <div>
                      <div className="amz-label mb-1.5">Reduce</div>
                      <div className="flex gap-2">
                        <button type="button" onClick={() => updateLumpsum(item.id, "reduceMode", "reduceTenure")} className={`flex-1 px-3 py-1.5 rounded-lg text-xs cursor-pointer ${item.reduceMode === "reduceTenure" ? "amz-seg-active" : "amz-seg"}`}>Tenure</button>
                        <button type="button" onClick={() => updateLumpsum(item.id, "reduceMode", "reduceEmi")} className={`flex-1 px-3 py-1.5 rounded-lg text-xs cursor-pointer ${item.reduceMode === "reduceEmi" ? "amz-seg-active" : "amz-seg"}`}>EMI</button>
                      </div>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addLumpsum}
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm transition-colors cursor-pointer border-none amz-seg hover:bg-[rgba(216,174,85,0.1)] hover:text-[var(--gold)]"
                >
                  <Plus size={14} /> Add lumpsum amount
                </button>
                <p className="text-xs" style={{ color: "var(--text-dim)" }}>
                  Applied on top of any recurring prepayment above — e.g. a bonus, gift, or sale proceeds landing at a specific time.
                </p>
              </div>
            )}

          </div>

          {/* Results */}
          <div className="space-y-6 text-left">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="amz-panel px-3 py-4 sm:p-4">
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

            {usePropertyCostCalc && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="amz-panel p-4">
                  <div className="amz-label">Property Cost</div>
                  <div className="amz-mono text-lg mt-1 font-medium">{fmtINR(propertyCost)}</div>
                </div>
                <div className="amz-panel p-4">
                  <div className="amz-label">Sanctioned Loan</div>
                  <div className="amz-mono text-lg mt-1 font-medium" style={{ color: "var(--teal)" }}>{fmtINR(calculatedPrincipal)}</div>
                </div>
                <div className="amz-panel p-4">
                  <div className="amz-label">Total Cash (Out of Pocket)</div>
                  <div className="amz-mono text-lg mt-1 font-medium" style={{ color: "var(--gold)" }}>{fmtINR(totalCashRequired)}</div>
                </div>
              </div>
            )}

            {/* Chart */}
            <div className="amz-panel px-3 py-4 sm:p-5">
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
            <div className="amz-panel px-3 py-4 sm:p-5">
              <div className="amz-label mb-3">Year-by-year breakdown — click a row to expand its months</div>
              <div className="overflow-auto amz-scrollbar" style={{ maxHeight: 460 }}>
                <table className="w-full text-sm amz-mono">
                  <thead>
                    <tr style={{ color: "var(--text-dim)" }} className="text-left">
                      <th className="amz-sticky pb-2 pr-3 font-normal">Year</th>
                      <th className="amz-sticky pb-2 pr-3 font-normal">EMI</th>
                      <th className="amz-sticky pb-2 pr-3 font-normal" style={{ color: "var(--teal)" }}>Principal</th>
                      <th className="amz-sticky pb-2 pr-3 font-normal" style={{ color: "var(--coral)" }}>Interest</th>
                      {showPrepayColumn && <th className="amz-sticky pb-2 pr-3 font-normal" style={{ color: "var(--gold)" }}>Prepaid</th>}
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
                            {showPrepayColumn && <td className="py-2 pr-3" style={{ color: row.prepay > 0 ? "var(--gold)" : "var(--text-dim)" }}>{row.prepay > 0 ? fmtINR(row.prepay) : "—"}</td>}
                            <td className="py-2" style={{ color: "var(--text-dim)" }}>{fmtINR(row.balance)}</td>
                          </tr>
                          {isOpen && monthRows.map((mRow, j) => (
                            <tr key={`${row.label}-${j}`} style={{ background: "var(--panel2)" }}>
                              <td className="py-1.5 pr-3 pl-6" style={{ color: "var(--text-dim)", fontSize: "13px" }}>{mRow.label}</td>
                              <td className="py-1.5 pr-3" style={{ fontSize: "13px" }}>{fmtINR(mRow.emi)}</td>
                              <td className="py-1.5 pr-3" style={{ color: "var(--teal)", fontSize: "13px" }}>{fmtINR(mRow.principal)}</td>
                              <td className="py-1.5 pr-3" style={{ color: "var(--coral)", fontSize: "13px" }}>{fmtINR(mRow.interest)}</td>
                              {showPrepayColumn && <td className="py-1.5 pr-3" style={{ color: mRow.prepay > 0 ? "var(--gold)" : "var(--text-dim)", fontSize: "13px" }}>{mRow.prepay > 0 ? fmtINR(mRow.prepay) : "—"}</td>}
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
