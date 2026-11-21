import { ArrowRight, Cpu, FolderOpen } from 'lucide-react';
import { useState } from 'react';
import type {
  CrosswalkRow,
  DriveFolderName,
  SyllabusTrack,
  SyllabusUnit,
} from '../types/course';

interface SyllabusExplorerProps {
  trackBUnits: SyllabusUnit[];
  trackAUnits: SyllabusUnit[];
  crosswalkRows: CrosswalkRow[];
  onOpenFolder: (folder: DriveFolderName) => void;
  onOpenTool: (tool: 'base-ieee' | 'hamming' | 'arithmetic' | 'cache-ea') => void;
}

const TOOL_LABELS: Record<'base-ieee' | 'hamming' | 'arithmetic' | 'cache-ea', string> = {
  'base-ieee': 'Open Base & IEEE 754 Converter',
  hamming: 'Open Hamming (7,4) Simulator',
  arithmetic: 'Open Booth’s & Division Tracer',
  'cache-ea': 'Open Cache & EA Calculator',
};

export function SyllabusExplorer({
  trackBUnits,
  trackAUnits,
  crosswalkRows,
  onOpenFolder,
  onOpenTool,
}: SyllabusExplorerProps) {
  const [activeTrack, setActiveTrack] = useState<SyllabusTrack>('track-b');

  const activeUnits = activeTrack === 'track-a' ? trackAUnits : trackBUnits;

  return (
    <section className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
        <div>
          <p className="text-xs font-mono text-indigo-600 dark:text-indigo-400">
            U24EC304 · Dual-Track Curriculum Architecture
          </p>
          <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 mt-1">
            Interactive Syllabus Explorer
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
            Switch between the Active Assessment Track (Syllabus_DECO.pdf &amp; Unit folders), the
            LR24 Master 60-Lecture Track (LR24-CSE-AIML-Syllabus), or inspect the Unified Crosswalk.
          </p>
        </div>

        <div
          role="tablist"
          aria-label="Syllabus track switcher"
          className="inline-flex items-center p-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900/90 self-start"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTrack === 'track-b'}
            onClick={() => setActiveTrack('track-b')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
              activeTrack === 'track-b'
                ? 'bg-white dark:bg-indigo-600 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            Track B · Exam &amp; Units
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTrack === 'track-a'}
            onClick={() => setActiveTrack('track-a')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
              activeTrack === 'track-a'
                ? 'bg-white dark:bg-indigo-600 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            Track A · LR24 60-Lecture
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTrack === 'unified'}
            onClick={() => setActiveTrack('unified')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
              activeTrack === 'unified'
                ? 'bg-white dark:bg-indigo-600 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            Unified Crosswalk
          </button>
        </div>
      </div>

      {activeTrack === 'unified' ? (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800">
            <h3 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100">
              Unified Master Crosswalk: Track B (Exam Blueprint) ↔ Track A (LR24 60-Hour Plan)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Maps every classroom lecture block (L1–L60) directly to CIE-1, CIE-2, and SEE unit folders.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-xs font-mono text-slate-500 dark:text-slate-400">
                  <th className="py-3 px-4 font-medium">Knowledge Domain</th>
                  <th className="py-3 px-4 font-medium">Track B (Assessment)</th>
                  <th className="py-3 px-4 font-medium">Track A (LR24 Plan)</th>
                  <th className="py-3 px-4 font-medium">Lectures</th>
                  <th className="py-3 px-4 font-medium">CO</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80 text-sm">
                {crosswalkRows.map((row) => (
                  <tr
                    key={row.conceptGroup}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3.5 px-4 font-medium text-slate-900 dark:text-slate-100">
                      {row.conceptGroup}
                      <div className="text-xs font-normal text-slate-500 dark:text-slate-400 mt-0.5">
                        {row.trackBTopics}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                      {row.trackBUnit}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      {row.trackAUnit}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs tabular-nums text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {row.trackALectures}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs font-medium text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                      {row.mappedCO}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 px-1">
            <span>
              {activeTrack === 'track-b'
                ? 'Source: Syllabus_DECO.pdf & DECO_U1–DECO_U5 Assessment Folders'
                : 'Source: LR24-CSE-AIML-Syllabus-24062025.docx (60-Hour Delivery Plan)'}
            </span>
            <span className="font-mono tabular-nums">
              {activeUnits.length} Units ·{' '}
              {activeUnits.reduce((acc, u) => acc + u.hours, 0)} Instructional Hours
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {activeUnits.map((unit) => (
              <article
                key={unit.id}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5 sm:p-6 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800/80">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-slate-500 dark:text-slate-400">
                      <span className="text-indigo-600 dark:text-indigo-400 font-semibold">
                        {unit.unitNumber}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                        {unit.mappedCOs.join(', ')}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums">{unit.hours} Hours</span>
                      {unit.lectureRange && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="tabular-nums">{unit.lectureRange}</span>
                        </>
                      )}
                    </div>
                    <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-slate-100 mt-1">
                      {unit.title}
                    </h3>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {unit.linkedFolder && (
                      <button
                        type="button"
                        onClick={() => onOpenFolder(unit.linkedFolder as DriveFolderName)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap"
                      >
                        <FolderOpen className="w-3.5 h-3.5 text-indigo-500" />
                        <span>{unit.linkedFolder} Files</span>
                      </button>
                    )}
                    {unit.linkedTool && (
                      <button
                        type="button"
                        onClick={() => onOpenTool(unit.linkedTool!)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-500/15 text-xs font-medium text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-500/25 transition-colors whitespace-nowrap"
                      >
                        <Cpu className="w-3.5 h-3.5" />
                        <span>{TOOL_LABELS[unit.linkedTool]}</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
                  <div className="lg:col-span-2">
                    <h4 className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2.5">
                      Syllabus Topics
                    </h4>
                    <ul className="space-y-1.5 text-sm text-slate-700 dark:text-slate-300">
                      {unit.topics.map((topic, i) => (
                        <li key={i} className="flex items-start gap-2.5">
                          <span className="font-mono text-xs text-slate-400 dark:text-slate-500 mt-0.5 tabular-nums">
                            {String(i + 1).padStart(2, '0')}.
                          </span>
                          <span>{topic}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="lg:border-l lg:border-slate-200 dark:lg:border-slate-800 lg:pl-6">
                    <h4 className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2.5">
                      Core Exam Competencies
                    </h4>
                    <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      {unit.keyOutcomes.map((outcome, i) => (
                        <li key={i}>{outcome}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
