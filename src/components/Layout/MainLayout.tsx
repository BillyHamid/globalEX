import { useState, createContext, useContext } from 'react';
import { Outlet } from 'react-router-dom';
import { TopNavbar } from './TopNavbar';
import { Sidebar } from './Sidebar';
import { AutoNotificationSubscriber } from '@/components/notifications/AutoNotificationSubscriber';

// Context pour le menu mobile
interface MobileMenuContextType {
  isOpen: boolean;
  toggle: () => void;
  close: () => void;
}

const MobileMenuContext = createContext<MobileMenuContextType | undefined>(undefined);

export const useMobileMenu = () => {
  const context = useContext(MobileMenuContext);
  if (!context) {
    throw new Error('useMobileMenu must be used within MainLayout');
  }
  return context;
};

export const MainLayout = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const mobileMenuValue = {
    isOpen: isMobileMenuOpen,
    toggle: () => setIsMobileMenuOpen(prev => !prev),
    close: () => setIsMobileMenuOpen(false),
  };

  return (
    <MobileMenuContext.Provider value={mobileMenuValue}>
      {/* Auto-subscribe to push notifications on login */}
      <AutoNotificationSubscriber />
      
      <div className="min-h-screen bg-gray-50">
        <TopNavbar />
        <div className="flex relative">
          {/* Overlay pour mobile */}
          {isMobileMenuOpen && (
            <div 
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />
          )}
          <Sidebar />
          <main className="flex-1 p-3 sm:p-4 md:p-6 w-full lg:w-auto min-h-[calc(100vh-4rem)]">
            <Outlet />
          </main>
        </div>
      </div>
    </MobileMenuContext.Provider>
  );
};
