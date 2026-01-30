
import { Student, TimetableRow, AppEvent, EventType, EventCategory, TagOption, ChipGroup } from './types';

export const STUDENTS_DATA: Student[] = [
  { student_id: '8B03_015', full_name: 'Nguyễn Văn Kiên', class_code: '8B03', aliases: 'Kiên|Kien', gender: 'M', dob: '2012-03-18', status: 'ACTIVE', profile_note: 'hay nói leo', updated_at: '2026-01-22T09:00:00+07:00' },
  { student_id: '8B03_016', full_name: 'Trần Thị Hà', class_code: '8B03', aliases: 'Hà|Ha', gender: 'F', dob: '2012-11-02', status: 'ACTIVE', profile_note: 'quên đồ hay gặp', updated_at: '2026-01-22T09:00:00+07:00' },
  { student_id: '8B03_017', full_name: 'Nguyễn Văn Nam', class_code: '8B03', aliases: 'Nam', gender: 'M', dob: '2012-07-09', status: 'ACTIVE', profile_note: '', updated_at: '2026-01-22T09:00:00+07:00' },
  { student_id: '8B03_018', full_name: 'Lê Minh', class_code: '8B03', aliases: 'Minh', gender: 'M', dob: '2012-01-26', status: 'ACTIVE', profile_note: 'tích cực', updated_at: '2026-01-22T09:00:00+07:00' },
  { student_id: '8B03_019', full_name: 'Nguyễn Văn Tuấn', class_code: '8B03', aliases: 'Tuấn|Tuan', gender: 'M', dob: '2012-05-14', status: 'ACTIVE', profile_note: '', updated_at: '2026-01-22T09:00:00+07:00' },
  { student_id: '8B03_020', full_name: 'Nguyễn Văn Tuấn', class_code: '8B03', aliases: 'Tuấn|Tuan', gender: 'M', dob: '2012-10-27', status: 'ACTIVE', profile_note: '(trùng tên)', updated_at: '2026-01-22T09:00:00+07:00' },
  { student_id: '6A03_001', full_name: 'Phạm Quang Huy', class_code: '6A03', aliases: 'Huy', gender: 'M', dob: '2013-09-30', status: 'ACTIVE', profile_note: '', updated_at: '2026-01-22T09:00:00+07:00' },
  { student_id: '6A03_002', full_name: 'Nguyễn Thị Mai', class_code: '6A03', aliases: 'Mai', gender: 'F', dob: '2013-12-12', status: 'ACTIVE', profile_note: '', updated_at: '2026-01-22T09:00:00+07:00' },
];

export const TIMETABLE_DATA: TimetableRow[] = [
  { timetable_id: '2026W04', effective_from: '2026-01-19', effective_to: '2026-05-31', day_of_week: 2, period: 1, start_time: '07:40', end_time: '08:25', subject: 'KHTN-Lí', class_code: '8B03', room: 'N405', teacher_id: 'hieu@school.vn', teacher_name: 'Hieu', raw_cell_text: 'KHTN-Lí - 8B03 [N405]', created_at: '2026-01-18T20:00:00+07:00' },
  { timetable_id: '2026W04', effective_from: '2026-01-19', effective_to: '2026-05-31', day_of_week: 2, period: 2, start_time: '08:30', end_time: '09:15', subject: 'KHTN-Lí', class_code: '8B03', room: 'N405', teacher_id: 'hieu@school.vn', teacher_name: 'Hieu', raw_cell_text: 'KHTN-Lí - 8B03 [N405]', created_at: '2026-01-18T20:00:00+07:00' },
  { timetable_id: '2026W04', effective_from: '2026-01-19', effective_to: '2026-05-31', day_of_week: 2, period: 4, start_time: '10:20', end_time: '11:05', subject: 'Công nghệ', class_code: '6A03', room: 'N208', teacher_id: 'hieu@school.vn', teacher_name: 'Hieu', raw_cell_text: 'Công nghệ - 6A03 [N208]', created_at: '2026-01-18T20:00:00+07:00' },
  { timetable_id: '2026W04', effective_from: '2026-01-19', effective_to: '2026-05-31', day_of_week: 3, period: 1, start_time: '07:40', end_time: '08:25', subject: 'KHTN-Lí', class_code: '6A03', room: 'N208', teacher_id: 'hieu@school.vn', teacher_name: 'Hieu', raw_cell_text: 'KHTN-Lí - 6A03 [N208]', created_at: '2026-01-18T20:00:00+07:00' },
  { timetable_id: '2026W04', effective_from: '2026-01-19', effective_to: '2026-05-31', day_of_week: 3, period: 2, start_time: '08:30', end_time: '09:15', subject: 'KHTN-Lí', class_code: '6A03', room: 'N208', teacher_id: 'hieu@school.vn', teacher_name: 'Hieu', raw_cell_text: 'KHTN-Lí - 6A03 [N208]', created_at: '2026-01-18T20:00:00+07:00' },
  { timetable_id: '2026W04', effective_from: '2026-01-19', effective_to: '2026-05-31', day_of_week: 4, period: 6, start_time: '13:35', end_time: '14:15', subject: 'KHTN-Lí', class_code: '8B03', room: 'N405', teacher_id: 'hieu@school.vn', teacher_name: 'Hieu', raw_cell_text: 'KHTN-Lí - 8B03 [N405]', created_at: '2026-01-18T20:00:00+07:00' },
  { timetable_id: '2026W04', effective_from: '2026-01-19', effective_to: '2026-05-31', day_of_week: 4, period: 7, start_time: '14:20', end_time: '15:00', subject: 'KHTN-Lí', class_code: '8B03', room: 'N405', teacher_id: 'hieu@school.vn', teacher_name: 'Hieu', raw_cell_text: 'KHTN-Lí - 8B03 [N405]', created_at: '2026-01-18T20:00:00+07:00' },
  { timetable_id: '2026W04', effective_from: '2026-01-19', effective_to: '2026-05-31', day_of_week: 5, period: 2, start_time: '08:30', end_time: '09:15', subject: 'KHTN-Lí', class_code: '8B03', room: 'N405', teacher_id: 'hieu@school.vn', teacher_name: 'Hieu', raw_cell_text: 'KHTN-Lí - 8B03 [N405]', created_at: '2026-01-30T09:00:00+07:00' },
  { timetable_id: '2026W04', effective_from: '2026-01-19', effective_to: '2026-05-31', day_of_week: 5, period: 4, start_time: '10:20', end_time: '11:05', subject: 'Công nghệ', class_code: '6A03', room: 'N208', teacher_id: 'hieu@school.vn', teacher_name: 'Hieu', raw_cell_text: 'Công nghệ - 6A03 [N208]', created_at: '2026-01-18T20:00:00+07:00' },
  { timetable_id: '2026W04', effective_from: '2026-01-19', effective_to: '2026-05-31', day_of_week: 5, period: 6, start_time: '13:35', end_time: '14:15', subject: 'KHTN-Lí', class_code: '8B03', room: 'N405', teacher_id: 'hieu@school.vn', teacher_name: 'Hieu', raw_cell_text: 'KHTN-Lí - 8B03 [N405]', created_at: '2026-01-18T20:00:00+07:00' },
  { timetable_id: '2026W04', effective_from: '2026-01-19', effective_to: '2026-05-31', day_of_week: 6, period: 2, start_time: '08:30', end_time: '09:15', subject: 'KHTN-Lí', class_code: '6A03', room: 'N208', teacher_id: 'hieu@school.vn', teacher_name: 'Hieu', raw_cell_text: 'KHTN-Lí - 6A03 [N208]', created_at: '2026-01-18T20:00:00+07:00' },
];

export const EVENTS_DATA: AppEvent[] = [
  { event_id: 'e-0001', timestamp: '2026-01-22T07:44:12+07:00', date: '2026-01-22', time: '07:44:12', month_key: '2026-01', week_key: '2026-W04', semester_key: '2025-2026_HK2', school_year: '2025-2026', teacher_id: 'hieu@school.vn', teacher_name: 'Hieu', role: 'GVBM', class_code: '8B03', subject: 'KHTN-Lí', room: 'N405', period: 1, day_of_week: 5, scope: 'STUDENT', student_id: '8B03_015', student_name_snapshot: 'Nguyễn Văn Kiên', type: EventType.VIOLATION, category: EventCategory.DISCIPLINE, tags: 'Nói leo', points: -1, severity: 2, raw_text: 'Kiên nói leo', source: 'voice', confidence: 0.92, is_tentative: false, created_at: '2026-01-22T07:44:12+07:00', updated_at: '2026-01-22T07:44:12+07:00', synced: true },
  { event_id: 'e-0002', timestamp: '2026-01-22T07:46:05+07:00', date: '2026-01-22', time: '07:46:05', month_key: '2026-01', week_key: '2026-W04', semester_key: '2025-2026_HK2', school_year: '2025-2026', teacher_id: 'hieu@school.vn', teacher_name: 'Hieu', role: 'GVBM', class_code: '8B03', subject: 'KHTN-Lí', room: 'N405', period: 1, day_of_week: 5, scope: 'STUDENT', student_id: '8B03_016', student_name_snapshot: 'Trần Thị Hà', type: EventType.VIOLATION, category: EventCategory.HOMEWORK, tags: 'Quên vở', points: -1, severity: 1, raw_text: 'Hà quên vở', source: 'tap', confidence: 1, is_tentative: false, created_at: '2026-01-22T07:46:05+07:00', updated_at: '2026-01-22T07:46:05+07:00', synced: true },
  { event_id: 'e-0003', timestamp: '2026-01-22T07:49:40+07:00', date: '2026-01-22', time: '07:49:40', month_key: '2026-01', week_key: '2026-W04', semester_key: '2025-2026_HK2', school_year: '2025-2026', teacher_id: 'hieu@school.vn', teacher_name: 'Hieu', role: 'GVBM', class_code: '8B03', subject: 'KHTN-Lí', room: 'N405', period: 1, day_of_week: 5, scope: 'STUDENT', student_id: '8B03_018', student_name_snapshot: 'Lê Minh', type: EventType.PRAISE, category: EventCategory.OTHER, tags: 'Tích cực', points: 1, severity: 1, raw_text: 'Khen Minh tích cực', source: 'voice', confidence: 0.96, is_tentative: false, created_at: '2026-01-22T07:49:40+07:00', updated_at: '2026-01-22T07:49:40+07:00', synced: true },
  { event_id: 'e-0004', timestamp: '2026-01-22T07:55:11+07:00', date: '2026-01-22', time: '07:55:11', month_key: '2026-01', week_key: '2026-W04', semester_key: '2025-2026_HK2', school_year: '2025-2026', teacher_id: 'hieu@school.vn', teacher_name: 'Hieu', role: 'GVBM', class_code: '8B03', subject: 'KHTN-Lí', room: 'N405', period: 1, day_of_week: 5, scope: 'STUDENT', student_id: '8B03_017', student_name_snapshot: 'Nguyễn Văn Nam', type: EventType.VIOLATION, category: EventCategory.DISCIPLINE, tags: 'Nói chuyện riêng', points: -1, severity: 1, raw_text: 'Nam nói chuyện riêng', source: 'tap', confidence: 1, is_tentative: false, created_at: '2026-01-22T07:55:11+07:00', updated_at: '2026-01-22T07:55:11+07:00', synced: true },
  { event_id: 'e-0005', timestamp: '2026-01-22T08:02:30+07:00', date: '2026-01-22', time: '08:02:30', month_key: '2026-01', week_key: '2026-W04', semester_key: '2025-2026_HK2', school_year: '2025-2026', teacher_id: 'hieu@school.vn', teacher_name: 'Hieu', role: 'GVCN', class_code: '8B03', subject: '', room: '', period: 4, day_of_week: 5, scope: 'CLASS', student_id: '', student_name_snapshot: '', type: EventType.VIOLATION, category: EventCategory.APPEARANCE, tags: 'Không đồng phục', points: -1, severity: 1, raw_text: 'Lớp 8B03: 2 bạn không đồng phục', source: 'text', confidence: 1, is_tentative: false, created_at: '2026-01-22T08:02:30+07:00', updated_at: '2026-01-22T08:02:30+07:00', synced: true },
  { event_id: 'e-0006', timestamp: '2026-01-22T08:04:10+07:00', date: '2026-01-22', time: '08:04:10', month_key: '2026-01', week_key: '2026-W04', semester_key: '2025-2026_HK2', school_year: '2025-2026', teacher_id: 'hieu@school.vn', teacher_name: 'Hieu', role: 'GVCN', class_code: '8B03', subject: '', room: '', period: 4, day_of_week: 5, scope: 'STUDENT', student_id: '8B03_019', student_name_snapshot: 'Nguyễn Văn Tuấn', type: EventType.VIOLATION, category: EventCategory.DUTY, tags: 'Quên trực nhật', points: -1, severity: 1, raw_text: 'Tuấn quên trực nhật', source: 'tap', confidence: 1, is_tentative: false, created_at: '2026-01-22T08:04:10+07:00', updated_at: '2026-01-22T08:04:10+07:00', synced: true },
  { event_id: 'e-0007', timestamp: '2026-01-22T08:05:02+07:00', date: '2026-01-22', time: '08:05:02', month_key: '2026-01', week_key: '2026-W04', semester_key: '2025-2026_HK2', school_year: '2025-2026', teacher_id: 'hieu@school.vn', teacher_name: 'Hieu', role: 'GVCN', class_code: '8B03', subject: '', room: '', period: 4, day_of_week: 5, scope: 'STUDENT', student_id: '8B03_020', student_name_snapshot: 'Nguyễn Văn Tuấn', type: EventType.VIOLATION, category: EventCategory.APPEARANCE, tags: 'Không đeo cà vạt', points: -1, severity: 1, raw_text: 'Tuấn không đeo cà vạt', source: 'tap', confidence: 1, is_tentative: false, created_at: '2026-01-22T08:05:02+07:00', updated_at: '2026-01-22T08:05:02+07:00', synced: true },
  { event_id: 'e-0010', timestamp: '2026-01-23T10:21:05+07:00', date: '2026-01-23', time: '10:21:05', month_key: '2026-01', week_key: '2026-W04', semester_key: '2025-2026_HK2', school_year: '2025-2026', teacher_id: 'hieu@school.vn', teacher_name: 'Hieu', role: 'GVBM', class_code: '6A03', subject: 'Công nghệ', room: 'N208', period: 4, day_of_week: 6, scope: 'STUDENT', student_id: '6A03_001', student_name_snapshot: 'Phạm Quang Huy', type: EventType.VIOLATION, category: EventCategory.DISCIPLINE, tags: 'Làm việc riêng', points: -1, severity: 1, raw_text: 'Huy làm việc riêng', source: 'tap', confidence: 1, is_tentative: false, created_at: '2026-01-23T10:21:05+07:00', updated_at: '2026-01-23T10:21:05+07:00', synced: true },
  { event_id: 'e-0011', timestamp: '2026-01-24T08:34:22+07:00', date: '2026-01-24', time: '08:34:22', month_key: '2026-01', week_key: '2026-W04', semester_key: '2025-2026_HK2', school_year: '2025-2026', teacher_id: 'hieu@school.vn', teacher_name: 'Hieu', role: 'GVCN', class_code: '8B03', subject: '', room: '', period: 6, day_of_week: 7, scope: 'STUDENT', student_id: '8B03_015', student_name_snapshot: 'Nguyễn Văn Kiên', type: EventType.VIOLATION, category: EventCategory.APPEARANCE, tags: 'Không đồng phục', points: -1, severity: 1, raw_text: 'Kiên không đeo khăn đỏ', source: 'tap', confidence: 1, is_tentative: false, created_at: '2026-01-24T08:34:22+07:00', updated_at: '2026-01-24T08:34:22+07:00', synced: true },
  { event_id: 'e-0012', timestamp: '2026-01-24T08:36:10+07:00', date: '2026-01-24', time: '08:36:10', month_key: '2026-01', week_key: '2026-W04', semester_key: '2025-2026_HK2', school_year: '2025-2026', teacher_id: 'hieu@school.vn', teacher_name: 'Hieu', role: 'GVCN', class_code: '8B03', subject: '', room: '', period: 6, day_of_week: 7, scope: 'STUDENT', student_id: '8B03_016', student_name_snapshot: 'Trần Thị Hà', type: EventType.PRAISE, category: EventCategory.OTHER, tags: 'Gương mẫu', points: 1, severity: 1, raw_text: 'Hà gương mẫu', source: 'tap', confidence: 1, is_tentative: false, created_at: '2026-01-24T08:36:10+07:00', updated_at: '2026-01-24T08:36:10+07:00', synced: true },
];

export const DEFAULT_CHIP_GROUPS: ChipGroup[] = [
  {
    id: 'g-gvbm-discipline',
    name: 'Ý thức (GVBM)',
    chips: [
      { id: 't-d1', label: 'Nói chuyện riêng', type: EventType.VIOLATION, category: EventCategory.DISCIPLINE, points: -1, color: 'bg-red-100 text-red-800' },
      { id: 't-d2', label: 'Nói leo', type: EventType.VIOLATION, category: EventCategory.DISCIPLINE, points: -1, color: 'bg-red-100 text-red-800' },
      { id: 't-d3', label: 'Làm việc riêng', type: EventType.VIOLATION, category: EventCategory.DISCIPLINE, points: -1, color: 'bg-red-100 text-red-800' },
      { id: 't-d4', label: 'Mất trật tự', type: EventType.VIOLATION, category: EventCategory.DISCIPLINE, points: -1, color: 'bg-red-100 text-red-800' },
      { id: 't-d5', label: 'Không tập trung', type: EventType.VIOLATION, category: EventCategory.DISCIPLINE, points: -1, color: 'bg-red-100 text-red-800' },
      { id: 't-d6', label: 'Hay cãi / bướng', type: EventType.VIOLATION, category: EventCategory.DISCIPLINE, points: -1, color: 'bg-red-100 text-red-800' },
      { id: 't-d7', label: 'Ngủ gật', type: EventType.VIOLATION, category: EventCategory.DISCIPLINE, points: -1, color: 'bg-red-100 text-red-800' },
      { id: 't-d8', label: 'Dùng điện thoại', type: EventType.VIOLATION, category: EventCategory.DISCIPLINE, points: -1, color: 'bg-red-100 text-red-800' },
      { id: 't-d9', label: 'Ra khỏi chỗ', type: EventType.VIOLATION, category: EventCategory.DISCIPLINE, points: -1, color: 'bg-red-100 text-red-800' },
    ]
  },
  {
    id: 'g-gvbm-homework',
    name: 'Vở & Bài (GVBM)',
    chips: [
      { id: 't-hw1', label: 'Quên vở', type: EventType.VIOLATION, category: EventCategory.HOMEWORK, points: -1, color: 'bg-orange-100 text-orange-800' },
      { id: 't-hw2', label: 'Chưa ghi bài', type: EventType.VIOLATION, category: EventCategory.HOMEWORK, points: -1, color: 'bg-orange-100 text-orange-800' },
      { id: 't-hw3', label: 'Ghi bài thiếu', type: EventType.VIOLATION, category: EventCategory.HOMEWORK, points: -1, color: 'bg-orange-100 text-orange-800' },
      { id: 't-hw4', label: 'Không làm bài', type: EventType.VIOLATION, category: EventCategory.HOMEWORK, points: -1, color: 'bg-orange-100 text-orange-800' },
      { id: 't-hw5', label: 'Làm bài thiếu', type: EventType.VIOLATION, category: EventCategory.HOMEWORK, points: -1, color: 'bg-orange-100 text-orange-800' },
      { id: 't-hw6', label: 'Nộp muộn', type: EventType.VIOLATION, category: EventCategory.HOMEWORK, points: -1, color: 'bg-orange-100 text-orange-800' },
      { id: 't-hw7', label: 'Thiếu dụng cụ', type: EventType.VIOLATION, category: EventCategory.HOMEWORK, points: -1, color: 'bg-orange-100 text-orange-800' },
      { id: 't-hw8', label: 'Đủ vở & bài', type: EventType.PRAISE, category: EventCategory.HOMEWORK, points: 1, color: 'bg-blue-100 text-blue-800' },
    ]
  },
  {
    id: 'g-gvbm-praise',
    name: 'Khen thưởng (GVBM)',
    chips: [
      { id: 't-p1', label: 'Tích cực', type: EventType.PRAISE, category: EventCategory.OTHER, points: 1, color: 'bg-green-100 text-green-800' },
      { id: 't-p2', label: 'Phát biểu tốt', type: EventType.PRAISE, category: EventCategory.OTHER, points: 1, color: 'bg-green-100 text-green-800' },
      { id: 't-p3', label: 'Làm bài tốt', type: EventType.PRAISE, category: EventCategory.OTHER, points: 1, color: 'bg-green-100 text-green-800' },
      { id: 't-p4', label: 'Hoàn thành nhanh', type: EventType.PRAISE, category: EventCategory.OTHER, points: 1, color: 'bg-green-100 text-green-800' },
      { id: 't-p5', label: 'Gương mẫu', type: EventType.PRAISE, category: EventCategory.OTHER, points: 1, color: 'bg-green-100 text-green-800' },
      { id: 't-p6', label: 'Hỗ trợ bạn', type: EventType.PRAISE, category: EventCategory.OTHER, points: 1, color: 'bg-green-100 text-green-800' },
      { id: 't-p7', label: 'Sáng tạo', type: EventType.PRAISE, category: EventCategory.OTHER, points: 1, color: 'bg-green-100 text-green-800' },
    ]
  },
  {
    id: 'g-gvcn-appearance',
    name: 'Nề nếp (GVCN)',
    chips: [
      { id: 't-ap1', label: 'Đi muộn', type: EventType.VIOLATION, category: EventCategory.APPEARANCE, points: -1, color: 'bg-yellow-100 text-yellow-800' },
      { id: 't-ap2', label: 'Không đồng phục', type: EventType.VIOLATION, category: EventCategory.APPEARANCE, points: -1, color: 'bg-yellow-100 text-yellow-800' },
      { id: 't-ap3', label: 'Không khăn đỏ', type: EventType.VIOLATION, category: EventCategory.APPEARANCE, points: -1, color: 'bg-yellow-100 text-yellow-800' },
      { id: 't-ap4', label: 'Không cà vạt', type: EventType.VIOLATION, category: EventCategory.APPEARANCE, points: -1, color: 'bg-yellow-100 text-yellow-800' },
      { id: 't-ap5', label: 'Không bảng tên', type: EventType.VIOLATION, category: EventCategory.APPEARANCE, points: -1, color: 'bg-yellow-100 text-yellow-800' },
      { id: 't-ap6', label: 'Tóc sai quy định', type: EventType.VIOLATION, category: EventCategory.APPEARANCE, points: -1, color: 'bg-yellow-100 text-yellow-800' },
      { id: 't-ap7', label: 'Giày dép sai', type: EventType.VIOLATION, category: EventCategory.APPEARANCE, points: -1, color: 'bg-yellow-100 text-yellow-800' },
    ]
  },
  {
    id: 'g-gvcn-duty',
    name: 'Trực nhật (GVCN)',
    chips: [
      { id: 't-du1', label: 'Quên trực nhật', type: EventType.VIOLATION, category: EventCategory.DUTY, points: -1, color: 'bg-purple-100 text-purple-800' },
      { id: 't-du2', label: 'Lau bảng', type: EventType.NOTE, category: EventCategory.DUTY, points: 0, color: 'bg-gray-100 text-gray-800' },
      { id: 't-du3', label: 'Quét sàn', type: EventType.NOTE, category: EventCategory.DUTY, points: 0, color: 'bg-gray-100 text-gray-800' },
      { id: 't-du4', label: 'Đổ rác', type: EventType.NOTE, category: EventCategory.DUTY, points: 0, color: 'bg-gray-100 text-gray-800' },
      { id: 't-du5', label: 'Tắt điện', type: EventType.NOTE, category: EventCategory.DUTY, points: 0, color: 'bg-gray-100 text-gray-800' },
    ]
  },
  {
    id: 'g-note',
    name: 'Nhắc nhở',
    chips: [
      { id: 't-n1', label: 'Nhắc nhở nhẹ', type: EventType.NOTE, category: EventCategory.OTHER, points: 0, color: 'bg-gray-100 text-gray-600' },
      { id: 't-n2', label: 'Nhắc lần 2', type: EventType.NOTE, category: EventCategory.OTHER, points: 0, color: 'bg-gray-100 text-gray-600' },
      { id: 't-n3', label: 'Gặp riêng', type: EventType.NOTE, category: EventCategory.OTHER, points: 0, color: 'bg-gray-100 text-gray-600' },
    ]
  }
];

export const getUniqueName = (student: Student, allStudents: Student[]) => {
  const duplicates = allStudents.filter(s => s.full_name === student.full_name);
  if (duplicates.length > 1 && student.dob) {
    // Show DD/MM if available
    const datePart = student.dob.split('-').slice(1).reverse().join('/');
    return `${student.full_name} (${datePart})`;
  }
  return student.full_name;
};
