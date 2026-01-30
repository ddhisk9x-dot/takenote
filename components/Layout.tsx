
import React from 'react';
import { Menu, LayoutDashboard, Zap, Calendar, Users, Settings, UserCircle, ZoomIn, ZoomOut, Monitor } from 'lucide-react';
import { UserProfile } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  role: 'GVBM' | 'GVCN';
  userProfile: UserProfile;
  onUpdateUserProfile: (profile: UserProfile) => void; // Added prop to update profile settings directly
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange, role, userProfile, onUpdateUserProfile }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Tổng quan', icon: LayoutDashboard },
    { id: 'quicklog', label: 'Ghi nhanh', icon: Zap },
    { id: 'timetable', label: 'TKB', icon: Calendar },
    { id: 'students', label: 'Học sinh', icon: Users },
    { id: 'settings', label: 'Cài đặt', icon: Settings },
  ];

  if (role === 'GVCN') {
    // Insert before Settings
    menuItems.splice(4, 0, { id: 'homeroom', label: 'Chủ nhiệm', icon: UserCircle });
  }

  // Handle Scale Change
  const currentScale = userProfile.uiScale || 100;
  
  const setScale = (newScale: number) => {
    onUpdateUserProfile({ ...userProfile, uiScale: newScale });
  };

  // Sticky header + Mobile Nav
  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out flex flex-col
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>
        <div className="h-16 flex items-center px-6 border-b border-gray-100 flex-shrink-0">
          <span className="text-xl font-bold text-indigo-600">Trợ Lý Giáo Viên</span>
        </div>
        
        <nav className="p-4 space-y-1 flex-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onTabChange(item.id);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center px-3 py-3 text-sm font-medium rounded-md transition-colors ${
                  isActive 
                    ? 'bg-indigo-50 text-indigo-700' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className={`mr-3 h-5 w-5 ${isActive ? 'text-indigo-600' : 'text-gray-400'}`} />
                {item.label}
              </button>
            );
          })}

          {/* Scale Controls in Mobile Menu */}
          <div className="mt-6 pt-6 border-t border-gray-100 lg:hidden">
             <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Hiển thị (Zoom)</p>
             <div className="flex items-center gap-2 px-3">
                <button 
                  onClick={() => setScale(75)}
                  className={`flex-1 py-2 text-xs font-bold rounded border ${currentScale === 75 ? 'bg-indigo-100 border-indigo-200 text-indigo-700' : 'bg-white border-gray-200 text-gray-600'}`}
                >
                  Nhỏ (75%)
                </button>
                <button 
                  onClick={() => setScale(100)}
                  className={`flex-1 py-2 text-xs font-bold rounded border ${currentScale === 100 ? 'bg-indigo-100 border-indigo-200 text-indigo-700' : 'bg-white border-gray-200 text-gray-600'}`}
                >
                  Chuẩn
                </button>
             </div>
          </div>
        </nav>

        <div className="p-4 border-t border-gray-100 flex-shrink-0">
          <div className="flex items-center">
             <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">
               {userProfile.teacherName.charAt(0)}
             </div>
             <div className="ml-3 min-w-0">
               <p className="text-sm font-medium text-gray-700 truncate">{userProfile.teacherName}</p>
               <p className="text-xs text-gray-500">{role}</p>
             </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between h-16 px-4 bg-white border-b border-gray-200">
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 -ml-2 text-gray-600 rounded-md hover:bg-gray-100"
          >
            <Menu className="h-6 w-6" />
          </button>
          <span className="font-semibold text-gray-900 truncate">
            {menuItems.find(m => m.id === activeTab)?.label}
          </span>
          
          {/* Quick Zoom Toggle on Header */}
          <button 
             onClick={() => setScale(currentScale === 100 ? 80 : 100)}
             className="p-2 text-gray-500 hover:bg-gray-100 rounded-md"
             title={currentScale === 100 ? "Thu nhỏ giao diện" : "Phóng to giao diện"}
          >
             {currentScale === 100 ? <ZoomOut className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
          </button>
        </header>

        {/* Scrollable Area */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
