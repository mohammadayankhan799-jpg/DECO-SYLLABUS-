import {
  FileCheck2,
  FileSpreadsheet,
  FileText,
  Folder,
  Presentation,
  Search,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import type { DriveFileType, DriveFolderName, DriveResourceFile } from '../types/course';

interface DriveRepositoryProps {
  files: DriveResourceFile[];
  selectedFolder: 'ALL' | DriveFolderName;
  onSelectFolder: (folder: 'ALL' | DriveFolderName) => void;
}

const FOLDERS: Array<'ALL' | DriveFolderName> = [
  'ALL',
  'Root',
  'CSM',
  'CSM_AIML_2026',
  'DECO_U1',
  'DECO_U2',
  'DECO_U3',
  'DECO_U4',
  'DECO_U5',
];

const FILE_TYPES: Array<'ALL' | DriveFileType> = ['ALL', 'PPTX', 'DOCX', 'PDF', 'Sheet'];

function FileIcon({ type }: { type: DriveFileType }) {
  switch (type) {
    case 'PPTX':
      return <Presentation className="w-4 h-4 text-amber-500 shrink-0" />;
    case 'DOCX':
      return <FileText className="w-4 h-4 text-indigo-500 shrink-0" />;
    case 'PDF':
      return <FileCheck2 className="w-4 h-4 text-rose-500 shrink-0" />;
    case 'Sheet':
      return <FileSpreadsheet className="w-4 h-4 text-emerald-500 shrink-0" />;
  }
}

export function DriveRepository({
  files,
  selectedFolder,
  onSelectFolder,
}: DriveRepositoryProps) {
  const [typeFilter, setTypeFilter] = useState<'ALL' | DriveFileType>('ALL');
  const [search, setSearch] = useState('');
  const [activeFileId, setActiveFileId] = useState<string>(files[0]?.id ?? '');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return files.filter((file) => {
      if (selectedFolder !== 'ALL' && file.folder !== selectedFolder) return false;
      if (typeFilter !== 'ALL' && file.type !== typeFilter) return false;
      if (!q) return true;
      return (
        file.name.toLowerCase().includes(q) ||
        file.summary.toLowerCase().includes(q) ||
        file.unitRef.toLowerCase().includes(q)
      );
    });
  }, [files, selectedFolder, typeFilter, search]);

  const activeFile =
    filtered.find((f) => f.id === activeFileId) ?? filtered[0] ?? null;

  return (
    <section className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
        <div>
          <p className="text-xs font-mono text-indigo-600 dark:text-indigo-400">
            Mirrored Drive Hierarchy · Slides &amp; Solved Assessments
          </p>
          <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 mt-1">
            Drive File Repository &amp; Study Explorer
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Browse lecture decks, solved CIE-1/CIE-2 keys, assignment booklets, and unit surprise tests
            across Root, CSM, CSM_AIML_2026, and DECO_U1–DECO_U5.
          </p>
        </div>

        <div className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400 shrink-0">
          {filtered.length} of {files.length} repository items
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {FOLDERS.map((folder) => {
          const active = selectedFolder === folder;
          return (
            <button
              key={folder}
              type="button"
              onClick={() => onSelectFolder(folder)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-colors whitespace-nowrap ${
                active
                  ? 'bg-indigo-600 text-white'
                  : 'border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Folder className="w-3.5 h-3.5" />
              <span>{folder === 'ALL' ? 'All Folders' : folder}</span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search filename, topic, or unit..."
            aria-label="Search repository files"
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="inline-flex p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 self-start">
          {FILE_TYPES.map((ft) => (
            <button
              key={ft}
              type="button"
              onClick={() => setTypeFilter(ft)}
              className={`px-3 py-1.5 rounded-md text-xs font-mono font-medium whitespace-nowrap transition-colors ${
                typeFilter === ft
                  ? 'bg-white dark:bg-indigo-600 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              {ft === 'ALL' ? 'All Types' : ft}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 divide-y divide-slate-200 dark:divide-slate-800/80 overflow-hidden">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
              No files match the current folder or file type filter.
            </div>
          ) : (
            filtered.map((file) => {
              const isSelected = activeFile?.id === file.id;
              return (
                <button
                  key={file.id}
                  type="button"
                  onClick={() => setActiveFileId(file.id)}
                  className={`w-full text-left px-4 py-3.5 flex items-start justify-between gap-4 transition-colors ${
                    isSelected
                      ? 'bg-indigo-50/70 dark:bg-indigo-500/10'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="mt-0.5">
                      <FileIcon type={file.type} />
                    </div>
                    <div className="min-w-0">
                      <div className="font-mono text-xs sm:text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                        {file.name}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1">
                        <span className="font-mono">{file.folder}</span>
                        <span aria-hidden="true">·</span>
                        <span>{file.category}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono">{file.unitRef}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-mono text-xs font-medium text-indigo-600 dark:text-indigo-400">
                      {file.type}
                    </div>
                    <div className="font-mono text-xs tabular-nums text-slate-400 mt-0.5">
                      {file.slideOrPageCount}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>

        <aside className="lg:col-span-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5 sm:p-6 sticky top-24">
          {activeFile ? (
            <div className="space-y-4">
              <div className="pb-4 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2 text-xs font-mono text-slate-500 dark:text-slate-400">
                  <FileIcon type={activeFile.type} />
                  <span>{activeFile.folder}</span>
                  <span aria-hidden="true">/</span>
                  <span>{activeFile.type}</span>
                  <span aria-hidden="true">·</span>
                  <span className="tabular-nums">{activeFile.slideOrPageCount}</span>
                </div>
                <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-slate-100 mt-1.5 break-all">
                  {activeFile.name}
                </h3>
                <div className="flex items-center gap-2 text-xs font-mono text-emerald-600 dark:text-emerald-400 mt-1">
                  <span>{activeFile.unitRef}</span>
                  <span aria-hidden="true">·</span>
                  <span>{activeFile.coRef.join(', ')}</span>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
                  Quick-View Summary
                </h4>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  {activeFile.summary}
                </p>
              </div>

              <div>
                <h4 className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">
                  Key Concepts &amp; Problem Coverage
                </h4>
                <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {activeFile.highlights.map((h, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="font-mono text-indigo-500 mt-0.5">
                        {String(i + 1).padStart(2, '0')}.
                      </span>
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Select any slide deck or solved assessment key from the list to inspect its summary.
            </p>
          )}
        </aside>
      </div>
    </section>
  );
}
