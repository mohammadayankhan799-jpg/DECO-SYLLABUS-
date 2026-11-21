import {
  BookOpen,
  CalendarCheck,
  Cpu,
  FolderKanban,
  GraduationCap,
  X,
} from 'lucide-react';
import { COURSE_METADATA } from '../data/decoCourseData';
import type { NavSection } from '../types/course';

interface SidebarNavProps {
  activeSection: NavSection;
  onSelectSection: (section: NavSection) => void;
  completedCount: number;
  totalLectures: number;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

const NAV_ITEMS: Array<{
  id: NavSection;
  label: string;
  sublabel: string;
  icon: typeof BookOpen;
}> = [
  {
    id: 'syllabus',
    label: 'Syllabus Explorer',
    sublabel: 'Track A & Track B',
    icon: BookOpen,
  },
  {
    id: 'lectures',
    label: '60-Lecture Tracker',
    sublabel: '12-Week Lesson Plan',
    icon: CalendarCheck,
  },
  {
    id: 'repository',
    label: 'Drive Repository',
    sublabel: 'Slides & Solved Keys',
    icon: FolderKanban,
  },
  {
    id: 'calculators',
    label: 'Hardware Lab',
    sublabel: '4 Interactive Simulators',
    icon: Cpu,
  },
  {
    id: 'nba-quiz',
    label: 'NBA Matrix & Quiz',
    sublabel: 'CO-PO-PSO & BTL Arena',
    icon: GraduationCap,
  },
];

export function SidebarNav({
  activeSection,
  onSelectSection,
  completedCount,
  totalLectures,
  mobileOpen,
  onCloseMobile,
}: SidebarNavProps) {
  const progressPct = totalLectures > 0 ? Math.round((completedCount / totalLectures) * 100) : 0;

  const navContent = (
    <div className="flex h-full flex-col justify-between bg-white dark:bg-[#0b1222] border-r border-slate-200 dark:border-slate-800/80 px-4 py-5">
      <div>
        <div className="flex items-center justify-between px-2 pb-5 border-b border-slate-200 dark:border-slate-800/80">
          <div>
            <p className="font-mono text-xs font-medium tracking-wide text-indigo-600 dark:text-indigo-400">
              {COURSE_METADATA.courseCode}
            </p>
            <h1 className="font-display text-base font-bold tracking-tight text-slate-900 dark:text-slate-100 mt-0.5">
              {COURSE_METADATA.shortTitle}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {COURSE_METADATA.program}
            </p>
          </div>
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Close navigation drawer"
            className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <nav aria-label="Course modules" className="mt-5 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onSelectSection(item.id);
                  onCloseMobile();
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive
                      ? 'text-indigo-600 dark:text-indigo-400'
                      : 'text-slate-400 dark:text-slate-500'
                  }`}
                />
                <div className="min-w-0">
                  <div className="text-sm font-medium leading-tight whitespace-nowrap truncate">
                    {item.label}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 leading-tight mt-0.5 whitespace-nowrap truncate">
                    {item.sublabel}
                  </div>
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="pt-4 border-t border-slate-200 dark:border-slate-800/80 px-2 space-y-3">
        <div>
          <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 mb-1.5">
            <span>Semester Delivery</span>
            <span className="font-mono tabular-nums font-medium text-emerald-600 dark:text-emerald-400">
              {completedCount}/{totalLectures} ({progressPct}%)
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all duration-200"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        <div className="text-xs text-slate-500 dark:text-slate-400 space-y-0.5">
          <p className="font-medium text-slate-700 dark:text-slate-300">
            {COURSE_METADATA.faculty}
          </p>
          <p>{COURSE_METADATA.institution}</p>
          <p className="font-mono tabular-nums">{COURSE_METADATA.academicWindow}</p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:block w-64 shrink-0 sticky top-0 h-screen">
        {navContent}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative w-72 max-w-[85vw] h-full z-10">{navContent}</div>
        </div>
      )}
    </>
  );
}
