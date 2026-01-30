
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import QuickLog from './components/QuickLog';
import Timetable from './components/Timetable';
import StudentList from './components/StudentList';
import StudentDetail from './components/StudentDetail';
import Settings from './components/Settings';
import HomeroomManager from './components/HomeroomManager';
import { AppEvent, Student, TimetableRow, ChipGroup, SheetConfig, UserProfile, DutySchedule, EventType } from './types';
import { STUDENTS_DATA, TIMETABLE_DATA, EVENTS_DATA, DEFAULT_CHIP_GROUPS } from './constants';
import { loadFromLocal, saveToLocal, getWeekNumber, getLocalDateKey } from './utils';
import { normalizeAppsScriptUrl, apiPing, apiGetStudents, apiGetTimetable, apiAppendEvents, apiSoftDeleteEvents } from './appScriptApi';

const App: React.FC = () => {
  // App State
  const [activeTab, setActiveTab] = useState('quicklog');
  const [role, setRole] = useState<'GVBM' | 'GVCN'>('GVCN');
  
  // Data State
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [timetable, setTimetable] = useState<TimetableRow[]>([]);
  const [chipGroups, setChipGroups] = useState<ChipGroup[]>(DEFAULT_CHIP_GROUPS);
  
  // Duty Roster State (Lifted for Persistence)
  const [dutySchedules, setDutySchedules] = useState<DutySchedule[]>([]);
  const [dutyTasks, setDutyTasks] = useState<string[]>(['Quét lớp', 'Lau bảng', 'Kê bàn ghế', 'Đổ rác']);

  // Config & Profile State
  const [sheetConfig, setSheetConfig] = useState<SheetConfig>({
    appsScriptUrl: '',
    appsScriptToken: '',
    studentSheetName: 'Students',
    timetableSheetName: 'Timetable',
    eventSheetName: 'Events',
    lastSyncedAt: null
  });

  const [userProfile, setUserProfile] = useState<UserProfile>({
    teacherName: 'Thầy Hiếu',
    teacherEmail: 'hieu@school.vn',
    homeroomClass: '8B03',
    uiScale: 100
  });
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // --- INITIALIZATION ---
  useEffect(() => {
    // 1. Load Local Storage (Offline First)
    const localEvents = loadFromLocal('tn_events');
    const localStudents = loadFromLocal('tn_students');
    const localTimetable = loadFromLocal('tn_timetable');
    const localConfig = loadFromLocal('tn_config');
    const localProfile = loadFromLocal('tn_profile');
    const localDutySchedules = loadFromLocal('tn_duty_schedules');
    const localDutyTasks = loadFromLocal('tn_duty_tasks');

    // FORCE SEED DATA if local is empty array
    if (localEvents && localEvents.length > 0) {
      setEvents(localEvents);
    } else {
      setEvents(EVENTS_DATA);
    }

    setStudents(localStudents || STUDENTS_DATA);
    setTimetable(localTimetable || TIMETABLE_DATA);
    if (localConfig) setSheetConfig(localConfig);
    if (localProfile) setUserProfile(localProfile);
    if (localDutySchedules) setDutySchedules(localDutySchedules);
    if (localDutyTasks) setDutyTasks(localDutyTasks);

  }, []); // Run once on mount
  // --- PERSISTENCE ---
  useEffect(() => { saveToLocal('tn_events', events); }, [events]);
  useEffect(() => { saveToLocal('tn_students', students); }, [students]);
  useEffect(() => { saveToLocal('tn_timetable', timetable); }, [timetable]);
  useEffect(() => { saveToLocal('tn_config', sheetConfig); }, [sheetConfig]);
  
  // Update Profile & Apply Scaling
  useEffect(() => { 
    saveToLocal('tn_profile', userProfile); 
    
    // Apply Global Scale via Root Font Size
    // Default 16px = 100%. 14px ~ 87.5%, 12px = 75%
    // Formula: Base 16px * (percentage / 100)
    const scalePercent = userProfile.uiScale || 100;
    const rootFontSize = 16 * (scalePercent / 100);
    // Don't go below 10px browser minimum effectively
    const appliedSize = Math.max(10, rootFontSize);
    document.documentElement.style.fontSize = `${appliedSize}px`;

  }, [userProfile]);
  
  useEffect(() => { saveToLocal('tn_duty_schedules', dutySchedules); }, [dutySchedules]);
  useEffect(() => { saveToLocal('tn_duty_tasks', dutyTasks); }, [dutyTasks]);


  // --- HANDLERS ---

const queueDeletedEventIds = (ids: string[]) => {
  const existing: string[] = loadFromLocal('tn_deleted_event_ids') || [];
  const merged = Array.from(new Set([...(existing || []), ...(ids || [])]));
  saveToLocal('tn_deleted_event_ids', merged);
};



  const handleSaveEvent = (partialEvent: Partial<AppEvent>) => {
    // Fix: Derive Time Data strictly from input date/time, not current execution time
    const inputDateStr = partialEvent.date || getLocalDateKey(new Date());
    const inputTimeStr = partialEvent.time || new Date().toLocaleTimeString('vi-VN', {hour12: false});
    
    // Construct Date object safely from YYYY-MM-DD
    const [y, m, d] = inputDateStr.split('-').map(Number);
    // Create date object at noon to avoid timezone rolling issues for week calc
    const eventDateObj = new Date(y, m - 1, d, 12, 0, 0); 

    const weekNum = getWeekNumber(eventDateObj);
    const dayOfWeek = eventDateObj.getDay() === 0 ? 8 : eventDateObj.getDay() + 1; // 2-8 format
    
    const schoolYear = (m >= 8) ? `${y}-${y + 1}` : `${y - 1}-${y}`;
    const semester = (m >= 8 && m <= 12) ? 'HK1' : 'HK2';
    const semesterKey = `${schoolYear}_${semester}`;
    
    const timestampStr = `${inputDateStr}T${inputTimeStr}`;

    const newEvent: AppEvent = {
      event_id: `e-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: timestampStr,
      date: inputDateStr,
      time: inputTimeStr,
      month_key: `${y}-${String(m).padStart(2, '0')}`,
      week_key: `${y}-W${String(weekNum).padStart(2, '0')}`,
      semester_key: semesterKey,
      school_year: schoolYear,
      teacher_id: userProfile.teacherEmail, 
      teacher_name: userProfile.teacherName,
      role: partialEvent.role || role, 
      class_code: partialEvent.class_code || '',
      subject: partialEvent.subject || '',
      room: partialEvent.room || '',
      period: partialEvent.period || 0,
      day_of_week: dayOfWeek,
      scope: partialEvent.scope || 'STUDENT',
      student_id: partialEvent.student_id,
      student_name_snapshot: partialEvent.student_name_snapshot,
      type: partialEvent.type || 'NOTE',
      category: partialEvent.category || 'OTHER',
      tags: partialEvent.tags || '',
      points: partialEvent.points || 0,
      severity: partialEvent.severity || 1,
      raw_text: partialEvent.raw_text || '',
      source: partialEvent.source || 'tap',
      confidence: partialEvent.confidence || 1,
      is_tentative: partialEvent.is_tentative || false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      synced: false // Pending sync
    };
    setEvents(prev => [...prev, newEvent]);
    return newEvent.event_id; // Return ID for Undo functionality
  };

  const handleDeleteEvent = (eventId: string) => {
  try {
    const target = events.find(e => e.event_id === eventId);
    if (!target) return;

    const isSynced = !!target.synced;
    const msg = isSynced
      ? "Ghi chú này đã/ có thể đã được gửi lên Google Sheet.\n\nBạn muốn XÓA (xóa mềm) bản ghi này chứ?"
      : "Bạn có chắc muốn xóa bản ghi này (chưa đồng bộ) không?";

    if (!confirm(msg)) return;

    if (isSynced) {
      queueDeletedEventIds([eventId]);
    }

    setEvents(prev => prev.filter(e => e.event_id !== eventId));
  } catch (e) {
    console.error("Delete Error", e);
    alert("Đã xảy ra lỗi khi xóa.");
  }
};

  const handleBulkDelete = (eventIds: string[]) => {
  const syncedIds = events.filter(e => eventIds.includes(e.event_id) && e.synced).map(e => e.event_id);
  if (syncedIds.length) {
    queueDeletedEventIds(syncedIds);
  }
  setEvents(prev => prev.filter(e => !eventIds.includes(e.event_id)));
};

  const handleSyncData = async () => {
    const scriptUrl = normalizeAppsScriptUrl(sheetConfig.appsScriptUrl);
    const token = (sheetConfig.appsScriptToken || '').trim() || undefined;

    if (!scriptUrl) {
      alert("Vui lòng dán LINK Web App Apps Script (kết thúc bằng /exec) trong phần Cài đặt!");
      setActiveTab('settings');
      return;
    }

    try {
      // 0) Ping
      const ping = await apiPing(scriptUrl, token);
      if (!ping.ok) throw new Error(ping.error || 'Ping thất bại');

      // 1) Kéo dữ liệu Master (Students + Timetable)
      // Làm tuần tự để tránh một số môi trường (mạng trường/extension) chặn nhiều JSONP script đồng thời.
      const remoteStudents = await apiGetStudents(scriptUrl, token);
      const remoteTimetable = await apiGetTimetable(scriptUrl, token);

      if (remoteStudents && remoteStudents.length) setStudents(remoteStudents);
      if (remoteTimetable && remoteTimetable.length) setTimetable(remoteTimetable);

      // 2) Đẩy các xóa (xóa mềm trên sheet)
      const deletedIds: string[] = loadFromLocal('tn_deleted_event_ids') || [];
      if (deletedIds.length) {
        await apiSoftDeleteEvents(scriptUrl, deletedIds, token);
        saveToLocal('tn_deleted_event_ids', []);
      }

      // 3) Đẩy các ghi chú chưa sync
      const unsyncedEvents = events.filter(e => !e.synced);
      if (unsyncedEvents.length) {
        await apiAppendEvents(scriptUrl, unsyncedEvents as AppEvent[], token);
        setEvents(prev => prev.map(e => !e.synced ? ({ ...e, synced: true }) : e));
      }

      setSheetConfig(prev => ({ 
        ...prev, 
        appsScriptUrl: scriptUrl,
        lastSyncedAt: new Date().toLocaleString('vi-VN')
      }));

      alert(
        `Đồng bộ xong!\n` +
        `- Students: ${remoteStudents?.length || 0}\n` +
        `- Timetable: ${remoteTimetable?.length || 0}\n` +
        `- Gửi mới: ${unsyncedEvents.length}\n` +
        `- Xóa: ${deletedIds.length}`
      );
    } catch (err: any) {
      console.error(err);
      alert("Lỗi đồng bộ: " + (err?.message || "không xác định") + "\n\nGợi ý: kiểm tra link /exec, quyền Deploy (Anyone), và token (nếu có).");
    }
  };


  // --- Sync split (đỡ lag): Students / Timetable / Events ---
  const requireScriptUrl_ = () => {
    const scriptUrl = normalizeAppsScriptUrl(sheetConfig.appsScriptUrl);
    if (!scriptUrl) {
      alert("Vui lòng dán LINK Web App Apps Script (kết thúc bằng /exec) trong phần Cài đặt!");
      setActiveTab('settings');
      throw new Error('NO_SCRIPT_URL');
    }
    const token = (sheetConfig.appsScriptToken || '').trim() || undefined;
    return { scriptUrl, token };
  };

  const updateLastSyncedAt_ = (key: 'students' | 'timetable' | 'events' | 'all') => {
    const now = new Date().toLocaleString('vi-VN');
    setSheetConfig(prev => ({
      ...prev,
      appsScriptUrl: normalizeAppsScriptUrl(prev.appsScriptUrl),
      lastSyncedAt: now,
      lastSyncedStudentsAt: key === 'students' || key === 'all' ? now : (prev as any).lastSyncedStudentsAt,
      lastSyncedTimetableAt: key === 'timetable' || key === 'all' ? now : (prev as any).lastSyncedTimetableAt,
      lastSyncedEventsAt: key === 'events' || key === 'all' ? now : (prev as any).lastSyncedEventsAt,
    } as any));
  };

  const handleSyncStudents = async () => {
    try {
      const { scriptUrl, token } = requireScriptUrl_();
      const ping = await apiPing(scriptUrl, token);
      if (!ping.ok) throw new Error(ping.error || 'Ping thất bại');
      const remoteStudents = await apiGetStudents(scriptUrl, token);
      if (remoteStudents && remoteStudents.length) setStudents(remoteStudents);
      updateLastSyncedAt_('students');
      alert(`Đồng bộ HỌC SINH xong!\n- Students: ${remoteStudents?.length || 0}`);
    } catch (err: any) {
      if (err?.message === 'NO_SCRIPT_URL') return;
      console.error(err);
      alert("Lỗi đồng bộ HỌC SINH: " + (err?.message || "không xác định"));
    }
  };

  const handleSyncTimetable = async () => {
    try {
      const { scriptUrl, token } = requireScriptUrl_();
      const ping = await apiPing(scriptUrl, token);
      if (!ping.ok) throw new Error(ping.error || 'Ping thất bại');
      const remoteTimetable = await apiGetTimetable(scriptUrl, token);
      if (remoteTimetable && remoteTimetable.length) setTimetable(remoteTimetable);
      updateLastSyncedAt_('timetable');
      alert(`Đồng bộ THỜI KHÓA BIỂU xong!\n- Timetable: ${remoteTimetable?.length || 0}`);
    } catch (err: any) {
      if (err?.message === 'NO_SCRIPT_URL') return;
      console.error(err);
      alert("Lỗi đồng bộ TKB: " + (err?.message || "không xác định"));
    }
  };

  const handleSyncEvents = async () => {
    try {
      const { scriptUrl, token } = requireScriptUrl_();
      const ping = await apiPing(scriptUrl, token);
      if (!ping.ok) throw new Error(ping.error || 'Ping thất bại');

      // 1) Đẩy các xóa (xóa mềm trên sheet)
      const deletedIds: string[] = loadFromLocal('tn_deleted_event_ids') || [];
      if (deletedIds.length) {
        await apiSoftDeleteEvents(scriptUrl, deletedIds, token);
        saveToLocal('tn_deleted_event_ids', []);
      }

      // 2) Đẩy các ghi chú chưa sync
      const unsyncedEvents = events.filter(e => !e.synced);
      if (unsyncedEvents.length) {
        await apiAppendEvents(scriptUrl, unsyncedEvents as AppEvent[], token);
        setEvents(prev => prev.map(e => !e.synced ? ({ ...e, synced: true }) : e));
      }

      updateLastSyncedAt_('events');
      alert(
        `Gửi NHẬT KÝ (Events) xong!\n` +
        `- Gửi mới: ${unsyncedEvents.length}\n` +
        `- Xóa: ${deletedIds.length}`
      );
    } catch (err: any) {
      if (err?.message === 'NO_SCRIPT_URL') return;
      console.error(err);
      alert("Lỗi đồng bộ EVENTS: " + (err?.message || "không xác định"));
    }
  };


  const handleExportData = () => {
    const dataStr = JSON.stringify(events, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `teacher_note_export_${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab !== 'students') setSelectedStudent(null);
  };

  const gvbmChipGroups = chipGroups.filter(g => g.id.startsWith('g-gvbm') || g.id === 'g-note');
  const gvcnChipGroups = chipGroups.filter(g => g.id.startsWith('g-gvcn') || g.id === 'g-note');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard events={events} onDeleteEvent={handleDeleteEvent} />;
      case 'quicklog':
        return (
          <QuickLog 
            students={students} 
            timetable={timetable} 
            chipGroups={gvbmChipGroups}
            events={events}
            onSaveEvent={handleSaveEvent}
            onDeleteEvent={handleDeleteEvent}
            onBulkDelete={handleBulkDelete}
            defaultRole="GVBM"
          />
        );
      case 'timetable':
        return <Timetable timetable={timetable} />;
      case 'students':
        if (selectedStudent) {
          return (
            <StudentDetail 
              student={selectedStudent} 
              allStudents={students}
              events={events} 
              onBack={() => setSelectedStudent(null)} 
            />
          );
        }
        return (
          <StudentList 
            students={students} 
            onSelectStudent={setSelectedStudent} 
          />
        );
      case 'settings':
        const availableClasses = Array.from(new Set(students.map(s => s.class_code)));
        return (
          <Settings 
            chipGroups={chipGroups} 
            onUpdateGroups={setChipGroups} 
            sheetConfig={sheetConfig}
            onUpdateSheetConfig={setSheetConfig}
            userProfile={userProfile}
            onUpdateUserProfile={setUserProfile}
            availableClasses={availableClasses}
            onSyncAll={handleSyncData}
            onSyncStudents={handleSyncStudents}
            onSyncTimetable={handleSyncTimetable}
            onSyncEvents={handleSyncEvents}
            onExport={handleExportData}
          />
        );
      case 'homeroom':
        return (
          <HomeroomManager 
            className={userProfile.homeroomClass} 
            students={students} 
            events={events}
            timetable={timetable}
            chipGroups={gvcnChipGroups}
            onSaveEvent={handleSaveEvent}
            onDeleteEvent={handleDeleteEvent}
            onBulkDelete={handleBulkDelete}
            dutyTasks={dutyTasks}
            setDutyTasks={setDutyTasks}
            dutySchedules={dutySchedules}
            setDutySchedules={setDutySchedules}
          />
        );
      default:
        return <QuickLog students={students} timetable={timetable} chipGroups={gvbmChipGroups} events={events} onSaveEvent={handleSaveEvent} onDeleteEvent={handleDeleteEvent} onBulkDelete={handleBulkDelete} />;
    }
  };

  return (
    <Layout 
      activeTab={activeTab} 
      onTabChange={handleTabChange} 
      role={role}
      userProfile={userProfile}
      onUpdateUserProfile={setUserProfile}
    >
      {renderContent()}
    </Layout>
  );
};

export default App;
