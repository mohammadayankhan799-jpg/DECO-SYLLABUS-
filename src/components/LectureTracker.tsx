import { Check, CheckSquare, RotateCcw, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { CourseOutcome, LecturePlanItem } from '../types/course';

interface LectureTrackerProps {
  lectures: LecturePlanItem[];
  completedIds: Set<string>;
  onToggleLecture: (id: string) => void;
  onBatchSetCompleted: (ids: string[], completed: boolean) => void;
}

export function LectureTracker({
  lectures,
  completedIds,
  onToggleLecture,
  onBatchSetCompleted,
}: LectureTrackerProps) {
  const [search, setSearch] = useState('');
  const [unitFilter, setUnitFilter] = useState<string>('ALL');
  const [coFilter, setCoFilter] = useState<'ALL' | CourseOutcome>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'COMPLETED' | 'PENDING'>('ALL');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return lectures.filter((lec) => {
      if (unitFilter !== 'ALL' && lec.unit !== unitFilter) return false;
      if (coFilter !== 'ALL' && lec.co !== coFilter) return false;
      const done = completedIds.has(lec.id);
      if (statusFilter === 'COMPLETED' && !done) return false;
      if (statusFilter === 'PENDING' && done) return false;
      if (!q) return true;
      return (
        lec.id.toLowerCase().includes(q) ||
        lec.topic.toLowerCase().includes(q) ||
        lec.teachingAid.toLowerCase().includes(q) ||
        lec.date.toLowerCase().includes(q) ||
        lec.trackBRef.toLowerCase().includes(q)
      );
    });
  }, [lectures, search, unitFilter, coFilter, statusFilter, completedIds]);

  const completedCount = lectures.filter((l) => completedIds.has(l.id)).length;
  const pct = lectures.length > 0 ? Math.round((completedCount / lectures.length) * 100) : 0;

  return (
    <section className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
        <div>
          <p className="text-xs font-mono text-indigo-600 dark:text-indigo-400">
            03-Aug-2026 to 06-Nov-2026 · 12 Academic Weeks
          </p>
          <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 mt-1">
            60-Lecture Interactive Tracker
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Track classroom delivery from L1 to L60 with Unit badges, Course Outcomes (CO1–CO5), and
            linked slide decks. Progress persists automatically in your browser.
          </p>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <div className="text-right">
            <div className="text-xs text-slate-500 dark:text-slate-400">Overall Completion</div>
            <div className="font-mono text-lg font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
              {completedCount} / {lectures.length} ({pct}%)
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search L1..L60, topic, date, or slide deck..."
            aria-label="Search lectures"
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            aria-label="Filter by Unit"
            value={unitFilter}
            onChange={(e) => setUnitFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">All Units</option>
            <option value="Unit I">Unit I (L1–L15)</option>
            <option value="Unit II">Unit II (L16–L30)</option>
            <option value="Unit III">Unit III (L31–L40)</option>
            <option value="Unit IV">Unit IV (L41–L50)</option>
            <option value="Unit V">Unit V (L51–L60)</option>
          </select>

          <select
            aria-label="Filter by Course Outcome"
            value={coFilter}
            onChange={(e) => setCoFilter(e.target.value as 'ALL' | CourseOutcome)}
            className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">All COs</option>
            <option value="CO1">CO1</option>
            <option value="CO2">CO2</option>
            <option value="CO3">CO3</option>
            <option value="CO4">CO4</option>
            <option value="CO5">CO5</option>
          </select>

          <div className="inline-flex p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900">
            {(['ALL', 'PENDING', 'COMPLETED'] as const).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`px-2.5 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                  statusFilter === status
                    ? 'bg-white dark:bg-indigo-600 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                {status === 'ALL' ? 'All' : status === 'PENDING' ? 'Pending' : 'Completed'}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() =>
              onBatchSetCompleted(
                filtered.map((l) => l.id),
                true
              )
            }
            disabled={filtered.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 disabled:opacity-50 transition-colors whitespace-nowrap"
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>Mark Visible Done</span>
          </button>

          <button
            type="button"
            onClick={() =>
              onBatchSetCompleted(
                filtered.map((l) => l.id),
                false
              )
            }
            disabled={filtered.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors whitespace-nowrap"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Visible</span>
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-xs font-mono text-slate-500 dark:text-slate-400">
                <th className="py-3 px-4 w-12 font-medium">Done</th>
                <th className="py-3 px-3 font-medium">Lecture</th>
                <th className="py-3 px-3 font-medium">Date</th>
                <th className="py-3 px-3 font-medium">Unit &amp; CO</th>
                <th className="py-3 px-4 font-medium">Lecture Topic</th>
                <th className="py-3 px-4 font-medium">Teaching Aid / File</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80 text-sm">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 px-4 text-center text-sm text-slate-500 dark:text-slate-400">
                    No lectures match your active filters. Clear search or reset filters to view all 60 lectures.
                  </td>
                </tr>
              ) : (
                filtered.map((lec) => {
                  const isDone = completedIds.has(lec.id);
                  return (
                    <tr
                      key={lec.id}
                      className={`transition-colors ${
                        isDone
                          ? 'bg-emerald-50/40 dark:bg-emerald-500/5'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      <td className="py-3 px-4">
                        <button
                          type="button"
                          role="checkbox"
                          aria-checked={isDone}
                          aria-label={`Mark ${lec.id} as ${isDone ? 'pending' : 'completed'}`}
                          onClick={() => onToggleLecture(lec.id)}
                          className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                            isDone
                              ? 'bg-emerald-600 border-emerald-600 text-white'
                              : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-950 hover:border-indigo-500'
                          }`}
                        >
                          {isDone && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                        </button>
                      </td>
                      <td className="py-3 px-3 font-mono text-xs tabular-nums whitespace-nowrap">
                        <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                          {lec.id}
                        </span>
                        <span className="text-slate-400 ml-1.5">W{lec.week}</span>
                      </td>
                      <td className="py-3 px-3 font-mono text-xs tabular-nums text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {lec.date}
                      </td>
                      <td className="py-3 px-3 font-mono text-xs whitespace-nowrap">
                        <span className="text-slate-800 dark:text-slate-200">{lec.unit}</span>
                        <span className="text-slate-400 mx-1.5">·</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                          {lec.co}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div
                          className={`font-medium ${
                            isDone
                              ? 'line-through text-slate-500 dark:text-slate-400'
                              : 'text-slate-900 dark:text-slate-100'
                          }`}
                        >
                          {lec.topic}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {lec.trackBRef}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        {lec.teachingAid}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
