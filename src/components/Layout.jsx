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
            onClick?.();
          }}
          className={cx(
            currentView === item.name
              ? 'bg-gray-100 text-gray-900'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
            'w-full group flex items-center px-2 py-2 text-base md:text-sm font-medium rounded-md'
          )}
        >
          <item.icon
            className={cx(
              currentView === item.name ? 'text-gray-500' : 'text-gray-400 group-hover:text-gray-500',
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
    <div className="min-h-screen flex bg-calm-50 dark:bg-calm-900">
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
              <div className="flex items-center px-4">
                <div className="w-8 h-8 bg-calm-600 dark:bg-calm-500 rounded-lg flex items-center justify-center">
                  <div className="grid grid-cols-1 gap-1">
                    <div className="w-1 h-1 bg-white rounded-full" />
                    <div className="w-1 h-1 bg-white rounded-full" />
                    <div className="w-1 h-1 bg-white rounded-full" />
                  </div>
                </div>
                <span className="ml-3 font-medium text-calm-800 dark:text-calm-200">Tab Napper</span>
              </div>
              <NavLinks onClick={() => setSidebarOpen(false)} />
            </div>
          </div>
          <div className="flex-shrink-0 w-14" />
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col md:border-r md:border-calm-200 dark:md:border-calm-800 md:bg-white dark:md:bg-calm-800">
        <div className="h-16 flex items-center px-4 border-b border-calm-200 dark:border-calm-700">
          <div className="w-8 h-8 bg-calm-600 dark:bg-calm-500 rounded-lg flex items-center justify-center">
            <div className="grid grid-cols-1 gap-1">
              <div className="w-1 h-1 bg-white rounded-full" />
              <div className="w-1 h-1 bg-white rounded-full" />
              <div className="w-1 h-1 bg-white rounded-full" />
            </div>
          </div>
          <span className="ml-3 font-medium text-calm-800 dark:text-calm-200">Tab Napper</span>
        </div>
        <div className="flex-1 overflow-y-auto py-4">
          <NavLinks />
        </div>
      </div>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <div className="md:hidden pl-1 pt-1 sm:pl-3 sm:pt-3">
          <button
            type="button"
            className="-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-calm-500 hover:text-calm-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-calm-500"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <Menu className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>

        {/* Sticky header with global search */}
        <header className="sticky top-0 z-30 bg-white/90 dark:bg-calm-800/90 backdrop-blur border-b border-calm-200 dark:border-calm-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 h-14 flex items-center gap-3">
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
              className="ml-2 text-xs text-calm-500 hover:text-calm-700 dark:text-calm-400 dark:hover:text-calm-200 px-2 py-1 rounded"
              title="Toggle dark mode"
            >
              🌙
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
