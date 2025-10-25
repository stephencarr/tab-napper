import React, { useState } from 'react';
import { Home, Archive, Inbox, Trash2, Menu, X } from 'lucide-react';
import UniversalSearch from './UniversalSearch.jsx';
import { toggleDarkMode } from '../hooks/useDarkMode.js';

const navigation = [
  { name: 'Dashboard', icon: Home },
  { name: 'All Stashed', icon: Archive },
  { name: 'Inbox', icon: Inbox },
  { name: 'Trash', icon: Trash2 }
];

function cx(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default function Layout({
  children,
  currentView,
  setCurrentView,
  searchTerm,
  onSearchChange,
  onSearchClear,
  searchLoading
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const NavLinks = ({ onClick }) => (
    <nav className="mt-5 px-2 space-y-1">
      {navigation.map((item) => (
        <button
          key={item.name}
          onClick={() => {
            setCurrentView(item.name);
            onSearchClear?.(); // Clear search when clicking any menu item
            onClick?.();
          }}
          className={cx(
            currentView === item.name
              ? 'bg-calm-100 dark:bg-calm-700 text-calm-900 dark:text-calm-100'
              : 'text-calm-600 dark:text-calm-300 hover:bg-calm-50 dark:hover:bg-calm-750 hover:text-calm-900 dark:hover:text-calm-100',
            'w-full group flex items-center px-2 py-2 text-base md:text-sm font-medium rounded-md transition-colors'
          )}
        >
          <item.icon
            className={cx(
              currentView === item.name 
                ? 'text-calm-600 dark:text-calm-400' 
                : 'text-calm-500 dark:text-calm-400 group-hover:text-calm-600 dark:group-hover:text-calm-300',
              'mr-3 flex-shrink-0 h-6 w-6'
            )}
            aria-hidden="true"
          />
          {item.name}
        </button>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen flex flex-col bg-calm-50 dark:bg-calm-900">
      {/* Unified sticky header - spans full width */}
      <header className="sticky top-0 z-30 bg-white dark:bg-calm-800 border-b border-calm-200 dark:border-calm-700">
        <div className="flex h-16 items-center">
          {/* Logo section - same width as sidebar */}
          <div className="hidden md:flex md:w-64 items-center px-4 border-r border-calm-200 dark:border-calm-700">
            <div className="w-8 h-8 bg-calm-600 dark:bg-calm-500 rounded-lg flex items-center justify-center">
              <div className="grid grid-cols-1 gap-1">
                <div className="w-1 h-1 bg-white rounded-full" />
                <div className="w-1 h-1 bg-white rounded-full" />
                <div className="w-1 h-1 bg-white rounded-full" />
              </div>
            </div>
            <span className="ml-3 font-medium text-calm-800 dark:text-calm-200">Tab Napper</span>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden pl-4">
            <button
              type="button"
              className="h-10 w-10 inline-flex items-center justify-center rounded-md text-calm-500 hover:text-calm-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-calm-500"
              onClick={() => setSidebarOpen(true)}
            >
              <span className="sr-only">Open sidebar</span>
              <Menu className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>

          {/* Search section - flex-1 to take remaining space */}
          <div className="flex-1 px-4 sm:px-6 lg:px-8 flex items-center gap-3">
            <div className="flex-1">
              <UniversalSearch
                value={searchTerm}
                onChange={onSearchChange}
                onClear={onSearchClear}
                placeholder="Search titles, content, URLs, and all your saved items..."
                autoFocus={false}
                variant="compact"
                isLoading={Boolean(searchLoading)}
              />
            </div>
            <button
              onClick={toggleDarkMode}
              className="flex-shrink-0 text-xs text-calm-500 hover:text-calm-700 dark:text-calm-400 dark:hover:text-calm-200 px-2 py-1 rounded"
              title="Toggle dark mode"
            >
              🌙
            </button>
          </div>
        </div>
      </header>

      {/* Content area below header */}
      <div className="flex flex-1 min-h-0">
        {/* Mobile sidebar */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 flex md:hidden" role="dialog" aria-modal="true">
            <div className="fixed inset-0 bg-black/30" aria-hidden="true" onClick={() => setSidebarOpen(false)} />
            <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white dark:bg-calm-800">
              <div className="absolute top-0 right-0 -mr-12 pt-2">
                <button
                  type="button"
                  className="ml-1 flex h-10 w-10 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                  onClick={() => setSidebarOpen(false)}
                >
                  <span className="sr-only">Close sidebar</span>
                  <X className="h-6 w-6 text-white" aria-hidden="true" />
                </button>
              </div>
              <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
                <NavLinks onClick={() => setSidebarOpen(false)} />
              </div>
            </div>
            <div className="flex-shrink-0 w-14" />
          </div>
        )}

        {/* Desktop sidebar - sticky navigation */}
        <aside className="hidden md:block md:w-64 md:border-r md:border-calm-200 dark:md:border-calm-800 md:bg-white dark:md:bg-calm-800">
          <nav className="sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto py-4">
            <NavLinks />
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          <div className="px-4 sm:px-6 lg:px-8 py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
