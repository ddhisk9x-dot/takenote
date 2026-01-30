
import React, { useState } from 'react';
import { AppEvent, EventType } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend
} from 'recharts';
import { Clock, TrendingUp, AlertCircle, Award, FileText, ArrowLeft, Trash2 } from 'lucide-react';
import { formatDate, formatTime } from '../utils';

interface DashboardProps {
  events: AppEvent[];
  onDeleteEvent?: (eventId: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ events, onDeleteEvent }) => {
  const [filterType, setFilterType] = useState<'ALL' | 'VIOLATION' | 'PRAISE'>('ALL');

  // 0. Safety Check
  if (!events || events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-gray-500">
        <FileText className="w-16 h-16 mb-4 text-gray-300" />
        <p className="text-lg font-medium">Chưa có dữ liệu báo cáo</p>
        <p className="text-sm">Hãy ghi nhận các hoạt động để xem thống kê tại đây.</p>
      </div>
    );
  }

  // 1. Calculate Summary Stats
  const totalEvents = events.length;
  const totalViolations = events.filter(e => e.type === EventType.VIOLATION).length;
  const totalPraise = events.filter(e => e.type === EventType.PRAISE).length;
  
  // 2. Events by Day (Last 7 days or current week)
  const eventsByDateMap = events.reduce((acc, curr) => {
    // Format: DD/MM (Robust parsing)
    if (!curr.date) return acc;
    const parts = curr.date.split('-'); // YYYY-MM-DD
    if (parts.length === 3) {
        const dateStr = `${parseInt(parts[2])}/${parseInt(parts[1])}`; // d/m
        acc[dateStr] = (acc[dateStr] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);
  
  const eventsByDateData = Object.keys(eventsByDateMap).map(date => ({
    name: date,
    count: eventsByDateMap[date]
  })); 

  // 3. Top Tags
  const tagCountMap = events.reduce((acc, curr) => {
    if (!curr.tags) return acc;
    const tags = curr.tags.split('|');
    tags.forEach(t => {
       acc[t] = (acc[t] || 0) + 1;
    });
    return acc;
  }, {} as Record<string, number>);
  
  const tagData = Object.keys(tagCountMap)
    .map(tag => ({ name: tag, value: tagCountMap[tag] }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  const COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#8b5cf6'];

  // 4. Detailed List for filtered view
  const filteredEvents = filterType === 'ALL' 
    ? events 
    : events.filter(e => e.type === (filterType === 'VIOLATION' ? EventType.VIOLATION : EventType.PRAISE));
  
  const sortedFilteredEvents = [...filteredEvents].sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  // Render content based on view mode
  if (filterType !== 'ALL') {
      return (
          <div className="space-y-4 pb-20">
              <div className="flex items-center gap-4">
                  <button onClick={() => setFilterType('ALL')} className="p-2 hover:bg-gray-200 rounded-full">
                      <ArrowLeft className="w-6 h-6 text-gray-600" />
                  </button>
                  <h2 className="text-2xl font-bold text-gray-800">
                      Chi tiết {filterType === 'VIOLATION' ? 'Vi phạm' : 'Khen thưởng'}
                  </h2>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="divide-y divide-gray-100">
                      {sortedFilteredEvents.length === 0 ? (
                          <div className="p-8 text-center text-gray-400">Không có dữ liệu.</div>
                      ) : (
                          sortedFilteredEvents.map(event => (
                              <div key={event.event_id} className="p-4 flex gap-4 hover:bg-gray-50 transition-colors group">
                                  <div className={`p-2 rounded-full flex-shrink-0 mt-1 ${
                                      event.type === EventType.VIOLATION ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-500'
                                  }`}>
                                      {event.type === EventType.VIOLATION ? <AlertCircle className="w-5 h-5"/> : <Award className="w-5 h-5"/>}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                      <div className="flex justify-between items-start">
                                          <p className="font-bold text-gray-900 truncate">{event.student_name_snapshot}</p>
                                          <span className="text-xs text-gray-400 whitespace-nowrap ml-2">
                                              {formatDate(event.date)}
                                          </span>
                                      </div>
                                      <p className="text-sm text-gray-600 mt-0.5">{event.raw_text}</p>
                                      <div className="flex items-center gap-2 mt-2">
                                          <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600">Lớp: {event.class_code}</span>
                                          {event.synced && <span className="text-[10px] text-gray-400 italic">(Đã sync)</span>}
                                      </div>
                                  </div>
                                  {onDeleteEvent && (
                                      <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            // Call onDeleteEvent directly, confirm logic is in App.tsx
                                            if(onDeleteEvent) onDeleteEvent(event.event_id);
                                        }}
                                        className="self-center p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="Xóa"
                                      >
                                          <Trash2 className="w-5 h-5" />
                                      </button>
                                  )}
                              </div>
                          ))
                      )}
                  </div>
              </div>
          </div>
      );
  }

  return (
    <div className="space-y-6 pb-20"> {/* pb-20 for scrolling space */}
      <h2 className="text-2xl font-bold text-gray-800">Báo cáo tổng quan</h2>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
         <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4 cursor-default">
            <div className="p-3 bg-indigo-100 text-indigo-600 rounded-lg">
               <TrendingUp className="w-6 h-6" />
            </div>
            <div>
               <p className="text-sm text-gray-500">Tổng phiếu ghi</p>
               <h3 className="text-2xl font-bold text-gray-900">{totalEvents}</h3>
            </div>
         </div>
         <button 
            onClick={() => setFilterType('VIOLATION')}
            className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4 hover:border-red-300 hover:bg-red-50/30 transition-colors text-left"
         >
            <div className="p-3 bg-red-100 text-red-600 rounded-lg">
               <AlertCircle className="w-6 h-6" />
            </div>
            <div>
               <p className="text-sm text-gray-500 font-medium">Vi phạm</p>
               <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                   {totalViolations} 
                   <span className="text-xs font-normal text-red-500 bg-red-50 px-2 py-0.5 rounded border border-red-100">Xem chi tiết</span>
               </h3>
            </div>
         </button>
         <button 
            onClick={() => setFilterType('PRAISE')}
            className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4 hover:border-green-300 hover:bg-green-50/30 transition-colors text-left"
         >
            <div className="p-3 bg-green-100 text-green-600 rounded-lg">
               <Award className="w-6 h-6" />
            </div>
            <div>
               <p className="text-sm text-gray-500 font-medium">Khen thưởng</p>
               <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                   {totalPraise}
                   <span className="text-xs font-normal text-green-500 bg-green-50 px-2 py-0.5 rounded border border-green-100">Xem chi tiết</span>
               </h3>
            </div>
         </button>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Activity Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-96 flex flex-col">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Hoạt động theo ngày</h3>
          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={eventsByDateData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{fontSize: 12}} />
                <YAxis allowDecimals={false} tick={{fontSize: 12}} />
                <Tooltip 
                  cursor={{fill: 'transparent'}} 
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}}
                />
                <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Tags Pie Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-96 flex flex-col">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Top hành vi ghi nhận</h3>
          <div className="flex-1 w-full min-h-0">
             {tagData.length > 0 ? (
               <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={tagData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {tagData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}} />
                  <Legend 
                    layout="horizontal" 
                    verticalAlign="bottom" 
                    align="center"
                    iconType="circle"
                    formatter={(value, entry: any) => <span className="text-xs text-gray-600 ml-1">{value} ({entry.payload.value})</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
             ) : (
               <div className="flex items-center justify-center h-full text-gray-400 text-sm">Chưa có dữ liệu thẻ</div>
             )}
          </div>
        </div>

      </div>

      {/* Recent Activity Feed */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800">Nhật ký gần đây</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {events.slice().reverse().slice(0, 5).map((event) => (
            <div key={event.event_id} className="px-6 py-4 flex items-center justify-between group">
               <div className="flex items-center gap-3">
                 <div className={`p-2 rounded-full flex-shrink-0 ${
                   event.type === 'VIOLATION' ? 'bg-red-50 text-red-500' : 
                   event.type === 'PRAISE' ? 'bg-green-50 text-green-500' : 'bg-gray-100 text-gray-500'
                 }`}>
                   {event.type === 'VIOLATION' ? <AlertCircle className="w-4 h-4"/> : 
                    event.type === 'PRAISE' ? <Award className="w-4 h-4"/> : <Clock className="w-4 h-4"/>}
                 </div>
                 <div className="min-w-0">
                   <p className="text-sm font-medium text-gray-900 truncate">{event.raw_text}</p>
                   <p className="text-xs text-gray-500 truncate">{event.student_name_snapshot} • {event.class_code}</p>
                 </div>
               </div>
               <div className="flex items-center gap-2">
                 <span className="text-xs text-gray-400 whitespace-nowrap">{event.time.slice(0, 5)}</span>
                 {onDeleteEvent && (
                    <button 
                      onClick={(e) => {
                          e.stopPropagation();
                          if(onDeleteEvent) onDeleteEvent(event.event_id);
                      }}
                      className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Xóa"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                 )}
               </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
