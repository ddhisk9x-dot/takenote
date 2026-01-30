import React, { useState } from 'react';
import { Student, AppEvent, EventType } from '../types';
import { ArrowLeft, User, Calendar, AlertCircle, Award, MessageSquare } from 'lucide-react';
import { getUniqueName } from '../constants';
import { formatDate, formatTime } from '../utils';

interface StudentDetailProps {
  student: Student;
  events: AppEvent[];
  allStudents: Student[];
  onBack: () => void;
}

const StudentDetail: React.FC<StudentDetailProps> = ({ student, events, allStudents, onBack }) => {
  const [filterType, setFilterType] = useState<string>('ALL');

  // Filter events for this student
  const studentEvents = events.filter(e => e.student_id === student.student_id);

  // Apply Type Filter
  const filteredEvents = studentEvents.filter(e => {
    if (filterType === 'ALL') return true;
    return e.type === filterType;
  });

  // Sort reverse chronological
  const sortedEvents = [...filteredEvents].sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const getIcon = (type: string) => {
    switch(type) {
      case EventType.VIOLATION: return <AlertCircle className="w-5 h-5 text-red-500" />;
      case EventType.PRAISE: return <Award className="w-5 h-5 text-green-500" />;
      default: return <MessageSquare className="w-5 h-5 text-gray-500" />;
    }
  };

  const getTypeName = (type: string) => {
    switch(type) {
        case EventType.VIOLATION: return 'Vi phạm';
        case EventType.PRAISE: return 'Khen thưởng';
        case EventType.NOTE: return 'Ghi chú';
        default: return type;
      }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 hover:bg-gray-200 rounded-full">
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </button>
        <h2 className="text-2xl font-bold text-gray-800">Hồ sơ học sinh</h2>
      </div>

      {/* Profile Card */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-6 items-center md:items-start">
        <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center text-3xl text-gray-500 font-bold overflow-hidden">
          {student.photo_url ? (
            <img src={student.photo_url} alt="" className="w-full h-full object-cover" />
          ) : (
            student.full_name.charAt(0)
          )}
        </div>
        <div className="flex-1 text-center md:text-left space-y-2">
           <h3 className="text-xl font-bold text-gray-900">{getUniqueName(student, allStudents)}</h3>
           <p className="text-gray-500">Lớp: <span className="font-semibold text-indigo-600">{student.class_code}</span></p>
           <p className="text-sm text-gray-500">Mã HS: {student.student_id}</p>
           {student.profile_note && (
             <div className="mt-2 inline-block bg-yellow-50 text-yellow-800 px-3 py-1 rounded-lg text-sm border border-yellow-100">
               ⚠️ Ghi chú: {student.profile_note}
             </div>
           )}
        </div>
        
        {/* Quick Stats */}
        <div className="flex gap-4">
            <div className="text-center p-3 bg-red-50 rounded-lg min-w-[80px]">
                <p className="text-2xl font-bold text-red-600">
                    {studentEvents.filter(e => e.type === EventType.VIOLATION).length}
                </p>
                <p className="text-xs text-red-800 uppercase font-semibold">Vi phạm</p>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg min-w-[80px]">
                <p className="text-2xl font-bold text-green-600">
                    {studentEvents.filter(e => e.type === EventType.PRAISE).length}
                </p>
                <p className="text-xs text-green-800 uppercase font-semibold">Khen</p>
            </div>
        </div>
      </div>

      {/* Timeline Controls */}
      <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-600" /> Hoạt động
          </h3>
          <select 
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
              <option value="ALL">Tất cả</option>
              <option value={EventType.VIOLATION}>Vi phạm</option>
              <option value={EventType.PRAISE}>Khen thưởng</option>
              <option value={EventType.NOTE}>Ghi chú</option>
          </select>
      </div>

      {/* Timeline List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          {sortedEvents.length === 0 ? (
              <div className="p-8 text-center text-gray-400">Chưa có ghi nhận nào.</div>
          ) : (
              <div className="divide-y divide-gray-100">
                  {sortedEvents.map(event => (
                      <div key={event.event_id} className="p-4 flex gap-4 hover:bg-gray-50 transition-colors">
                          <div className="flex-shrink-0 mt-1">
                              {getIcon(event.type as string)}
                          </div>
                          <div className="flex-1">
                              <div className="flex justify-between items-start">
                                  <p className="font-semibold text-gray-900">{event.raw_text}</p>
                                  <span className="text-xs text-gray-400 whitespace-nowrap ml-2">
                                      {formatDate(event.date)} {formatTime(event.timestamp)}
                                  </span>
                              </div>
                              <p className="text-sm text-gray-600 mt-1">
                                  <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold uppercase mr-2 tracking-wide
                                    ${event.type === EventType.VIOLATION ? 'bg-red-100 text-red-700' : 
                                      event.type === EventType.PRAISE ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}
                                  `}>
                                      {getTypeName(event.type as string)}
                                  </span>
                                  <span className="text-xs text-gray-500">Môn: {event.subject || 'SHCN'}</span>
                              </p>
                              {event.tags && (
                                  <div className="flex gap-1 mt-2">
                                      {event.tags.split('|').map((tag, idx) => (
                                          <span key={idx} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                                              #{tag}
                                          </span>
                                      ))}
                                  </div>
                              )}
                          </div>
                      </div>
                  ))}
              </div>
          )}
      </div>
    </div>
  );
};

export default StudentDetail;