import React from 'react';
import { TimetableRow } from '../types';

interface TimetableProps {
  timetable: TimetableRow[];
}

const Timetable: React.FC<TimetableProps> = ({ timetable }) => {
  // Group by Day then Period
  const days = [2, 3, 4, 5, 6]; // Mon to Fri
  const periods = [1, 2, 3, 4, 5, 6, 7, 8, 9];

  const getCell = (day: number, period: number) => {
    return timetable.find(t => t.day_of_week === day && t.period === period);
  };

  const getDayName = (d: number) => {
    // 2-8 to T2-CN
    return `Thứ ${d}`;
  };

  return (
    <div className="space-y-4">
       <h2 className="text-xl font-bold text-gray-800">Thời khóa biểu tuần này</h2>
       <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
         <table className="w-full text-sm border-collapse">
           <thead>
             <tr>
               <th className="p-3 border-b border-r bg-gray-50 text-gray-500 w-16">Tiết</th>
               {days.map(d => (
                 <th key={d} className="p-3 border-b border-gray-100 bg-gray-50 min-w-[140px] text-gray-700">
                   {getDayName(d)}
                 </th>
               ))}
             </tr>
           </thead>
           <tbody>
             {periods.map(p => (
               <tr key={p}>
                 <td className="p-3 border-r border-gray-100 text-center font-medium text-gray-400 bg-gray-50/50">
                   {p}
                 </td>
                 {days.map(d => {
                   const cell = getCell(d, p);
                   return (
                     <td key={`${d}-${p}`} className="p-2 border border-gray-100 align-top h-24">
                       {cell ? (
                         <div className="bg-indigo-50 p-2 rounded-lg border border-indigo-100 h-full flex flex-col justify-between">
                            <div>
                              <p className="font-bold text-indigo-700">{cell.class_code}</p>
                              <p className="text-xs text-indigo-600 line-clamp-2">{cell.subject}</p>
                            </div>
                            <div className="mt-2 flex justify-between items-end">
                               <span className="text-[10px] bg-white px-1.5 py-0.5 rounded text-gray-500 border border-gray-100">
                                 {cell.room}
                               </span>
                               <span className="text-[10px] text-gray-400">
                                 {cell.start_time}
                               </span>
                            </div>
                         </div>
                       ) : (
                         <div className="h-full w-full"></div>
                       )}
                     </td>
                   );
                 })}
               </tr>
             ))}
           </tbody>
         </table>
       </div>
    </div>
  );
};

export default Timetable;