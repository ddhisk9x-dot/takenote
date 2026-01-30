
import React, { useState, useEffect } from 'react';
import { Student, AppEvent, EventType, DutyRoster, TimetableRow, ChipGroup, DutySchedule } from '../types';
import { ClipboardList, TrendingUp, AlertOctagon, X, Plus, Edit3, Trash2, Zap, LayoutDashboard, Check, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import { getUniqueName } from '../constants';
import { getWeekNumber, loadFromLocal, saveToLocal } from '../utils';
import QuickLog from './QuickLog';

interface HomeroomManagerProps {
  className: string;
  students: Student[];
  events: AppEvent[];
  timetable: TimetableRow[];
  chipGroups: ChipGroup[];
  onSaveEvent: (event: Partial<AppEvent>) => string;
  onDeleteEvent: (eventId: string) => void;
  onBulkDelete: (eventIds: string[]) => void;
  // Lifted props for persistence
  dutyTasks: string[];
  setDutyTasks: React.Dispatch<React.SetStateAction<string[]>>;
  dutySchedules: DutySchedule[];
  setDutySchedules: React.Dispatch<React.SetStateAction<DutySchedule[]>>;
}

const HomeroomManager: React.FC<HomeroomManagerProps> = ({ 
  className, students, events, timetable, chipGroups, onSaveEvent, onDeleteEvent, onBulkDelete,
  dutyTasks, setDutyTasks, dutySchedules, setDutySchedules
}) => {
  const [view, setView] = useState<'overview' | 'quicklog'>('overview');

  // --- Week Management Logic (Refactored for Custom School Weeks) ---
  
  // 1. viewDate: The Monday of the currently viewed week. Defaults to this week's Monday.
  const [viewDate, setViewDate] = useState<Date>(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    const monday = new Date(d.setDate(diff));
    monday.setHours(0,0,0,0);
    return monday;
  });

  // 2. weekOffset: The difference between the School Week and the ISO Calendar Week.
  // Persisted in local storage so the teacher only sets it once.
  const [weekOffset, setWeekOffset] = useState<number>(() => {
    const saved = loadFromLocal('tn_week_offset');
    return typeof saved === 'number' ? saved : 0;
  });

  // Derived Values
  const isoWeek = getWeekNumber(viewDate);
  const schoolWeek = isoWeek + weekOffset;
  const currentYear = viewDate.getFullYear();
  
  // Format: "2026-W25" (Using School Week for the key, so data retrieval matches the teacher's mental model)
  const currentWeekKey = `${currentYear}-W${String(schoolWeek).padStart(2, '0')}`;
  
  // Calculate Date Range (Mon - Sat)
  const weekStart = new Date(viewDate);
  const weekEnd = new Date(viewDate);
  weekEnd.setDate(viewDate.getDate() + 5); // Mon + 5 = Sat

  // Get Current Roster or Create Default
  const currentSchedule = dutySchedules.find(s => s.week_key === currentWeekKey);
  const defaultRoster: DutyRoster[] = [2, 3, 4, 5, 6, 7].map(day => ({ 
      day_of_week: day,
      assignments: dutyTasks.reduce((acc, task) => ({ ...acc, [task]: [] }), {})
  }));
  const dutyRoster = currentSchedule ? currentSchedule.roster : defaultRoster;

  // Update Roster Helper
  const updateRoster = (newRoster: DutyRoster[]) => {
      setDutySchedules(prev => {
          const others = prev.filter(s => s.week_key !== currentWeekKey);
          return [...others, { week_key: currentWeekKey, roster: newRoster }];
      });
  };

  // --- Handlers for Week Navigation ---

  const handleWeekChange = (direction: 'prev' | 'next') => {
      const newDate = new Date(viewDate);
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
      setViewDate(newDate);
  };

  const handleWeekInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = parseInt(e.target.value);
      if (!isNaN(val) && val > 0) {
          // User wants the CURRENT displayed dates to be Week X.
          // So we adjust the offset: Offset = DesiredWeek - CurrentISOWeek
          const newOffset = val - isoWeek;
          setWeekOffset(newOffset);
          saveToLocal('tn_week_offset', newOffset);
      }
  };

  // --- Modal State & Standard Logic ---
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    type: 'ADD' | 'EDIT' | 'DELETE';
    taskName?: string; 
    inputValue: string;
  }>({ isOpen: false, type: 'ADD', inputValue: '' });

  const classStudents = students.filter(s => s.class_code === className);
  const classEvents = events.filter(e => e.class_code === className);
  const violations = classEvents.filter(e => e.type === EventType.VIOLATION);
  const praises = classEvents.filter(e => e.type === EventType.PRAISE);

  const getDayName = (d: number) => d === 8 ? 'CN' : `Thứ ${d}`;
  
  // --- Task Management Handlers ---
  const openAddTask = () => {
    setModalConfig({ isOpen: true, type: 'ADD', inputValue: '' });
  };

  const openEditTask = (taskName: string) => {
    setModalConfig({ isOpen: true, type: 'EDIT', taskName, inputValue: taskName });
  };

  const openDeleteTask = (taskName: string) => {
    setModalConfig({ isOpen: true, type: 'DELETE', taskName, inputValue: '' });
  };

  const handleConfirmModal = () => {
    const { type, taskName, inputValue } = modalConfig;
    const trimmedInput = inputValue.trim();

    if (type === 'DELETE' && taskName) {
       setDutyTasks(prev => prev.filter(t => t !== taskName));
       const newRoster = dutyRoster.map(r => {
         const newAssignments = { ...r.assignments };
         delete newAssignments[taskName];
         return { ...r, assignments: newAssignments };
       });
       updateRoster(newRoster);

    } else if (type === 'ADD') {
       if (!trimmedInput) return alert("Vui lòng nhập tên nhiệm vụ");
       if (dutyTasks.includes(trimmedInput)) return alert("Nhiệm vụ này đã tồn tại!");
       
       setDutyTasks([...dutyTasks, trimmedInput]);
       const newRoster = dutyRoster.map(r => ({
        ...r,
        assignments: { ...r.assignments, [trimmedInput]: [] }
       }));
       updateRoster(newRoster);

    } else if (type === 'EDIT' && taskName) {
       if (!trimmedInput) return alert("Vui lòng nhập tên nhiệm vụ");
       if (trimmedInput !== taskName && dutyTasks.includes(trimmedInput)) return alert("Tên nhiệm vụ đã tồn tại!");
       
       setDutyTasks(prev => prev.map(t => t === taskName ? trimmedInput : t));
       const newRoster = dutyRoster.map(r => {
        const newAssignments = { ...r.assignments };
        if (newAssignments[taskName]) {
            newAssignments[trimmedInput] = newAssignments[taskName];
            delete newAssignments[taskName];
        } else {
            newAssignments[trimmedInput] = [];
        }
        return { ...r, assignments: newAssignments };
       });
       updateRoster(newRoster);
    }
    setModalConfig({ ...modalConfig, isOpen: false });
  };

  const handleAssignDuty = (day: number, task: string, studentId: string) => {
    if (!studentId) return;
    const newRoster = dutyRoster.map(r => {
      if (r.day_of_week === day) {
        const currentAssignments = r.assignments[task] || [];
        if (!currentAssignments.includes(studentId)) {
           return {
             ...r,
             assignments: {
               ...r.assignments,
               [task]: [...currentAssignments, studentId]
             }
           };
        }
      }
      return r;
    });
    updateRoster(newRoster);
  };

  const handleRemoveDuty = (day: number, task: string, studentId: string) => {
    const newRoster = dutyRoster.map(r => {
      if (r.day_of_week === day) {
        return {
          ...r,
          assignments: {
            ...r.assignments,
            [task]: (r.assignments[task] || []).filter(id => id !== studentId)
          }
        };
      }
      return r;
    });
    updateRoster(newRoster);
  };

  return (
    <div className="space-y-4 h-full flex flex-col relative">
      {/* Header Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 flex-shrink-0">
        <div>
           <h2 className="text-2xl font-bold text-gray-800">Lớp chủ nhiệm: <span className="text-indigo-600">{className}</span></h2>
           <p className="text-gray-500">Sĩ số: {classStudents.length} học sinh</p>
        </div>
        <div className="flex gap-2">
           <div className="bg-gray-100 p-1 rounded-lg flex">
              <button 
                onClick={() => setView('overview')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition-colors ${view === 'overview' ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-900'}`}
              >
                <LayoutDashboard className="w-4 h-4" /> Tổng quan
              </button>
              <button 
                onClick={() => setView('quicklog')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition-colors ${view === 'quicklog' ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-900'}`}
              >
                <Zap className="w-4 h-4" /> Ghi nền nếp
              </button>
           </div>
        </div>
      </div>

      {view === 'quicklog' ? (
        <div className="flex-1 min-h-0 bg-white rounded-xl border border-gray-100 p-2 lg:p-4 overflow-hidden">
          <QuickLog 
             students={students}
             timetable={timetable}
             chipGroups={chipGroups}
             events={events}
             onSaveEvent={onSaveEvent}
             onDeleteEvent={onDeleteEvent}
             onBulkDelete={onBulkDelete}
             fixedClassName={className}
             defaultRole="GVCN"
             containerHeight="h-full"
          />
        </div>
      ) : (
        <div className="space-y-6 overflow-y-auto pb-10">
          <div className="flex gap-4">
             <div className="bg-white px-4 py-3 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3 flex-1">
                <div className="p-2 bg-red-100 text-red-600 rounded-full"><AlertOctagon className="w-5 h-5"/></div>
                <div>
                  <p className="text-sm text-gray-500">Vi phạm tuần này</p>
                  <p className="text-xl font-bold text-gray-900">{violations.length}</p>
                </div>
             </div>
             <div className="bg-white px-4 py-3 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3 flex-1">
                <div className="p-2 bg-green-100 text-green-600 rounded-full"><TrendingUp className="w-5 h-5"/></div>
                <div>
                  <p className="text-sm text-gray-500">Khen thưởng tuần này</p>
                  <p className="text-xl font-bold text-gray-900">{praises.length}</p>
                </div>
             </div>
          </div>
          
          {/* Duty Roster Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
             <div className="bg-indigo-50 px-6 py-4 border-b border-indigo-100 flex items-center justify-between flex-wrap gap-2">
               <div className="flex items-center gap-2">
                 <ClipboardList className="w-5 h-5 text-indigo-600" />
                 <h3 className="font-bold text-indigo-900">Bảng phân công trực nhật</h3>
               </div>

               {/* Editable Week Selector with Decoupled Dates */}
               <div className="flex items-center bg-white rounded-lg border border-indigo-100 shadow-sm p-1">
                  <button onClick={() => handleWeekChange('prev')} className="p-1 hover:bg-gray-100 rounded text-gray-500" title="Tuần trước">
                     <ChevronLeft className="w-4 h-4" />
                  </button>
                  <div className="px-3 flex items-center gap-2 text-sm font-semibold text-gray-700">
                     <span className="whitespace-nowrap">Tuần</span>
                     {/* User edits this Input -> Updates Offset -> Dates remain Same, Week # Changes */}
                     <input 
                       type="number"
                       min="1"
                       max="53"
                       value={schoolWeek}
                       onChange={handleWeekInputChange}
                       className="w-12 text-center border border-gray-300 rounded px-1 py-0.5 focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-indigo-50/50"
                       title="Chỉnh sửa số tuần theo quy định của trường"
                     />
                     <span className="font-normal text-gray-500 text-xs ml-1 border-l pl-2 border-gray-200">
                        {weekStart.getDate()}/{weekStart.getMonth()+1} - {weekEnd.getDate()}/{weekEnd.getMonth()+1}
                     </span>
                  </div>
                  <button onClick={() => handleWeekChange('next')} className="p-1 hover:bg-gray-100 rounded text-gray-500" title="Tuần sau">
                     <ChevronRight className="w-4 h-4" />
                  </button>
               </div>
             </div>
             
             <div className="overflow-x-auto">
               <table className="w-full text-sm text-left border-collapse min-w-[800px]">
                 <thead>
                   <tr className="bg-gray-50 border-b border-gray-200">
                     <th className="px-4 py-3 font-semibold text-gray-700 w-24 border-r sticky left-0 bg-gray-50 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                       Thứ
                     </th>
                     {dutyTasks.map(task => (
                       <th key={task} className="px-2 py-3 font-semibold text-gray-700 border-r min-w-[160px] group relative bg-gray-50">
                         <div className="flex items-center justify-between">
                           <span className="truncate max-w-[100px]" title={task}>{task}</span>
                           <div className="flex gap-1 pl-2">
                              <button 
                                type="button"
                                onClick={(e) => { e.stopPropagation(); openEditTask(task); }} 
                                className="p-1.5 hover:bg-gray-200 rounded text-gray-400 hover:text-indigo-600 transition-colors z-20 relative"
                                title="Sửa tên nhiệm vụ"
                              >
                                <Edit3 className="w-3.5 h-3.5"/>
                              </button>
                              <button 
                                type="button"
                                onClick={(e) => { e.stopPropagation(); openDeleteTask(task); }} 
                                className="p-1.5 hover:bg-red-100 rounded text-gray-400 hover:text-red-500 transition-colors z-20 relative"
                                title="Xóa nhiệm vụ"
                              >
                                <Trash2 className="w-3.5 h-3.5"/>
                              </button>
                           </div>
                         </div>
                       </th>
                     ))}
                     <th className="px-4 py-3 border-r w-12 text-center bg-gray-50">
                        <button 
                          type="button"
                          onClick={openAddTask}
                          className="p-1.5 bg-indigo-100 text-indigo-600 rounded-full hover:bg-indigo-200 shadow-sm"
                          title="Thêm nhiệm vụ mới"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                     </th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-100">
                   {dutyRoster.map(roster => (
                     <tr key={roster.day_of_week} className="hover:bg-gray-50/50">
                       <td className="px-4 py-3 font-bold text-indigo-700 border-r bg-gray-50/30 sticky left-0 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                         {getDayName(roster.day_of_week)}
                       </td>
                       {dutyTasks.map(task => {
                         const assignedIds = roster.assignments[task] || [];
                         return (
                           <td key={task} className="px-2 py-2 border-r align-top">
                             <div className="flex flex-col gap-1.5 min-h-[40px]">
                               {assignedIds.map(id => {
                                 const st = classStudents.find(s => s.student_id === id);
                                 const shortName = st ? st.full_name.split(' ').pop() : id;
                                 return (
                                   <div key={id} className="flex items-center justify-between bg-white border border-gray-200 rounded px-2 py-1.5 shadow-sm text-xs group">
                                      <span className="font-medium text-gray-700 truncate max-w-[90px]" title={st?.full_name}>
                                        {shortName}
                                      </span>
                                      <button 
                                        type="button"
                                        onClick={() => handleRemoveDuty(roster.day_of_week, task, id)}
                                        className="text-gray-300 hover:text-red-500 p-0.5"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                   </div>
                                 );
                               })}
                               
                               <div className="relative group w-full">
                                 <div className="flex items-center justify-center border border-dashed border-gray-300 rounded px-2 py-1 text-gray-400 hover:text-indigo-600 hover:border-indigo-300 cursor-pointer transition-colors bg-white/50 hover:bg-white">
                                   <Plus className="w-3 h-3 mr-1" />
                                   <span className="text-xs">Thêm</span>
                                 </div>
                                 <select 
                                   className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                   value=""
                                   onChange={(e) => handleAssignDuty(roster.day_of_week, task, e.target.value)}
                                 >
                                   <option value="">Chọn HS...</option>
                                   {classStudents.map(s => (
                                     <option key={s.student_id} value={s.student_id}>
                                       {getUniqueName(s, classStudents)}
                                     </option>
                                   ))}
                                 </select>
                               </div>
                             </div>
                           </td>
                         );
                       })}
                       <td className="border-r bg-gray-50/10"></td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
          </div>

          {/* Top Violations */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
             <div className="bg-red-50 px-6 py-4 border-b border-red-100 flex items-center gap-2">
               <AlertOctagon className="w-5 h-5 text-red-600" />
               <h3 className="font-bold text-red-900">Cần lưu ý (Top vi phạm)</h3>
             </div>
             <div className="p-4">
                {violations.length === 0 ? (
                  <p className="text-sm text-gray-500 italic text-center py-4">Lớp rất ngoan, chưa có vi phạm nào!</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {Array.from(new Set(violations.map(v => v.student_id))).slice(0, 6).map(sid => {
                      const st = classStudents.find(s => s.student_id === sid);
                      const studentViolations = violations.filter(v => v.student_id === sid);
                      return (
                        <div key={sid} className="flex items-start gap-3 p-3 border border-gray-100 rounded-lg hover:shadow-sm">
                          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-sm font-bold text-gray-500 flex-shrink-0">
                            {st?.full_name.charAt(0)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold text-gray-800 truncate">{st?.full_name}</p>
                            <p className="text-xs text-red-600 font-semibold mb-1">{studentViolations.length} lỗi</p>
                            <div className="flex flex-wrap gap-1">
                              {Array.from(new Set(studentViolations.map(v => v.tags))).slice(0, 2).map((tag: string) => (
                                 <span key={tag} className="text-[10px] bg-red-50 text-red-700 px-1.5 py-0.5 rounded border border-red-100 truncate max-w-full">
                                   {tag.split('|')[0]}
                                 </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
             </div>
          </div>
        </div>
      )}

      {/* --- CUSTOM MODAL --- */}
      {modalConfig.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center mb-4">
                 <h3 className="text-lg font-bold text-gray-800">
                    {modalConfig.type === 'ADD' && 'Thêm nhiệm vụ mới'}
                    {modalConfig.type === 'EDIT' && 'Đổi tên nhiệm vụ'}
                    {modalConfig.type === 'DELETE' && 'Xác nhận xóa'}
                 </h3>
                 <button 
                  onClick={() => setModalConfig({...modalConfig, isOpen: false})}
                  className="p-1 rounded-full hover:bg-gray-100 text-gray-500"
                 >
                   <X className="w-5 h-5" />
                 </button>
              </div>

              {modalConfig.type === 'DELETE' ? (
                 <div className="mb-6">
                    <div className="flex items-center gap-3 text-red-600 bg-red-50 p-3 rounded-lg mb-3">
                       <AlertTriangle className="w-6 h-6" />
                       <span className="font-bold">Cảnh báo</span>
                    </div>
                    <p className="text-gray-600 text-sm">
                      Bạn có chắc chắn muốn xóa nhiệm vụ <span className="font-bold text-gray-800">"{modalConfig.taskName}"</span> không?
                      <br/>
                      Tất cả dữ liệu phân công của nhiệm vụ này sẽ bị mất.
                    </p>
                 </div>
              ) : (
                 <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tên nhiệm vụ</label>
                    <input 
                      type="text" 
                      autoFocus
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      placeholder="Ví dụ: Tưới cây, Kê bàn..."
                      value={modalConfig.inputValue}
                      onChange={(e) => setModalConfig({...modalConfig, inputValue: e.target.value})}
                      onKeyDown={(e) => e.key === 'Enter' && handleConfirmModal()}
                    />
                 </div>
              )}

              <div className="flex gap-3">
                 <button 
                   onClick={() => setModalConfig({...modalConfig, isOpen: false})}
                   className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200"
                 >
                   Hủy
                 </button>
                 <button 
                   onClick={handleConfirmModal}
                   className={`flex-1 px-4 py-2 text-white rounded-lg font-medium shadow-md flex items-center justify-center gap-2
                     ${modalConfig.type === 'DELETE' 
                        ? 'bg-red-600 hover:bg-red-700' 
                        : 'bg-indigo-600 hover:bg-indigo-700'}
                   `}
                 >
                   {modalConfig.type === 'DELETE' ? 'Xóa bỏ' : 'Lưu lại'}
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default HomeroomManager;
