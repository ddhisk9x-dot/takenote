import React, { useState } from 'react';
import { Student } from '../types';
import { getUniqueName } from '../constants';
import { Search, Eye } from 'lucide-react';

interface StudentListProps {
  students: Student[];
  onSelectStudent: (student: Student) => void;
}

const StudentList: React.FC<StudentListProps> = ({ students, onSelectStudent }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState('');

  const allClasses = Array.from(new Set(students.map(s => s.class_code)));

  const filtered = students.filter(s => {
    const matchesSearch = s.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          s.aliases.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = classFilter ? s.class_code === classFilter : true;
    return matchesSearch && matchesClass;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
         <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Tìm học sinh..." 
              className="pl-9 pr-4 py-2 w-full bg-gray-50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 border border-gray-200"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
         </div>
         <select 
            className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
         >
            <option value="">Tất cả lớp</option>
            {allClasses.map(c => <option key={c} value={c}>{c}</option>)}
         </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50">
              <tr>
                <th className="px-6 py-3">Mã HS</th>
                <th className="px-6 py-3">Họ tên</th>
                <th className="px-6 py-3">Lớp</th>
                <th className="px-6 py-3">Giới tính</th>
                <th className="px-6 py-3">Ghi chú</th>
                <th className="px-6 py-3">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s, idx) => (
                <tr 
                  key={s.student_id} 
                  className="border-b hover:bg-gray-50 cursor-pointer"
                  onClick={() => onSelectStudent(s)}
                >
                  <td className="px-6 py-4 font-medium text-gray-900">{s.student_id}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                       {s.photo_url && <img src={s.photo_url} alt="" className="w-6 h-6 rounded-full"/>}
                       {getUniqueName(s, students)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded text-xs font-bold">
                      {s.class_code}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500">{s.gender === 'M' ? 'Nam' : 'Nữ'}</td>
                  <td className="px-6 py-4 text-gray-500 italic">{s.profile_note || '-'}</td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectStudent(s);
                      }}
                      className="text-indigo-600 hover:text-indigo-800 flex items-center"
                    >
                      <Eye className="w-4 h-4 mr-1" /> Chi tiết
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                   <td colSpan={6} className="px-6 py-8 text-center text-gray-500">Không tìm thấy học sinh.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StudentList;