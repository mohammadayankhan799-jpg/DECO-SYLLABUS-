import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Loader2,
  PlusCircle,
  XCircle,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import type {
  BloomLevel,
  CourseOutcome,
  NbaMatrixRow,
  PracticeQuestion,
} from '../types/course';

interface NbaQuizArenaProps {
  matrixRows: NbaMatrixRow[];
  questions: PracticeQuestion[];
  onAddQuestion: (q: PracticeQuestion) => void;
}

const PO_KEYS = [
  'PO1',
  'PO2',
  'PO3',
  'PO4',
  'PO5',
  'PO6',
  'PO7',
  'PO8',
  'PO9',
  'PO10',
  'PO11',
  'PO12',
] as const;

export function NbaQuizArena({
  matrixRows,
  questions,
  onAddQuestion,
}: NbaQuizArenaProps) {
  const [unitFilter, setUnitFilter] = useState<'ALL' | PracticeQuestion['unit']>('ALL');
  const [coFilter, setCoFilter] = useState<'ALL' | CourseOutcome>('ALL');
  const [btlFilter, setBtlFilter] = useState<'ALL' | BloomLevel>('ALL');
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [expandedSolutions, setExpandedSolutions] = useState<Record<string, boolean>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      if (unitFilter !== 'ALL' && q.unit !== unitFilter) return false;
      if (coFilter !== 'ALL' && q.co !== coFilter) return false;
      if (btlFilter !== 'ALL' && q.btl !== btlFilter) return false;
      return true;
    });
  }, [questions, unitFilter, coFilter, btlFilter]);

  const averages = useMemo(() => {
    const calcAvg = (vals: Array<number | null>) => {
      const valid = vals.filter((v): v is number => v !== null);
      if (valid.length === 0) return '-';
      return (valid.reduce((a, b) => a + b, 0) / valid.length).toFixed(1);
    };
    const poAvg: Record<string, string> = {};
    for (const key of PO_KEYS) {
      poAvg[key] = calcAvg(matrixRows.map((r) => r.po[key]));
    }
    return {
      po: poAvg,
      pso1: calcAvg(matrixRows.map((r) => r.pso.PSO1)),
      pso2: calcAvg(matrixRows.map((r) => r.pso.PSO2)),
    };
  }, [matrixRows]);

  const handleGenerateAiQuestion = async () => {
    setAiError(null);
    setIsGenerating(true);
    try {
      const targetUnit = unitFilter === 'ALL' ? 'Unit I' : unitFilter;
      const targetCo =
        coFilter !== 'ALL'
          ? coFilter
          : targetUnit === 'Unit I'
          ? 'CO1'
          : targetUnit === 'Unit II'
          ? 'CO2'
          : targetUnit === 'Unit III'
          ? 'CO3'
          : targetUnit === 'Unit IV'
          ? 'CO4'
          : 'CO5';
      const targetBtl = btlFilter === 'ALL' ? 'BTL3' : btlFilter;

      const resp = await fetch('/api/generate-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unit: targetUnit,
          co: targetCo,
          btl: targetBtl,
        }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data.error || `Question generation failed (HTTP ${resp.status})`);
      }
      onAddQuestion(data as PracticeQuestion);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Unable to generate question.');
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleSolution = (id: string) => {
    setExpandedSolutions((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <section className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
        <div>
          <p className="text-xs font-mono text-indigo-600 dark:text-indigo-400">
            DCO_CO_PO_Mapping_NBA_Tier1.docx · CIE &amp; Surprise Test Arena
          </p>
          <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 mt-1">
            NBA Tier-1 CO-PO-PSO Matrix &amp; BTL Practice Arena
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Inspect the official NBA articulation matrix and practice solved CIE-1, CIE-2, Quiz-1, and
            Surprise Test questions calibrated by Unit, CO, and Bloom’s Taxonomy Level.
          </p>
        </div>
      </div>

      {/* NBA Tier-1 Matrix */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100">
              Official CO–PO–PSO Articulation Matrix (U24EC304)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Correlation Levels: 3 = High (Substantial) · 2 = Medium (Moderate) · 1 = Low (Slight) · - = No Correlation
            </p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 font-mono text-slate-500 dark:text-slate-400">
                <th className="py-2.5 px-4">CO</th>
                <th className="py-2.5 px-3 min-w-[240px]">Course Outcome Statement</th>
                <th className="py-2.5 px-2 text-center">BTL</th>
                {PO_KEYS.map((po) => (
                  <th key={po} className="py-2.5 px-2 text-center tabular-nums">
                    {po}
                  </th>
                ))}
                <th className="py-2.5 px-2 text-center text-indigo-600 dark:text-indigo-400">PSO1</th>
                <th className="py-2.5 px-2 text-center text-indigo-600 dark:text-indigo-400">PSO2</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80">
              {matrixRows.map((row) => (
                <tr key={row.co} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-4 font-mono font-semibold text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                    {row.co}
                  </td>
                  <td className="py-3 px-3 text-slate-700 dark:text-slate-300 leading-snug">
                    {row.description}
                  </td>
                  <td className="py-3 px-2 text-center font-mono text-emerald-600 dark:text-emerald-400 font-medium whitespace-nowrap">
                    {row.btl}
                  </td>
                  {PO_KEYS.map((po) => {
                    const val = row.po[po];
                    return (
                      <td
                        key={po}
                        className={`py-3 px-2 text-center font-mono tabular-nums ${
                          val === 3
                            ? 'font-bold text-slate-900 dark:text-slate-100'
                            : val === 2
                            ? 'text-slate-700 dark:text-slate-300'
                            : val === 1
                            ? 'text-slate-500 dark:text-slate-400'
                            : 'text-slate-300 dark:text-slate-700'
                        }`}
                      >
                        {val ?? '-'}
                      </td>
                    );
                  })}
                  <td className="py-3 px-2 text-center font-mono tabular-nums font-semibold text-indigo-600 dark:text-indigo-400">
                    {row.pso.PSO1 ?? '-'}
                  </td>
                  <td className="py-3 px-2 text-center font-mono tabular-nums font-semibold text-indigo-600 dark:text-indigo-400">
                    {row.pso.PSO2 ?? '-'}
                  </td>
                </tr>
              ))}
              <tr className="bg-slate-50 dark:bg-slate-950/60 font-mono font-semibold text-slate-800 dark:text-slate-200 border-t border-slate-200 dark:border-slate-800">
                <td className="py-2.5 px-4" colSpan={3}>
                  Average CO Articulation Score
                </td>
                {PO_KEYS.map((po) => (
                  <td key={po} className="py-2.5 px-2 text-center tabular-nums">
                    {averages.po[po]}
                  </td>
                ))}
                <td className="py-2.5 px-2 text-center tabular-nums text-indigo-600 dark:text-indigo-400">
                  {averages.pso1}
                </td>
                <td className="py-2.5 px-2 text-center tabular-nums text-indigo-600 dark:text-indigo-400">
                  {averages.pso2}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Interactive Quiz & Exam Practice Arena */}
      <div className="space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-xl font-bold text-slate-900 dark:text-slate-100">
              Interactive Exam Practice Arena
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Pre-loaded with CIE-1, CIE-2, Quiz-1 &amp; Surprise Tests 1–4 · Filter or generate new questions via Gemini
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label="Filter quiz by Unit"
              value={unitFilter}
              onChange={(e) => setUnitFilter(e.target.value as 'ALL' | PracticeQuestion['unit'])}
              className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-200"
            >
              <option value="ALL">All Units</option>
              <option value="Unit I">Unit I</option>
              <option value="Unit II">Unit II</option>
              <option value="Unit III">Unit III</option>
              <option value="Unit IV">Unit IV</option>
              <option value="Unit V">Unit V</option>
            </select>

            <select
              aria-label="Filter quiz by Course Outcome"
              value={coFilter}
              onChange={(e) => setCoFilter(e.target.value as 'ALL' | CourseOutcome)}
              className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-200"
            >
              <option value="ALL">All COs</option>
              <option value="CO1">CO1</option>
              <option value="CO2">CO2</option>
              <option value="CO3">CO3</option>
              <option value="CO4">CO4</option>
              <option value="CO5">CO5</option>
            </select>

            <select
              aria-label="Filter quiz by Bloom Taxonomy Level"
              value={btlFilter}
              onChange={(e) => setBtlFilter(e.target.value as 'ALL' | BloomLevel)}
              className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-200"
            >
              <option value="ALL">All BTLs</option>
              <option value="BTL1">BTL1 · Remember</option>
              <option value="BTL2">BTL2 · Understand</option>
              <option value="BTL3">BTL3 · Apply</option>
              <option value="BTL4">BTL4 · Analyze</option>
              <option value="BTL5">BTL5 · Evaluate</option>
            </select>

            <button
              type="button"
              disabled={isGenerating}
              onClick={() => void handleGenerateAiQuestion()}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white transition-colors whitespace-nowrap"
            >
              {isGenerating ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <PlusCircle className="w-3.5 h-3.5" />
              )}
              <span>{isGenerating ? 'Generating...' : 'AI Generate New Question'}</span>
            </button>
          </div>
        </div>

        {aiError && (
          <div className="flex items-start gap-2.5 p-3.5 rounded-lg border border-rose-200 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-500/10 text-xs text-rose-700 dark:text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{aiError}</span>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4">
          {filteredQuestions.length === 0 ? (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-8 text-center text-sm text-slate-500 dark:text-slate-400">
              No questions match the selected Unit / CO / BTL filters. Click &ldquo;AI Generate New Question&rdquo; or reset filters.
            </div>
          ) : (
            filteredQuestions.map((q, qIdx) => {
              const chosenIdx = selectedAnswers[q.id];
              const hasAnswered = chosenIdx !== undefined;
              const isExpanded = Boolean(expandedSolutions[q.id]);

              return (
                <article
                  key={q.id}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5 sm:p-6 space-y-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-slate-500 dark:text-slate-400">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                        Q{qIdx + 1}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{q.unit}</span>
                      <span aria-hidden="true">·</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                        {q.co}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{q.btl}</span>
                      <span aria-hidden="true">·</span>
                      <span>{q.source}</span>
                      {q.isAiGenerated && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="text-indigo-500">AI Generated</span>
                        </>
                      )}
                    </div>
                    <span className="tabular-nums">{q.marks} Marks</span>
                  </div>

                  <p className="text-sm sm:text-base font-medium text-slate-900 dark:text-slate-100 leading-relaxed">
                    {q.question}
                  </p>

                  {q.options && q.options.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {q.options.map((opt, idx) => {
                        const isSelected = chosenIdx === idx;
                        const isCorrect = q.correctOptionIndex === idx;
                        let btnStyle =
                          'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/60 text-slate-700 dark:text-slate-200 hover:border-indigo-400';

                        if (hasAnswered) {
                          if (isCorrect) {
                            btnStyle =
                              'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/15 text-emerald-800 dark:text-emerald-300';
                          } else if (isSelected && !isCorrect) {
                            btnStyle =
                              'border-rose-500 bg-rose-50 dark:bg-rose-500/15 text-rose-800 dark:text-rose-300';
                          }
                        }

                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() =>
                              setSelectedAnswers((prev) => ({ ...prev, [q.id]: idx }))
                            }
                            className={`text-left px-3.5 py-2.5 rounded-lg border text-xs sm:text-sm flex items-start justify-between gap-2 transition-colors ${btnStyle}`}
                          >
                            <span>
                              <span className="font-mono font-semibold mr-2">
                                {String.fromCharCode(65 + idx)}.
                              </span>
                              {opt}
                            </span>
                            {hasAnswered && isCorrect && (
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                            )}
                            {hasAnswered && isSelected && !isCorrect && (
                              <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80">
                    <button
                      type="button"
                      onClick={() => toggleSolution(q.id)}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp className="w-3.5 h-3.5" />
                          <span>Hide Step-by-Step Solution</span>
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-3.5 h-3.5" />
                          <span>View Step-by-Step Solution</span>
                        </>
                      )}
                    </button>

                    {isExpanded && (
                      <div className="mt-3 p-4 rounded-lg bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                        <ol className="space-y-1.5 text-slate-700 dark:text-slate-300 font-mono leading-relaxed">
                          {q.solutionSteps.map((step, idx) => (
                            <li key={idx}>
                              {idx + 1}. {step}
                            </li>
                          ))}
                        </ol>
                        <div className="pt-2 border-t border-slate-200 dark:border-slate-800 font-mono font-semibold text-emerald-700 dark:text-emerald-400">
                          Final Answer: {q.finalAnswer}
                        </div>
                      </div>
                    )}
                  </div>
                </article>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}
