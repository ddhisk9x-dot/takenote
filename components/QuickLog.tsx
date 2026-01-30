
import React, { useState, useEffect, useRef } from 'react';
import { Mic, Search, ChevronDown, Check, X, Send, Lock, Unlock, Users, AlertTriangle, Undo2, Clock, RotateCcw, Wifi, WifiOff, CalendarDays, BarChart2, Trash2 } from 'lucide-react';
import { Student, TimetableRow, AppEvent, TagOption, ChipGroup, EventType, EventCategory } from '../types';
import { getUniqueName } from '../constants';
import { getCurrentPeriodInfo, getLocalDateKey, getSlotForDatePeriod, parseNaturalLanguageInput, fetchNetworkTimeOffset } from '../utils';

interface QuickLogProps {
  students: Student[];
  timetable: TimetableRow[];
  chipGroups: ChipGroup[];
  events: AppEvent[]; 
  onSaveEvent: (event: Partial<AppEvent>) => string; // Returns event_id
  onDeleteEvent: (eventId: string) => void;
  onBulkDelete: (eventIds: string[]) => void;
  fixedClassName?: string;
  defaultRole?: 'GVBM' | 'GVCN';
  containerHeight?: string;
}

const QuickLog: React.FC<QuickLogProps> = ({ 
  students, 
  timetable, 
  chipGroups, 
  events, 
  onSaveEvent,
  onDeleteEvent,
  onBulkDelete,
  fixedClassName,
  defaultRole = 'GVBM',
  containerHeight = 'h-[calc(100vh-6rem)] lg:h-[calc(100vh-8rem)]'
}) => {
  // --- Time & Context State ---
  const [now, setNow] = useState<Date>(new Date());
  const [timeOffset, setTimeOffset] = useState<number>(0);
  const [isNetworkTime, setIsNetworkTime] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine); // Network state
  const [selectedDateStr, setSelectedDateStr] = useState<string>(getLocalDateKey(new Date()));

  const [activeClass, setActiveClass] = useState<string>(fixedClassName || '');
  const [activeSubject, setActiveSubject] = useState<string>('');
  const [currentSlot, setCurrentSlot] = useState<TimetableRow | null>(null);
  
  const [overridePeriod, setOverridePeriod] = useState<number | null>(null);
  const [isLocked, setIsLocked] = useState(!!fixedClassName);

  // --- Interaction State ---
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [textInput, setTextInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null); // For Web Speech API
  const [showOverrideClass, setShowOverrideClass] = useState(false);
  const [showPeriodSelector, setShowPeriodSelector] = useState(false);
  const [activeGroupIndex, setActiveGroupIndex] = useState(0);
  const [showStatsPanel, setShowStatsPanel] = useState(false);
  const [lastEventId, setLastEventId] = useState<string | null>(null); // For Undo

  // --- Duplicate/Multi Resolution State ---
  const [duplicateCandidates, setDuplicateCandidates] = useState<Student[]>([]);
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<string[]>([]);
  const [pendingTagForDuplicate, setPendingTagForDuplicate] = useState<TagOption | null>(null);
  const [pendingTextForDuplicate, setPendingTextForDuplicate] = useState<string>('');
  
  const [showToast, setShowToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  // 1. Real-time Clock & Network Status
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date(Date.now() + timeOffset));
    }, 1000);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(timer);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [timeOffset]);

  useEffect(() => {
    const syncTime = async () => {
      if (navigator.onLine) {
        const offset = await fetchNetworkTimeOffset();
        if (offset !== 0) {
          setTimeOffset(offset);
          setIsNetworkTime(true);
        }
      }
    };
    syncTime();
  }, []);

  // 2. Real Voice Recognition Init
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'vi-VN';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setTextInput(transcript); // Set text to input so user sees it
        processInput(transcript, 'voice');
        setIsRecording(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsRecording(false);
        showFeedback("Lỗi nhận diện giọng nói");
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    }
  }, [students, activeClass, chipGroups]); // Dependencies for processInput context

  // 3. Reactive Auto Context Logic
  useEffect(() => {
    if (overridePeriod !== null) return;
    
    // Construct checkDate using selectedDateStr (Year/Month/Day) + now (Time)
    // This allows teachers to check schedule for future dates at current clock time
    const [y, m, d] = selectedDateStr.split('-').map(Number);
    const checkDate = new Date(now);
    checkDate.setFullYear(y);
    checkDate.setMonth(m - 1);
    checkDate.setDate(d);

    const slot = getCurrentPeriodInfo(timetable, checkDate);
    
    if (fixedClassName) {
       setActiveClass(fixedClassName);
       if (slot && slot.class_code === fixedClassName) {
         setCurrentSlot(slot);
         setActiveSubject(slot.subject);
       } else {
         setCurrentSlot(slot); 
         setActiveSubject('Sinh hoạt CN'); 
       }
    } else {
       if (!isLocked) {
         if (slot) {
           setCurrentSlot(slot);
           setActiveClass(slot.class_code);
           setActiveSubject(slot.subject);
         }
       }
    }
  }, [now, timetable, isLocked, fixedClassName, overridePeriod, selectedDateStr]);

  // --- Handlers ---
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    setSelectedDateStr(newDate);

    // Nếu đang ở chế độ CHỌN TIẾT (overridePeriod), đổi ngày phải tự dò lại
    // lớp/môn/phòng của đúng tiết đó theo ngày mới.
    if (overridePeriod !== null) {
      const matchingSlot = getSlotForDatePeriod(timetable, newDate, overridePeriod);
      if (matchingSlot) {
        if (fixedClassName && matchingSlot.class_code !== fixedClassName) {
          setActiveSubject('Sinh hoạt CN');
          setCurrentSlot(matchingSlot);
        } else {
          setActiveClass(matchingSlot.class_code);
          setActiveSubject(matchingSlot.subject);
          setCurrentSlot(matchingSlot);
        }
      } else {
        setCurrentSlot(null);
        if (fixedClassName) {
          setActiveSubject('Sinh hoạt CN');
        } else {
          setActiveClass('');
          setActiveSubject('');
        }
      }
    }

    showFeedback(`Đã chuyển sang ngày ${newDate}`);
  };

  const handleManualPeriodSelect = (period: number) => {
    setOverridePeriod(period);
    setShowPeriodSelector(false);
    setIsLocked(true); 

    const matchingSlot = getSlotForDatePeriod(timetable, selectedDateStr, period);
if (matchingSlot) {
      if (fixedClassName && matchingSlot.class_code !== fixedClassName) {
         // Keep context but warn?
         setActiveSubject('Sinh hoạt CN');
         setCurrentSlot(matchingSlot); // Keep slot for meta data if needed
      } else {
         setActiveClass(matchingSlot.class_code);
         setActiveSubject(matchingSlot.subject);
         setCurrentSlot(matchingSlot);
      }
    } else {
       // --- FIX: Reset state if no slot found (Empty period) ---
       setCurrentSlot(null);
       if (fixedClassName) {
          setActiveSubject('Sinh hoạt CN');
       } else {
          setActiveClass(''); // Clear class
          setActiveSubject(''); // Clear subject
       }
    }
  };

  const handleResetAuto = () => {
    setOverridePeriod(null);
    setSelectedDateStr(getLocalDateKey(new Date()));
    setIsLocked(!!fixedClassName);
    setShowPeriodSelector(false);
    showFeedback("Đã bật lại chế độ tự động (Hôm nay)");
  };

  const filteredStudents = students.filter(s => 
    s.class_code === activeClass && 
    (searchQuery === '' || getUniqueName(s, students).toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleStudentToggle = (id: string) => {
    setSelectedStudents(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const clearSelection = () => setSelectedStudents([]);

  const createEventPayload = (student: Student, tag: TagOption, source: 'tap' | 'voice' | 'text', rawText: string) => {
    const finalDate = selectedDateStr;
    const isToday = finalDate === new Date().toISOString().split('T')[0];
    const finalTime = isToday ? now.toLocaleTimeString('vi-VN', {hour12: false}) : '00:00:00';
    const timestamp = `${finalDate}T${finalTime}`;

    return {
      class_code: activeClass,
      subject: activeSubject,
      role: defaultRole,
      scope: 'STUDENT',
      student_id: student.student_id,
      student_name_snapshot: getUniqueName(student, students),
      type: tag.type,
      category: tag.category,
      tags: tag.label,
      points: tag.points,
      severity: 1,
      source: source,
      confidence: 1,
      raw_text: rawText,
      room: currentSlot?.room || '',
      period: overridePeriod !== null ? overridePeriod : (currentSlot?.period || 0),
      timestamp: timestamp,
      date: finalDate,
      time: finalTime,
    } as Partial<AppEvent>;
  };

  const saveAndTrackUndo = (eventPayload: Partial<AppEvent>) => {
    const newId = onSaveEvent(eventPayload);
    setLastEventId(newId);
  };

  const handleUndo = () => {
    if (lastEventId) {
      onDeleteEvent(lastEventId);
      setLastEventId(null);
      showFeedback("Đã hoàn tác!");
    }
  };

  const handleChipClick = (tag: TagOption) => {
    let targets = selectedStudents;

    if (targets.length > 0) {
      targets.forEach(studentId => {
        const student = students.find(s => s.student_id === studentId);
        if (student) {
          saveAndTrackUndo(createEventPayload(student, tag, 'tap', `${student.full_name} ${tag.label}`));
        }
      });
      showFeedback(`Đã lưu ${targets.length} ghi chú "${tag.label}"`);
      clearSelection();
      setSearchQuery(''); 
      return;
    }

    if (textInput.trim().length > 0) {
      setTextInput(prev => `${prev.trim()} ${tag.label}`);
      inputRef.current?.focus();
      return;
    }

    if (filteredStudents.length === 1) {
      const student = filteredStudents[0];
      saveAndTrackUndo(createEventPayload(student, tag, 'tap', `${student.full_name} ${tag.label}`));
      showFeedback(`Đã lưu: ${student.full_name} - ${tag.label}`);
      setSearchQuery('');
      return;
    } else if (filteredStudents.length > 1 && searchQuery.length > 0) {
      setShowToast({ message: "Vui lòng chọn cụ thể học sinh!", type: 'error' });
      setTimeout(() => setShowToast(null), 2000);
      return;
    }
  };

  const processInput = (text: string, source: 'voice' | 'text') => {
    const allTags = chipGroups.flatMap(g => g.chips);
    
    // Pass ALL students to allow searching outside current class if specified
    const result = parseNaturalLanguageInput(text, students, allTags, activeClass);

    if (result.contextOverride) {
      if (result.contextOverride.classCode && result.contextOverride.classCode !== activeClass) {
        if (!fixedClassName) {
          setActiveClass(result.contextOverride.classCode);
          setIsLocked(true);
          showFeedback(`Đã chuyển sang lớp ${result.contextOverride.classCode}`);
        }
      }
      if (result.contextOverride.date) {
        setSelectedDateStr(result.contextOverride.date);
      }
    }

    if (result.matchType === 'NONE') {
      if (!result.contextOverride || (!result.contextOverride.classCode && !result.contextOverride.date)) {
         showFeedback("Không hiểu lệnh này");
      }
      return;
    }

    if (!result.identifiedTag) {
      if (result.matchType === 'EXACT' || result.matchType === 'MULTI') {
        const studentIds = result.candidates.map(s => s.student_id);
        setSelectedStudents(studentIds);
        showFeedback(`Đã chọn ${result.candidates[0].full_name}`);
        setTextInput('');
        return;
      } else if (result.matchType === 'AMBIGUOUS') {
         setDuplicateCandidates(result.candidates);
         setSelectedCandidateIds(result.candidates.map(s => s.student_id));
         setPendingTagForDuplicate(null);
         setPendingTextForDuplicate(text);
         return;
      }
    }

    const tagToUse = result.identifiedTag!;

    if (result.matchType === 'EXACT') {
      const student = result.candidates[0];
      saveAndTrackUndo(createEventPayload(student, tagToUse, source, text));
      showFeedback(`Đã lưu: ${student.full_name} - ${tagToUse.label}`);
      setTextInput('');
    } 
    else if (result.matchType === 'MULTI' || result.matchType === 'AMBIGUOUS') {
      setDuplicateCandidates(result.candidates);
      setSelectedCandidateIds(result.candidates.map(s => s.student_id));
      setPendingTagForDuplicate(tagToUse);
      setPendingTextForDuplicate(text);
    }
  };

  const handleConfirmDuplicates = () => {
    const targets = duplicateCandidates.filter(s => selectedCandidateIds.includes(s.student_id));
    
    if (targets.length === 0) {
      setShowToast({ message: "Vui lòng chọn ít nhất 1 học sinh!", type: 'error' });
      setTimeout(() => setShowToast(null), 2000);
      return;
    }

    if (pendingTagForDuplicate) {
      targets.forEach(student => {
        saveAndTrackUndo(createEventPayload(student, pendingTagForDuplicate!, 'tap', pendingTextForDuplicate));
      });
      showFeedback(`Đã lưu ${targets.length} bạn: ${pendingTagForDuplicate.label}`);
    } else {
      const ids = targets.map(s => s.student_id);
      setSelectedStudents(ids);
      showFeedback("Đã chọn danh sách, vui lòng bấm thẻ ghi chú.");
    }
    
    setDuplicateCandidates([]);
    setSelectedCandidateIds([]);
    setPendingTagForDuplicate(null);
    setTextInput('');
  };

  const handleTextSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!textInput.trim()) return;
    processInput(textInput, 'text');
    // Clear input handled in processInput on success or manually here
    // But we might want to keep it if it failed.
  };

  const handleMicClick = () => {
    if (isRecording) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      if (recognitionRef.current) {
        setIsRecording(true);
        recognitionRef.current.start();
      } else {
        alert("Trình duyệt này không hỗ trợ nhập liệu giọng nói.");
      }
    }
  };

  const showFeedback = (msg: string) => {
    setShowToast({ message: msg, type: 'success' });
    setTimeout(() => setShowToast(null), 3000);
  };

  // --- Current Lesson Stats Panel Logic ---
  const displayPeriod = overridePeriod !== null ? overridePeriod : currentSlot?.period;
  
  // Filter events for current class, date, and period
  const currentLessonEvents = events.filter(e => 
    e.class_code === activeClass &&
    e.date === selectedDateStr &&
    e.period === displayPeriod
  ).sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()); // Latest first

  // Bulk Actions
  const handleClearViolations = () => {
    if (confirm("Bạn có chắc chắn muốn xóa TẤT CẢ lỗi vi phạm trong tiết này?")) {
      const ids = currentLessonEvents.filter(e => e.type === EventType.VIOLATION).map(e => e.event_id);
      onBulkDelete(ids);
      showFeedback("Đã xóa tất cả vi phạm trong tiết");
    }
  };

  const handleClearPraises = () => {
    if (confirm("Bạn có chắc chắn muốn xóa TẤT CẢ lời khen trong tiết này?")) {
      const ids = currentLessonEvents.filter(e => e.type === EventType.PRAISE).map(e => e.event_id);
      onBulkDelete(ids);
      showFeedback("Đã xóa tất cả lời khen trong tiết");
    }
  };


  // UI Helpers
  const allClasses = Array.from(new Set(timetable.map(t => t.class_code)));
  const currentChips = chipGroups[activeGroupIndex]?.chips || [];
  const chipsEnabled = selectedStudents.length > 0 || (filteredStudents.length === 1 && searchQuery.length > 0) || textInput.trim().length > 0;

  return (
    <div className={`flex flex-col gap-3 relative ${containerHeight}`}>
      
      {/* --- 1. Context Card & Stats Toggle --- */}
      <div className={`
        bg-white p-3 rounded-xl shadow-sm border flex flex-col gap-2 sticky top-0 z-30 transition-colors
        ${fixedClassName ? 'border-indigo-200 bg-indigo-50/50' : overridePeriod !== null ? 'border-orange-200 bg-orange-50' : 'border-indigo-100'}
      `}>
         {/* Top Row: Date + Period + Class */}
         <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
               {/* Date Picker */}
               <div className="relative">
                 <input 
                   type="date" 
                   value={selectedDateStr}
                   onChange={handleDateChange}
                   className="w-[110px] text-xs font-bold bg-white border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                 />
                 {selectedDateStr !== new Date().toISOString().split('T')[0] && (
                   <div className="absolute -top-1 -right-1 w-2 h-2 bg-orange-500 rounded-full"></div>
                 )}
               </div>

               <h2 className="text-xl font-bold text-indigo-700">{activeClass || "..."}</h2>

               {/* Period Selector */}
               <div className="relative">
                <button 
                  onClick={() => setShowPeriodSelector(!showPeriodSelector)}
                  className={`
                    flex items-center text-xs px-2 py-0.5 rounded border transition-colors
                    ${overridePeriod !== null 
                      ? 'bg-orange-100 text-orange-700 border-orange-200 font-bold' 
                      : 'bg-green-100 text-green-700 border-green-200'}
                  `}
                >
                  {overridePeriod !== null ? <Lock className="w-3 h-3 mr-1"/> : <Clock className="w-3 h-3 mr-1"/>}
                  <span>{displayPeriod ? `Tiết ${displayPeriod}` : 'Ngoài giờ'}</span>
                  <ChevronDown className="w-3 h-3 ml-1 opacity-50" />
                </button>

                {showPeriodSelector && (
                  <div className="absolute top-8 left-0 bg-white shadow-xl rounded-lg border border-gray-200 p-2 z-40 w-48 animate-in fade-in zoom-in-95 duration-100">
                    <p className="text-[10px] uppercase font-bold text-gray-400 mb-2 px-1">Chọn tiết dạy</p>
                    <div className="grid grid-cols-3 gap-1 mb-2">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(p => (
                        <button
                          key={p}
                          onClick={() => handleManualPeriodSelect(p)}
                          className={`
                            py-2 rounded text-sm font-medium transition-colors
                            ${displayPeriod === p 
                              ? 'bg-indigo-600 text-white shadow-md' 
                              : 'bg-gray-50 text-gray-700 hover:bg-gray-100'}
                          `}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                    <button 
                      onClick={handleResetAuto}
                      className="w-full flex items-center justify-center gap-2 py-2 text-xs font-bold text-green-600 bg-green-50 hover:bg-green-100 rounded"
                    >
                      <RotateCcw className="w-3 h-3" /> Tự động (Hôm nay)
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Clock & Search */}
            <div className="flex flex-col items-end gap-1">
               {/* Clock & Network Status */}
               <div className="flex items-center gap-1.5">
                  <span className={`text-xs font-mono font-bold ${isNetworkTime ? 'text-indigo-600' : 'text-gray-500'}`}>
                    {now.toLocaleTimeString('vi-VN', {hour12: false})}
                  </span>
                  {isOnline ? (
                    <Wifi className="w-3 h-3 text-green-500" />
                  ) : (
                    <WifiOff className="w-3 h-3 text-red-500" />
                  )}
               </div>

               <div className="flex items-center gap-2">
                 <button 
                   onClick={() => setShowStatsPanel(!showStatsPanel)}
                   className={`p-1 rounded-full border ${showStatsPanel ? 'bg-indigo-100 border-indigo-300 text-indigo-700' : 'bg-gray-50 border-gray-200 text-gray-500'}`}
                   title="Thống kê tiết này"
                 >
                   <BarChart2 className="w-4 h-4" />
                 </button>
                 <div className="relative w-28 lg:w-40">
                   <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                   <input 
                     type="text" 
                     placeholder="Tìm tên..." 
                     className="pl-7 pr-2 py-1.5 w-full bg-white rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 border border-gray-200"
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                   />
                 </div>
               </div>
            </div>
         </div>

         <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center truncate">
               <span className="font-medium mr-2">{activeSubject || '(Trống)'}</span>
               {currentSlot?.room && <span className="bg-orange-100 text-orange-800 text-[10px] px-1.5 rounded">{currentSlot.room}</span>}
               {fixedClassName && <span className="ml-2 text-xs text-indigo-500 italic hidden sm:inline">(GVCN)</span>}
            </div>
            {!fixedClassName && (
               <button 
                 onClick={() => setShowOverrideClass(!showOverrideClass)}
                 className="text-xs text-indigo-600 hover:underline flex items-center"
               >
                 Đổi lớp <ChevronDown className="w-3 h-3 ml-1" />
               </button>
            )}
         </div>

         {/* Class Override Dropdown */}
         {showOverrideClass && !fixedClassName && (
          <div className="absolute top-14 left-2 bg-white shadow-xl rounded-lg border border-gray-200 p-2 z-30 w-48 max-h-60 overflow-y-auto">
             <p className="text-[10px] font-bold text-gray-400 mb-2 uppercase px-2">Chọn lớp khác</p>
             {allClasses.map(c => (
               <button 
                key={c} 
                className={`block w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded ${activeClass === c ? 'bg-indigo-50 text-indigo-700 font-bold' : ''}`}
                onClick={() => {
                  setActiveClass(c);
                  setShowOverrideClass(false);
                  setIsLocked(true); 
                  clearSelection();
                }}
               >
                 {c}
               </button>
             ))}
          </div>
         )}
      </div>

      {/* --- NEW: Current Lesson Stats Panel (Expanded List View) --- */}
      {showStatsPanel && (
        <div className="bg-white rounded-xl shadow-sm border border-indigo-100 p-3 animate-in slide-in-from-top-2 flex flex-col max-h-[40vh]">
           <div className="flex justify-between items-center mb-2 border-b border-gray-100 pb-2">
              <h3 className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
                Nhật ký tiết này 
                <span className="bg-indigo-100 text-indigo-700 rounded-full px-2 text-[10px]">{currentLessonEvents.length}</span>
              </h3>
              <div className="flex gap-2">
                 <button 
                   onClick={handleClearViolations}
                   className="text-[10px] font-bold text-red-600 bg-red-50 hover:bg-red-100 px-2 py-1 rounded border border-red-200"
                 >
                   Xóa hết Lỗi
                 </button>
                 <button 
                   onClick={handleClearPraises}
                   className="text-[10px] font-bold text-green-600 bg-green-50 hover:bg-green-100 px-2 py-1 rounded border border-green-200"
                 >
                   Xóa hết Khen
                 </button>
              </div>
           </div>

           <div className="flex-1 overflow-y-auto min-h-0 space-y-2">
             {currentLessonEvents.length === 0 ? (
               <p className="text-xs text-gray-400 italic text-center py-2">Chưa có ghi nhận nào trong tiết này.</p>
             ) : (
               currentLessonEvents.map(event => (
                 <div key={event.event_id} className="flex items-center justify-between bg-gray-50 border border-gray-100 rounded-lg p-2 hover:bg-white hover:shadow-sm transition-all group">
                    <div className="flex-1 min-w-0">
                       <p className="text-xs font-bold text-gray-800 truncate">{event.student_name_snapshot}</p>
                       <div className="flex items-center gap-1.5 mt-0.5">
                         <span className={`text-[10px] px-1 rounded font-semibold ${
                           event.type === EventType.VIOLATION ? 'bg-red-100 text-red-700' : 
                           event.type === EventType.PRAISE ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-700'
                         }`}>
                           {event.tags.split('|')[0]}
                         </span>
                         {event.synced && <span className="text-[9px] text-gray-400 italic">(Đã sync)</span>}
                       </div>
                    </div>
                    <button 
                      onClick={() => onDeleteEvent(event.event_id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                 </div>
               ))
             )}
           </div>
        </div>
      )}

      {/* --- Mic Recording Overlay --- */}
      {isRecording && (
        <div className="bg-red-500 text-white p-3 rounded-lg flex items-center justify-between animate-pulse shadow-lg z-20">
          <div className="flex items-center gap-3">
             <Mic className="w-5 h-5" />
             <span className="font-medium text-sm">Đang nghe...</span>
          </div>
          <button onClick={() => { if(recognitionRef.current) recognitionRef.current.stop(); setIsRecording(false); }} className="bg-white/20 p-1 rounded-full">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* --- 4. Main Grid: Students --- */}
      <div className="flex-1 overflow-y-auto bg-white rounded-xl shadow-sm border border-gray-100 p-2 lg:p-4">
        {filteredStudents.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
             <Users className="w-10 h-10 mb-2 opacity-20" />
             <p className="text-sm">Không tìm thấy học sinh {activeClass ? `lớp ${activeClass}` : ''}.</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 lg:gap-3 pb-20">
            {filteredStudents.map(student => {
              const isSelected = selectedStudents.includes(student.student_id);
              const uniqueName = getUniqueName(student, students);
              const shortName = student.full_name.split(' ').pop(); 
              
              return (
                <button
                  key={student.student_id}
                  onClick={() => handleStudentToggle(student.student_id)}
                  className={`
                    relative p-2 rounded-xl border text-center transition-all duration-150 flex flex-col items-center gap-1.5
                    ${isSelected 
                      ? 'border-indigo-500 bg-indigo-50 shadow-md ring-2 ring-indigo-500 transform scale-95' 
                      : 'border-gray-100 hover:border-indigo-200 hover:bg-gray-50'}
                  `}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shadow-sm
                    ${isSelected ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-500'}
                  `}>
                    {student.photo_url ? (
                      <img src={student.photo_url} alt="" className="w-full h-full rounded-full object-cover"/>
                    ) : (
                      shortName?.charAt(0)
                    )}
                  </div>
                  <div className="w-full">
                    <p className={`text-xs font-bold truncate ${isSelected ? 'text-indigo-900' : 'text-gray-700'}`}>
                      {student.full_name}
                    </p>
                    {uniqueName.includes('(') && (
                       <p className="text-[10px] text-gray-400">{uniqueName.split('(')[1].replace(')', '')}</p>
                    )}
                  </div>
                  {isSelected && (
                    <div className="absolute top-1 right-1 bg-indigo-600 text-white rounded-full p-0.5">
                      <Check className="w-2.5 h-2.5" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* --- 5. Action Bar (Chips & Input & Undo) --- */}
      <div className="bg-white rounded-t-xl shadow-[0_-4px_20px_rgba(0,0,0,0.08)] border-t border-gray-100 sticky bottom-0 z-20 flex flex-col">
         <div className="flex border-b border-gray-100 overflow-x-auto scrollbar-hide">
            {chipGroups.map((group, idx) => (
              <button
                key={group.id}
                onClick={() => setActiveGroupIndex(idx)}
                className={`px-3 py-2 text-xs font-bold whitespace-nowrap border-b-2 transition-colors ${
                  idx === activeGroupIndex 
                    ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50' 
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {group.name}
              </button>
            ))}
         </div>

         <div className="p-2 flex flex-wrap gap-2 max-h-32 overflow-y-auto">
            {currentChips.map(tag => (
              <button
                key={tag.id}
                onClick={() => handleChipClick(tag)}
                className={`
                   flex-shrink-0 px-3 py-2 rounded-lg text-xs font-bold transition-all shadow-sm border border-transparent
                   ${tag.color}
                   ${!chipsEnabled ? 'opacity-40 grayscale' : 'hover:scale-105 hover:shadow-md active:scale-95'}
                `}
              >
                {tag.label}
              </button>
            ))}
         </div>

         <div className="p-2 bg-gray-50 flex items-center gap-2 border-t border-gray-100">
            {/* Undo Button */}
            {lastEventId && (
              <button
                onClick={handleUndo}
                className="flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center border border-gray-200 bg-white text-gray-600 hover:text-red-600 hover:border-red-200 shadow-sm"
                title="Hoàn tác (Xóa ghi chú vừa nhập)"
              >
                <Undo2 className="w-5 h-5" />
              </button>
            )}

            <div className="relative flex-1">
              <input 
                ref={inputRef}
                type="text" 
                placeholder={selectedStudents.length > 0 ? "Nhập ghi chú riêng..." : "Nhập nhanh: \"Tuấn 14/5 nói chuyện\""}
                className="w-full pl-3 pr-10 py-2.5 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm shadow-inner bg-white"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleTextSubmit()}
              />
              <button 
                onClick={() => handleTextSubmit()}
                disabled={!textInput.trim()}
                className={`absolute right-1.5 top-1.5 p-1.5 rounded-full transition-colors ${textInput.trim() ? 'bg-indigo-600 text-white' : 'text-gray-300'}`}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>

            <button 
              onClick={handleMicClick}
              className={`
                flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center shadow-md transition-colors border-2
                ${isRecording ? 'bg-red-500 border-red-600 text-white animate-pulse' : 'bg-white border-indigo-100 text-indigo-600 hover:bg-indigo-50'}
              `}
            >
              <Mic className="w-5 h-5" />
            </button>
         </div>
      </div>

      {/* --- 6. Duplicate/Multi Resolution Modal --- */}
      {duplicateCandidates.length > 0 && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
           <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-5">
              <div className="flex items-center gap-3 mb-4 text-indigo-600">
                 <Users className="w-6 h-6" />
                 <h3 className="font-bold text-lg">Xác nhận danh sách</h3>
              </div>
              <p className="text-gray-600 mb-4 text-sm">
                {pendingTagForDuplicate 
                  ? `Tìm thấy ${duplicateCandidates.length} bạn. Vui lòng chọn (tick) những bạn muốn lưu.`
                  : `Tìm thấy ${duplicateCandidates.length} bạn. Vui lòng chọn danh sách rồi bấm thẻ.`
                }
              </p>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                 {duplicateCandidates.map(student => {
                   const isChecked = selectedCandidateIds.includes(student.student_id);
                   return (
                     <button 
                       key={student.student_id}
                       onClick={() => setSelectedCandidateIds(prev => prev.includes(student.student_id) ? prev.filter(id => id !== student.student_id) : [...prev, student.student_id])}
                       className={`w-full p-3 text-left border rounded-lg flex justify-between items-center group transition-colors
                          ${isChecked 
                            ? 'bg-indigo-50 border-indigo-300 ring-1 ring-indigo-300' 
                            : 'hover:bg-gray-50 border-gray-200'}
                       `}
                     >
                       <div>
                         <p className={`font-bold ${isChecked ? 'text-indigo-900' : 'text-gray-800'}`}>{student.full_name}</p>
                         <p className="text-xs text-gray-500">
                           {student.class_code} - {student.dob ? student.dob.split('-').reverse().join('/') : '---'}
                         </p>
                       </div>
                       <div className={`w-5 h-5 rounded border flex items-center justify-center
                          ${isChecked ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300 bg-white'}
                       `}>
                          {isChecked && <Check className="w-3.5 h-3.5 text-white" />}
                       </div>
                     </button>
                   );
                 })}
              </div>
              
              <div className="flex gap-2 mt-4">
                 <button 
                    onClick={() => {
                       setDuplicateCandidates([]);
                       setSelectedCandidateIds([]);
                       setPendingTagForDuplicate(null);
                    }}
                    className="flex-1 py-2 text-gray-500 hover:bg-gray-100 rounded-lg text-sm border border-gray-200"
                  >
                    Hủy bỏ
                  </button>
                  <button 
                    onClick={handleConfirmDuplicates}
                    className="flex-1 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 flex items-center justify-center gap-1"
                  >
                    {pendingTagForDuplicate ? `Lưu (${selectedCandidateIds.length})` : `Chọn (${selectedCandidateIds.length})`}
                  </button>
              </div>
           </div>
        </div>
      )}

      {/* --- 7. Toast Notification --- */}
      {showToast && (
         <div className="fixed bottom-36 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-4 py-3 rounded-lg shadow-xl z-40 flex items-center gap-3 min-w-[300px] justify-between">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-400" />
              <span className="text-sm font-medium">{showToast.message}</span>
            </div>
         </div>
      )}

    </div>
  );
};

export default QuickLog;
