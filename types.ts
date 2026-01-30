
export enum StudentStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE'
}

export enum Gender {
  M = 'M',
  F = 'F'
}

export interface Student {
  student_id: string;
  full_name: string;
  class_code: string;
  aliases: string;
  gender: Gender | string;
  dob?: string;
  photo_url?: string;
  status: StudentStatus | string;
  profile_note?: string;
  updated_at: string;
}

export interface TimetableRow {
  timetable_id: string;
  effective_from: string;
  effective_to: string;
  day_of_week: number; // 2 (Mon) to 8 (Sun) usually, or 0-6. User data uses 2-6.
  period: number;
  start_time: string;
  end_time: string;
  subject: string;
  class_code: string;
  room: string;
  teacher_id?: string;
  teacher_name?: string;
  raw_cell_text: string;
  created_at: string;
}

export enum EventType {
  PRAISE = 'PRAISE',
  VIOLATION = 'VIOLATION',
  NOTE = 'NOTE'
}

export enum EventCategory {
  DISCIPLINE = 'DISCIPLINE',
  APPEARANCE = 'APPEARANCE',
  HOMEWORK = 'HOMEWORK',
  DUTY = 'DUTY',
  OTHER = 'OTHER'
}

export interface AppEvent {
  event_id: string;
  timestamp: string;
  date: string;
  time: string;
  month_key: string;
  week_key: string;
  semester_key: string;
  school_year: string;
  teacher_id: string;
  teacher_name: string;
  role: 'GVBM' | 'GVCN';
  class_code: string;
  subject?: string;
  room?: string;
  period?: number;
  day_of_week: number;
  scope: 'STUDENT' | 'CLASS';
  student_id?: string;
  student_name_snapshot?: string;
  type: EventType | string;
  category: EventCategory | string;
  tags: string;
  points?: number;
  severity?: number;
  raw_text: string;
  source: 'tap' | 'text' | 'voice';
  confidence?: number;
  is_tentative: boolean;
  created_at: string;
  updated_at: string;
  synced?: boolean; // New: Track sync status
}

export interface TagOption {
  id: string;
  label: string;
  type: EventType;
  category: EventCategory;
  points: number;
  color: string;
}

export interface ChipGroup {
  id: string;
  name: string;
  chips: TagOption[];
}

export interface SheetConfig {
  appsScriptUrl: string;          // URL Web App Apps Script (.../exec)
  appsScriptToken?: string;       // (Tùy chọn) mã bảo vệ nếu bạn đặt trong Script Properties
  studentSheetName: string;       // mặc định: Students
  timetableSheetName: string;     // mặc định: Timetable
  eventSheetName: string;         // mặc định: Events
  lastSyncedAt: string | null;
}

export interface UserProfile {
  teacherName: string;
  teacherEmail: string;
  homeroomClass: string;
  uiScale?: number; // New: UI Scaling factor (percentage, e.g., 100, 90, 80)
}

export interface DutyRoster {
  day_of_week: number;
  // Map task name to list of student IDs. e.g. { "Sweeping": ["id1", "id2"], "Board": ["id3"] }
  assignments: Record<string, string[]>;
}

// New: Wrap DutyRoster in a weekly schedule container
export interface DutySchedule {
  week_key: string; // e.g., "2026-W04"
  roster: DutyRoster[];
}

export interface GoogleAuthUser {
  accessToken: string;
  email: string;
  name: string;
  picture: string;
}
