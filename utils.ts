
import { TimetableRow, Student, TagOption, EventType, EventCategory } from './types';
import { getUniqueName } from './constants';

export const getLocalDateKey = (d: Date = new Date()): string => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

export const getAppDayOfWeekFromDateKey = (dateKey: string): number => {
  // returns 2..8 (2=Mon ... 7=Sat, 8=Sun)
  const [y, m, d] = dateKey.split('-').map(Number);
  const dt = new Date(y, (m || 1) - 1, d || 1);
  const js = dt.getDay(); // 0=Sun
  return js === 0 ? 8 : js + 1;
};

export const getSlotForDateTime = (timetable: TimetableRow[], dateKey: string, minutesOfDay: number): TimetableRow | null => {
  const appDay = getAppDayOfWeekFromDateKey(dateKey);
  const activeTimetable = timetable.filter(t => {
  const fromOk = !t.effective_from || t.effective_from.trim() === '' || t.effective_from <= dateKey;
  const toOk = !t.effective_to || t.effective_to.trim() === '' || t.effective_to >= dateKey;
  return fromOk && toOk;
});
  const daySchedule = activeTimetable.filter(t => t.day_of_week === appDay);

  const slot = daySchedule.find(s => {
    const [sh, sm] = s.start_time.split(':').map(Number);
    const [eh, em] = s.end_time.split(':').map(Number);
    const st = sh * 60 + sm;
    const et = eh * 60 + em;
    return minutesOfDay >= st && minutesOfDay <= et;
  });

  return slot || null;
};

export const getSlotForDatePeriod = (timetable: TimetableRow[], dateKey: string, period: number): TimetableRow | null => {
  const appDay = getAppDayOfWeekFromDateKey(dateKey);
  const activeTimetable = timetable.filter(t => {
  const fromOk = !t.effective_from || t.effective_from.trim() === '' || t.effective_from <= dateKey;
  const toOk = !t.effective_to || t.effective_to.trim() === '' || t.effective_to >= dateKey;
  return fromOk && toOk;
});
  const daySchedule = activeTimetable.filter(t => t.day_of_week === appDay);
  return daySchedule.find(s => s.period === period) || null;
};

export const parseTimetableCell = (cellText: string): { subject: string; classCode: string; room: string } | null => {
  if (!cellText) return null;
  
  let room = '';
  let classCode = '';
  let subject = '';

  const roomMatch = cellText.match(/\[(.*?)\]/);
  if (roomMatch) {
    room = roomMatch[1];
  } else {
    const fallbackRoom = cellText.match(/(N\d+)/);
    if (fallbackRoom) room = fallbackRoom[1];
  }

  const classMatch = cellText.match(/\b\d{1,2}[A-Z]\d{1,3}\b/);
  if (classMatch) {
    classCode = classMatch[0];
  }

  let remaining = cellText;
  if (roomMatch) remaining = remaining.replace(roomMatch[0], '');
  if (classMatch) remaining = remaining.replace(classMatch[0], '');
  
  subject = remaining.replace(/^[-\s]+|[-\s]+$/g, '').trim();

  if (!classCode) return null; 

  return { subject, classCode, room };
};

// --- Time & Period Helpers ---

export const fetchNetworkTimeOffset = async (): Promise<number> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const start = Date.now();
    const response = await fetch('https://worldtimeapi.org/api/timezone/Asia/Ho_Chi_Minh', {
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error('Time server unavailable');
    }

    const data = await response.json();
    const end = Date.now();
    const networkTime = new Date(data.datetime).getTime() + (end - start) / 2;
    const deviceTime = Date.now();
    return networkTime - deviceTime;
  } catch (error) {
    return 0;
  }
};

export const getCurrentPeriodInfo = (timetable: TimetableRow[], now: Date = new Date()) => {
  const dateKey = getLocalDateKey(now);
  const minutes = now.getHours() * 60 + now.getMinutes();
  return getSlotForDateTime(timetable, dateKey, minutes);
};

export const formatTime = (isoString: string) => {
  if (!isoString) return '';
  const d = new Date(isoString);
  return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
};

export const formatDate = (isoString: string) => {
  if (!isoString) return '';
  const d = new Date(isoString);
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

// ISO 8601 Week Number
export const getWeekNumber = (d: Date) => {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(),0,1));
  const weekNo = Math.ceil(( ( (date.getTime() - yearStart.getTime()) / 86400000) + 1)/7);
  return weekNo;
};

export const getWeekKey = (d: Date) => {
  const y = d.getFullYear();
  const w = getWeekNumber(d);
  return `${y}-W${String(w).padStart(2, '0')}`;
};

// --- NEW: Calculate Date Range from Year + Week Number ---
export const getDateOfISOWeek = (w: number, y: number) => {
    const simple = new Date(y, 0, 1 + (w - 1) * 7);
    const dow = simple.getDay();
    const ISOweekStart = simple;
    if (dow <= 4)
        ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
    else
        ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
    return ISOweekStart;
};

export const getMondayOfWeek = (year: number, week: number) => {
    return getDateOfISOWeek(week, year);
};

export const getFridayOfWeek = (year: number, week: number) => {
    const monday = getDateOfISOWeek(week, year);
    const friday = new Date(monday);
    friday.setDate(monday.getDate() + 4); // Mon + 4 = Fri
    return friday;
};

export const getSaturdayOfWeek = (year: number, week: number) => {
    const monday = getDateOfISOWeek(week, year);
    const saturday = new Date(monday);
    saturday.setDate(monday.getDate() + 5); // Mon + 5 = Sat
    return saturday;
};

// --- Legacy helpers (kept for compatibility if needed, but preferred new logic above) ---
export const getStartOfWeek = (d: Date) => {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  return new Date(date.setDate(diff));
};

export const getEndOfWeek = (d: Date) => {
  const start = getStartOfWeek(d);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return end;
};

export const searchStudents = (query: string, students: Student[]) => {
  const q = query.toLowerCase();
  return students.filter(s => {
    const uniqueName = getUniqueName(s, students).toLowerCase();
    const aliases = s.aliases ? s.aliases.toLowerCase() : '';
    return uniqueName.includes(q) || aliases.includes(q) || s.class_code.toLowerCase().includes(q);
  });
};

export interface ParsedResult {
  matchType: 'EXACT' | 'AMBIGUOUS' | 'NONE' | 'MULTI'; 
  candidates: Student[]; 
  identifiedTag?: TagOption;
  contextOverride?: {
    classCode?: string;
    dayOfWeek?: number;
    date?: string;
  };
  rawText: string;
}

const TAG_SYNONYMS: Record<string, string[]> = {
  'Nói chuyện riêng': ['nói chuyện', 'nói nhiều', 'buôn chuyện', 'bàn tán'],
  'Nói leo': ['leo', 'nói tự do', 'thưa leo'],
  'Quên vở': ['vở', 'không vở', 'thiếu vở', 'quên sách'],
  'Không làm bài': ['không bài', 'chưa bài', 'thiếu bài', 'không làm', 'không làm bài tập'], // Fixed key to match constant label
  'Không đồng phục': ['đồng phục', 'áo sai', 'sai phục'],
  'Đi muộn': ['muộn', 'trễ', 'tới muộn'],
  'Tích cực': ['xung phong', 'giơ tay', 'phát biểu'],
  'Làm việc riêng': ['việc riêng', 'nghịch'],
  'Ngủ gật': ['ngủ', 'gục'],
};

const getDateFromDayOfWeek = (dayOfWeek: number): string | undefined => {
  const now = new Date();
  const currentDay = now.getDay() === 0 ? 8 : now.getDay() + 1;
  const diff = dayOfWeek - currentDay;
  const targetDate = new Date(now);
  targetDate.setDate(now.getDate() + diff);
  return targetDate.toISOString().split('T')[0];
};

export const parseNaturalLanguageInput = (
  text: string, 
  students: Student[],
  availableTags: TagOption[],
  currentClass: string
): ParsedResult => {
  let cleanText = text.trim();
  const lowerText = cleanText.toLowerCase();

  const contextOverride: ParsedResult['contextOverride'] = {};

  // 1. Detect Class Code Override
  const classMatch = cleanText.match(/\b(\d{1,2}[A-Z]\d{1,3})\b/i);
  if (classMatch) {
    contextOverride.classCode = classMatch[1].toUpperCase();
    cleanText = cleanText.replace(classMatch[0], '');
  }

  // 2a. Detect Day Override
  const dayMatch = lowerText.match(/thứ\s*(\d|hai|ba|tư|năm|sáu|bảy|chủ nhật)/i);
  if (dayMatch) {
    let day = 0;
    const dStr = dayMatch[1];
    if (dStr === 'hai' || dStr === '2') day = 2;
    else if (dStr === 'ba' || dStr === '3') day = 3;
    else if (dStr === 'tư' || dStr === '4') day = 4;
    else if (dStr === 'năm' || dStr === '5') day = 5;
    else if (dStr === 'sáu' || dStr === '6') day = 6;
    else if (dStr === 'bảy' || dStr === '7') day = 7;
    else if (dStr === 'chủ nhật' || dStr === '8') day = 8;
    
    if (day > 0) {
      contextOverride.dayOfWeek = day;
      contextOverride.date = getDateFromDayOfWeek(day);
      cleanText = cleanText.replace(dayMatch[0], ''); 
    }
  }

  // 2b. Detect Full Date Override
  const fullDateMatch = cleanText.match(/\b(\d{1,2})[-/](\d{1,2})[-/](\d{4})\b/);
  if (fullDateMatch) {
     const [_, d, m, y] = fullDateMatch;
     const isoDate = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
     contextOverride.date = isoDate;
     cleanText = cleanText.replace(fullDateMatch[0], '');
  }

  // 2c. Detect DOB Disambiguation (e.g. "Tuấn 14/5")
  // Regex looks for "DD/MM" or "DD-MM"
  const dobMatch = cleanText.match(/\b(\d{1,2})[./-](\d{1,2})\b/);
  let dobFilter: string | null = null;
  if (dobMatch) {
    // We store matched DOB part to filter candidates later
    // Format to match end of ISO string or just loose check
    dobFilter = `-${dobMatch[2].padStart(2, '0')}-${dobMatch[1].padStart(2, '0')}`; // -MM-DD
    // cleanText = cleanText.replace(dobMatch[0], ''); // Don't remove yet, might overlap
  }

  const targetClass = contextOverride.classCode || currentClass;
  const targetStudents = students.filter(s => s.class_code === targetClass);

  // 3. Identify Tag
  let identifiedTag: TagOption | undefined;
  const sortedTags = [...availableTags].sort((a, b) => b.label.length - a.label.length);

  for (const tag of sortedTags) {
    const matchLabel = cleanText.toLowerCase().includes(tag.label.toLowerCase());
    let matchSynonym = false;
    const synonyms = TAG_SYNONYMS[tag.label];
    if (synonyms) {
      matchSynonym = synonyms.some(syn => cleanText.toLowerCase().includes(syn));
    }

    if (matchLabel || matchSynonym) {
      identifiedTag = tag;
      const tagTextToRemove = matchLabel ? tag.label : synonyms?.find(syn => cleanText.toLowerCase().includes(syn)) || '';
      if (tagTextToRemove) {
          const reg = new RegExp(tagTextToRemove, 'gi');
          cleanText = cleanText.replace(reg, '');
      }
      break; 
    }
  }

  // 4. Identify Students
  let identifiedStudents: Student[] = [];
  const textForNameSearch = cleanText.replace(/[.,;]/g, ' ').toLowerCase();
  
  targetStudents.forEach(s => {
    let matched = false;
    if (textForNameSearch.includes(s.full_name.toLowerCase())) {
        matched = true;
    } 
    else if (s.aliases) {
        const aliases = s.aliases.toLowerCase().split('|');
        if (aliases.some(alias => new RegExp(`\\b${alias}\\b`).test(textForNameSearch))) {
            matched = true;
        }
    }
    
    if (matched) {
        identifiedStudents.push(s);
    }
  });

  // 5. Apply DOB Disambiguation
  if (identifiedStudents.length > 1 && dobFilter) {
    const dobFiltered = identifiedStudents.filter(s => s.dob && s.dob.endsWith(dobFilter!));
    if (dobFiltered.length > 0) {
      identifiedStudents = dobFiltered;
    }
  }

  // 6. Result
  let matchType: ParsedResult['matchType'] = 'NONE';
  if (identifiedStudents.length === 1) matchType = 'EXACT';
  else if (identifiedStudents.length > 1) matchType = 'MULTI';

  return {
    matchType,
    candidates: identifiedStudents,
    identifiedTag,
    contextOverride,
    rawText: text
  };
};

// --- Local Storage Helpers ---
export const saveToLocal = (key: string, data: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error("Local Storage Error", e);
  }
};

export const loadFromLocal = (key: string) => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    return null;
  }
};
