import { useEffect, useState } from 'react';
import { DriveRepository } from './components/DriveRepository';
import { DriveSyncModal } from './components/DriveSyncModal';
import { type CalculatorTab, HardwareCalculators } from './components/HardwareCalculators';
import { HeaderBar } from './components/HeaderBar';
import { LectureTracker } from './components/LectureTracker';
import { NbaQuizArena } from './components/NbaQuizArena';
import { SidebarNav } from './components/SidebarNav';
import { SyllabusExplorer } from './components/SyllabusExplorer';
import {
  COURSE_METADATA,
  CROSSWALK_ROWS,
  DRIVE_FILES,
  LECTURE_PLAN,
  NBA_MATRIX,
  PRACTICE_QUESTIONS,
  TRACK_A_UNITS,
  TRACK_B_UNITS,
} from './data/decoCourseData';
import type {
  DriveFolderName,
  LecturePlanItem,
  NavSection,
  PracticeQuestion,
  SyllabusUnit,
  SyncExtractionResult,
} from './types/course';

const COMPLETED_STORAGE_KEY = 'deco_completed_lectures_v1';
const THEME_STORAGE_KEY = 'deco_theme_v1';

export default function App() {
  const [activeSection, setActiveSection] = useState<NavSection>('syllabus');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      return saved ? saved === 'dark' : true;
    } catch {
      return true;
    }
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, isDark ? 'dark' : 'light');
    } catch {
      // ignore storage errors
    }
  }, [isDark]);

  // Dynamic course state pre-populated with authentic Drive repository data
  const [trackBUnits, setTrackBUnits] = useState<SyllabusUnit[]>(TRACK_B_UNITS);
  const [lectures, setLectures] = useState<LecturePlanItem[]>(LECTURE_PLAN);
  const [questions, setQuestions] = useState<PracticeQuestion[]>(PRACTICE_QUESTIONS);

  // Lecture completion persistence
  const [completedLectureIds, setCompletedLectureIds] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem(COMPLETED_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return new Set(parsed.filter((v) => typeof v === 'string'));
        }
      }
    } catch {
      // ignore storage errors
    }
    return new Set(['L1', 'L2', 'L3']);
  });

  useEffect(() => {
    try {
      localStorage.setItem(
        COMPLETED_STORAGE_KEY,
        JSON.stringify(Array.from(completedLectureIds))
      );
    } catch {
      // ignore storage errors
    }
  }, [completedLectureIds]);

  const handleToggleLecture = (id: string) => {
    setCompletedLectureIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleBatchSetCompleted = (ids: string[], completed: boolean) => {
    setCompletedLectureIds((prev) => {
      const next = new Set(prev);
      for (const id of ids) {
        if (completed) next.add(id);
        else next.delete(id);
      }
      return next;
    });
  };

  // Drive Sync Modal & cross-module navigation helpers
  const [syncModalOpen, setSyncModalOpen] = useState(false);
  const [driveUrl, setDriveUrl] = useState(COURSE_METADATA.defaultDriveUrl);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  const [selectedFolder, setSelectedFolder] = useState<'ALL' | DriveFolderName>('ALL');
  const [activeCalcTab, setActiveCalcTab] = useState<CalculatorTab>('base-ieee');

  const handleApplySyncResult = (result: SyncExtractionResult) => {
    if (result.extractedUnits?.length > 0) {
      setTrackBUnits((prev) => {
        const updated = [...prev];
        for (const ext of result.extractedUnits) {
          const matchIdx = updated.findIndex(
            (u) => u.unitNumber.toLowerCase() === ext.unitNumber.toLowerCase()
          );
          if (matchIdx >= 0) {
            updated[matchIdx] = {
              ...updated[matchIdx],
              title: ext.title || updated[matchIdx].title,
              topics: ext.topics?.length ? ext.topics : updated[matchIdx].topics,
              mappedCOs: ext.mappedCOs?.length ? ext.mappedCOs : updated[matchIdx].mappedCOs,
            };
          } else {
            updated.push({
              id: `synced-${ext.unitNumber}-${Date.now()}`,
              unitNumber: ext.unitNumber,
              title: ext.title,
              track: 'track-b',
              mappedCOs: ext.mappedCOs?.length ? ext.mappedCOs : ['CO1'],
              hours: 10,
              topics: ext.topics || [],
              keyOutcomes: ['Synced from Drive repository analysis'],
            });
          }
        }
        return updated;
      });
    }

    if (result.extractedLectures?.length > 0) {
      setLectures((prev) => {
        const next = [...prev];
        for (const ext of result.extractedLectures) {
          const idx = next.findIndex((l) => l.lectureNumber === ext.lectureNumber);
          if (idx >= 0) {
            next[idx] = {
              ...next[idx],
              topic: ext.topic || next[idx].topic,
              unit: ext.unit || next[idx].unit,
              co: ext.co || next[idx].co,
              teachingAid: ext.teachingAid || next[idx].teachingAid,
            };
          }
        }
        return next;
      });
    }

    if (result.extractedQuestions?.length > 0) {
      const normalized: PracticeQuestion[] = result.extractedQuestions.map((q, idx) => ({
        ...q,
        id: `sync-q-${Date.now()}-${idx}`,
        isAiGenerated: true,
      }));
      setQuestions((prev) => [...normalized, ...prev]);
    }

    const now = new Date();
    setLastSyncedAt(
      now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    );
  };

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900 dark:bg-[#0f172a] dark:text-slate-100">
      <SidebarNav
        activeSection={activeSection}
        onSelectSection={setActiveSection}
        completedCount={completedLectureIds.size}
        totalLectures={lectures.length}
        mobileOpen={mobileNavOpen}
        onCloseMobile={() => setMobileNavOpen(false)}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        <HeaderBar
          isDark={isDark}
          onToggleTheme={() => setIsDark((prev) => !prev)}
          onOpenDriveSync={() => setSyncModalOpen(true)}
          onOpenMobileNav={() => setMobileNavOpen(true)}
          driveUrl={driveUrl}
          onDriveUrlChange={setDriveUrl}
          lastSyncedAt={lastSyncedAt}
        />

        <main className="flex-1 w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {activeSection === 'syllabus' && (
            <SyllabusExplorer
              trackBUnits={trackBUnits}
              trackAUnits={TRACK_A_UNITS}
              crosswalkRows={CROSSWALK_ROWS}
              onOpenFolder={(folder) => {
                setSelectedFolder(folder);
                setActiveSection('repository');
              }}
              onOpenTool={(tool) => {
                setActiveCalcTab(tool);
                setActiveSection('calculators');
              }}
            />
          )}

          {activeSection === 'lectures' && (
            <LectureTracker
              lectures={lectures}
              completedIds={completedLectureIds}
              onToggleLecture={handleToggleLecture}
              onBatchSetCompleted={handleBatchSetCompleted}
            />
          )}

          {activeSection === 'repository' && (
            <DriveRepository
              files={DRIVE_FILES}
              selectedFolder={selectedFolder}
              onSelectFolder={setSelectedFolder}
            />
          )}

          {activeSection === 'calculators' && (
            <HardwareCalculators
              activeTab={activeCalcTab}
              onSelectTab={setActiveCalcTab}
            />
          )}

          {activeSection === 'nba-quiz' && (
            <NbaQuizArena
              matrixRows={NBA_MATRIX}
              questions={questions}
              onAddQuestion={(q) => setQuestions((prev) => [q, ...prev])}
            />
          )}
        </main>
      </div>

      <DriveSyncModal
        isOpen={syncModalOpen}
        onClose={() => setSyncModalOpen(false)}
        driveUrl={driveUrl}
        onDriveUrlChange={setDriveUrl}
        onApplySyncResult={handleApplySyncResult}
      />
    </div>
  );
}
