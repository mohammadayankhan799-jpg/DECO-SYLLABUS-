import { FolderSync, Menu, Moon, Sun } from 'lucide-react';
import { COURSE_METADATA } from '../data/decoCourseData';

interface HeaderBarProps {
  isDark: boolean;
  onToggleTheme: () => void;
  onOpenDriveSync: () => void;
  onOpenMobileNav: () => void;
  driveUrl: string;
  onDriveUrlChange: (url: string) => void;
  lastSyncedAt: string | null;
}

export function HeaderBar({
  isDark,
  onToggleTheme,
  onOpenDriveSync,
  onOpenMobileNav,
  driveUrl,
  onDriveUrlChange,
  lastSyncedAt,
}: HeaderBarProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 dark:border-slate-800/80 bg-white/85 dark:bg-[#0f172a]/85 backdrop-blur-md px-4 sm:px-6 py-3">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onOpenMobileNav}
            aria-label="Open navigation menu"
            className="lg:hidden p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
          >
            <Menu className="w-4 h-4" />
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 truncate">
              <span className="font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                {COURSE_METADATA.shortInstitution}
              </span>
              <span aria-hidden="true">·</span>
              <span className="whitespace-nowrap">{COURSE_METADATA.accreditation}</span>
              <span aria-hidden="true" className="hidden sm:inline">·</span>
              <span className="hidden sm:inline whitespace-nowrap">{COURSE_METADATA.regulation}</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400 mt-0.5 truncate">
              <span className="text-indigo-600 dark:text-indigo-400 font-medium whitespace-nowrap">
                {COURSE_METADATA.courseCode}
              </span>
              <span aria-hidden="true">·</span>
              <span className="whitespace-nowrap">{COURSE_METADATA.credits} Credits</span>
              <span aria-hidden="true">·</span>
              <span className="whitespace-nowrap">
                CIE: {COURSE_METADATA.cieMarks} / SEE: {COURSE_METADATA.seeMarks}
              </span>
              {lastSyncedAt && (
                <>
                  <span aria-hidden="true" className="hidden md:inline">·</span>
                  <span className="hidden md:inline text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                    Synced {lastSyncedAt}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <div className="hidden xl:flex items-center border border-slate-200 dark:border-slate-700/90 rounded-lg bg-slate-50 dark:bg-slate-900/80 px-2.5 py-1.5 w-80">
            <input
              type="url"
              value={driveUrl}
              onChange={(e) => onDriveUrlChange(e.target.value)}
              aria-label="Google Drive repository URL"
              placeholder="Paste Google Drive folder link..."
              className="w-full bg-transparent text-xs font-mono text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none truncate"
            />
          </div>

          <button
            type="button"
            onClick={onOpenDriveSync}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            <FolderSync className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Drive Sync &amp; Uploader</span>
            <span className="sm:hidden">Sync</span>
          </button>

          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
            title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
}
