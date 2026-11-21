export type NavSection =
  | 'syllabus'
  | 'lectures'
  | 'repository'
  | 'calculators'
  | 'nba-quiz';

export type SyllabusTrack = 'track-b' | 'track-a' | 'unified';

export type CourseOutcome = 'CO1' | 'CO2' | 'CO3' | 'CO4' | 'CO5';

export type BloomLevel = 'BTL1' | 'BTL2' | 'BTL3' | 'BTL4' | 'BTL5';

export interface SyllabusUnit {
  id: string;
  unitNumber: string;
  title: string;
  track: 'track-a' | 'track-b';
  lectureRange?: string;
  mappedCOs: CourseOutcome[];
  hours: number;
  topics: string[];
  keyOutcomes: string[];
  linkedFolder?: string;
  linkedTool?: 'base-ieee' | 'hamming' | 'arithmetic' | 'cache-ea';
}

export interface CrosswalkRow {
  conceptGroup: string;
  trackBUnit: string;
  trackBTopics: string;
  trackAUnit: string;
  trackALectures: string;
  mappedCO: CourseOutcome;
}

export interface LecturePlanItem {
  id: string;
  lectureNumber: number;
  week: number;
  date: string;
  unit: string;
  co: CourseOutcome;
  topic: string;
  trackBRef: string;
  teachingAid: string;
}

export type DriveFileType = 'PPTX' | 'DOCX' | 'PDF' | 'Sheet';

export type DriveFolderName =
  | 'Root'
  | 'CSM'
  | 'CSM_AIML_2026'
  | 'DECO_U1'
  | 'DECO_U2'
  | 'DECO_U3'
  | 'DECO_U4'
  | 'DECO_U5';

export interface DriveResourceFile {
  id: string;
  name: string;
  folder: DriveFolderName;
  type: DriveFileType;
  category: 'Lecture Slides' | 'Solved Assessments & Keys' | 'Syllabus & Mapping';
  unitRef: string;
  coRef: CourseOutcome[];
  summary: string;
  highlights: string[];
  slideOrPageCount: string;
}

export interface NbaMatrixRow {
  co: CourseOutcome;
  description: string;
  btl: BloomLevel;
  po: Record<
    | 'PO1'
    | 'PO2'
    | 'PO3'
    | 'PO4'
    | 'PO5'
    | 'PO6'
    | 'PO7'
    | 'PO8'
    | 'PO9'
    | 'PO10'
    | 'PO11'
    | 'PO12',
    number | null
  >;
  pso: {
    PSO1: number | null;
    PSO2: number | null;
  };
}

export interface PracticeQuestion {
  id: string;
  unit: 'Unit I' | 'Unit II' | 'Unit III' | 'Unit IV' | 'Unit V';
  co: CourseOutcome;
  btl: BloomLevel;
  source: string;
  marks: number;
  question: string;
  options?: string[];
  correctOptionIndex?: number;
  solutionSteps: string[];
  finalAnswer: string;
  isAiGenerated?: boolean;
}

export interface SyncExtractionResult {
  sourceSummary: string;
  extractedUnits: Array<{
    unitNumber: string;
    title: string;
    topics: string[];
    mappedCOs: CourseOutcome[];
  }>;
  extractedLectures: Array<{
    lectureNumber: number;
    topic: string;
    unit: string;
    co: CourseOutcome;
    teachingAid: string;
  }>;
  extractedQuestions: PracticeQuestion[];
}
