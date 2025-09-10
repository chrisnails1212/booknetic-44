import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  BarChart3, 
  Calendar, 
  Users, 
  Settings, 
  MapPin, 
  Tag,
  Gift,
  FileText,
  Workflow,
  Receipt,
  ClipboardList,
  Palette,
  Link as LinkIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';

const sidebarItems = [
  { name: 'Dashboard', href: '/', icon: BarChart3 },
  { name: 'Reports', href: '/reports', icon: FileText },
  { name: 'Appointments', href: '/appointments', icon: Calendar },
  { name: 'Calendar', href: '/calendar', icon: Calendar },
  { name: 'Customers', href: '/customers', icon: Users },
  { name: 'Services', href: '/services', icon: Settings },
  { name: 'Staff', href: '/staff', icon: Users },
  { name: 'Locations', href: '/locations', icon: MapPin },
  { name: 'Coupons', href: '/coupons', icon: Tag },
  { name: 'Giftcards', href: '/giftcards', icon: Gift },
  { name: 'Taxes', href: '/taxes', icon: Receipt },
  { name: 'Workflow', href: '/workflow', icon: Workflow },
  { name: 'Invoices', href: '/invoices', icon: FileText },
  { name: 'Custom Forms', href: '/custom-forms', icon: ClipboardList },
  { name: 'Appearance', href: '/appearance', icon: Palette },
  { name: 'Booking Link', href: '/booking-link', icon: LinkIcon },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export const Sidebar = () => {
  const location = useLocation();

  return (
    <div className="fixed left-0 top-0 h-full w-64 bg-slate-800 text-white overflow-y-auto">
      {/* Logo */}
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">B</span>
          </div>
          <span className="text-xl font-semibold">Booknetic</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-2">
        {sidebarItems.map((item) => {
          const isActive = location.pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 hover:bg-slate-700",
                isActive ? "bg-blue-600 text-white" : "text-slate-300 hover:text-white"
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-sm font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};
