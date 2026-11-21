import { AlertCircle, CheckCircle2, FileText, Loader2, Upload, X } from 'lucide-react';
import { useRef, useState } from 'react';
import type { SyncExtractionResult } from '../types/course';

interface DriveSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  driveUrl: string;
  onDriveUrlChange: (url: string) => void;
  onApplySyncResult: (result: SyncExtractionResult) => void;
}

interface QueuedFile {
  name: string;
  mimeType: string;
  size: number;
  contentBase64: string;
}

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      const base64 = result.includes(',') ? result.split(',')[1] : result;
      resolve(base64);
    };
    reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
    reader.readAsDataURL(file);
  });
}

export function DriveSyncModal({
  isOpen,
  onClose,
  driveUrl,
  onDriveUrlChange,
  onApplySyncResult,
}: DriveSyncModalProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [queuedFiles, setQueuedFiles] = useState<QueuedFile[]>([]);
  const [notes, setNotes] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<SyncExtractionResult | null>(null);

  if (!isOpen) return null;

  const handleFilesSelected = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setErrorMsg(null);
    const allowedExt = ['docx', 'pdf', 'pptx', 'csv', 'txt', 'md'];
    const loaded: QueuedFile[] = [];

    for (const file of Array.from(fileList).slice(0, 5)) {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      if (!allowedExt.includes(ext)) {
        setErrorMsg(`Unsupported file format: ${file.name}. Use .docx, .pdf, .pptx, or .csv.`);
        continue;
      }
      if (file.size > 15 * 1024 * 1024) {
        setErrorMsg(`${file.name} exceeds 15 MB upload limit.`);
        continue;
      }
      const contentBase64 = await readFileAsBase64(file);
      loaded.push({
        name: file.name,
        mimeType: file.type || 'application/octet-stream',
        size: file.size,
        contentBase64,
      });
    }

    if (loaded.length > 0) {
      setQueuedFiles((prev) => [...prev, ...loaded].slice(0, 5));
    }
  };

  const handleAnalyze = async () => {
    setErrorMsg(null);
    setSuccessResult(null);
    setIsAnalyzing(true);

    try {
      const resp = await fetch('/api/analyze-drive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          driveUrl,
          notes,
          files: queuedFiles.map(({ name, mimeType, contentBase64 }) => ({
            name,
            mimeType,
            contentBase64,
          })),
        }),
      });

      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data.error || `Sync failed (HTTP ${resp.status})`);
      }

      const result = data as SyncExtractionResult;
      setSuccessResult(result);
      onApplySyncResult(result);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to analyze Drive repository.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="drive-sync-title"
        className="w-full max-w-2xl rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2
              id="drive-sync-title"
              className="font-display text-lg font-semibold text-slate-900 dark:text-slate-100"
            >
              Google Drive Repository Sync &amp; File Parser
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Ingest a shared Drive folder link or upload local .docx, .pdf, .pptx, or .csv files
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto">
          <div>
            <label
              htmlFor="drive-url-input"
              className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Google Drive Folder or File URL
            </label>
            <input
              id="drive-url-input"
              type="url"
              value={driveUrl}
              onChange={(e) => onDriveUrlChange(e.target.value)}
              placeholder="https://drive.google.com/drive/folders/..."
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <span className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Local Course Files (.docx, .pdf, .pptx, .csv)
            </span>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                void handleFilesSelected(e.dataTransfer.files);
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`cursor-pointer rounded-xl border border-dashed p-6 text-center transition-colors ${
                isDragging
                  ? 'border-indigo-500 bg-indigo-50/70 dark:bg-indigo-500/10'
                  : 'border-slate-300 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 bg-slate-50/60 dark:bg-slate-950/50'
              }`}
            >
              <Upload className="w-6 h-6 mx-auto text-indigo-500 mb-2" />
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Drag &amp; drop lecture slides, syllabus docs, or click to browse
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Up to 5 files (max 15 MB each) · Server-side XML &amp; PDF parsing via Gemini
              </p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".docx,.pdf,.pptx,.csv,.txt"
                className="hidden"
                onChange={(e) => void handleFilesSelected(e.target.files)}
              />
            </div>

            {queuedFiles.length > 0 && (
              <ul className="mt-3 divide-y divide-slate-200 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg">
                {queuedFiles.map((f, idx) => (
                  <li
                    key={`${f.name}-${idx}`}
                    className="flex items-center justify-between px-3 py-2 text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="w-4 h-4 text-indigo-500 shrink-0" />
                      <span className="font-mono text-slate-800 dark:text-slate-200 truncate">
                        {f.name}
                      </span>
                      <span className="text-slate-400 font-mono tabular-nums shrink-0">
                        {(f.size / 1024).toFixed(1)} KB
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setQueuedFiles((prev) => prev.filter((_, i) => i !== idx))
                      }
                      className="text-slate-400 hover:text-rose-500 p-1"
                      aria-label={`Remove ${f.name}`}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <label
              htmlFor="sync-notes"
              className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Optional Syllabus / Question Snippet
            </label>
            <textarea
              id="sync-notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Paste raw syllabus text, lecture schedule rows, or exam questions to parse..."
              className="w-full px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {errorMsg && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-lg border border-rose-200 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-500/10 text-xs text-rose-700 dark:text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successResult && (
            <div className="p-3.5 rounded-lg border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 text-xs text-emerald-800 dark:text-emerald-300 space-y-1.5">
              <div className="flex items-center gap-2 font-semibold">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Repository Synced &amp; Merged into Portal</span>
              </div>
              <p>{successResult.sourceSummary}</p>
              <p className="font-mono tabular-nums">
                Merged {successResult.extractedUnits.length} unit updates ·{' '}
                {successResult.extractedLectures.length} lecture updates ·{' '}
                {successResult.extractedQuestions.length} new practice questions
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors"
          >
            Close
          </button>
          <button
            type="button"
            disabled={isAnalyzing}
            onClick={() => void handleAnalyze()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white transition-colors"
          >
            {isAnalyzing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{isAnalyzing ? 'Analyzing with Gemini...' : 'Analyze & Sync Drive Data'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
