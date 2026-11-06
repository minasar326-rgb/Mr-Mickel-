import React, { createContext, useContext, useState, useEffect } from 'react';
import { useTeacher } from '../../../context/TeacherContext';

const AdminUIContext = createContext(null);

export function AdminUIProvider({ children, initialTab = 'dashboard' }) {
  const { stages } = useTeacher();

  // Read initial active tab from URL hash if available (e.g. #lectures -> lectures)
  const getTabFromHash = () => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.replace('#', '').trim();
      if (hash) return hash;
    }
    return initialTab;
  };

  const [activeTab, setActiveTabState] = useState(getTabFromHash);
  const [activeStageId, setActiveStageId] = useState(() => {
    return Array.isArray(stages) && stages.length > 0 ? stages[0].id : 'sec-3';
  });
  const [activeSectionId, setActiveSectionId] = useState('');
  const [activeLectureId, setActiveLectureId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [bulkSelectedIds, setBulkSelectedIds] = useState([]);

  // Listen to hash changes for browser back / forward button support
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '').trim();
      if (hash && hash !== activeTab) {
        setActiveTabState(hash);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [activeTab]);

  const setActiveTab = (tabId) => {
    setActiveTabState(tabId);
    if (typeof window !== 'undefined') {
      window.location.hash = `#${tabId}`;
    }
    setIsMobileNavOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Breadcrumbs computation
  const currentStage = Array.isArray(stages) ? stages.find(s => s.id === activeStageId) : null;
  const breadcrumbs = [
    { id: 'dashboard', label: 'لوحة التحكم', onClick: () => setActiveTab('dashboard') },
    currentStage ? { id: currentStage.id, label: currentStage.name, onClick: () => setActiveTab('lectures') } : null
  ].filter(Boolean);

  const value = {
    activeTab,
    setActiveTab,
    activeStageId,
    setActiveStageId,
    activeSectionId,
    setActiveSectionId,
    activeLectureId,
    setActiveLectureId,
    currentStage,
    searchQuery,
    setSearchQuery,
    isMobileNavOpen,
    setIsMobileNavOpen,
    isDarkMode,
    setIsDarkMode,
    bulkSelectedIds,
    setBulkSelectedIds,
    breadcrumbs
  };

  return (
    <AdminUIContext.Provider value={value}>
      {children}
    </AdminUIContext.Provider>
  );
}

export function useAdminUI() {
  const context = useContext(AdminUIContext);
  if (!context) {
    throw new Error('useAdminUI must be used within an AdminUIProvider');
  }
  return context;
}
