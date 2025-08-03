import React from 'react';
import { Moon, Sun } from 'lucide-react';
import HeaderWithAuth from '@/components/layout/HeaderWithAuth';
import TrendingTagsSection from '@/components/features/TrendingTagsSection';
import { useDarkMode } from '@/hooks/useDarkMode';

function HeaderEx() {
  const { isDarkMode, toggleDarkMode, isInitialized } = useDarkMode();
  console.log('isDarkMode', isDarkMode);

  return (
    <>
      <header className="bg-background/95 backdrop-blur-sm shadow-sm sticky top-0 z-40 border-b border-border">
        <div className="w-full px-2 overflow-x-hidden">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center">
              <a href="/browse" className="flex items-center group">
                <div className={`flex items-center justify-center rounded-full shadow-md border-2 ${isDarkMode ? 'bg-[#22304A] border-[#3B4A5A]' : 'bg-[#F5F5F3] border-[#C9B37E]'} mr-2 sm:mr-3 w-10 h-10 sm:w-12 sm:h-12 transition-all duration-200 group-hover:scale-105`}>
                  <img
                    src={isDarkMode ? '/assets/logo-dark.svg' : '/assets/logo.svg'}
                    alt="WealthManager Logo"
                    className="w-6 h-6 sm:w-8 sm:h-8 object-contain"
                  />
                </div>
                <span className="text-lg sm:text-2xl font-extrabold font-display tracking-tight drop-shadow-sm transition-all duration-300">
                  <span className={isDarkMode ? 'text-[#BFC9D1]' : 'text-[#C9B37E]'}>Wealth</span>
                  <span className={isDarkMode ? 'text-white' : 'text-[#232B3A]'}>Manager</span>
                </span>
              </a>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <button
                onClick={toggleDarkMode}
                className="hidden md:flex p-2 rounded-md bg-muted border border-border hover:bg-muted/80 transition-all duration-200"
                aria-label="Toggle dark mode"
              >
                {isDarkMode ? (
                  <Sun className="h-4 w-4 text-foreground" />
                ) : (
                  <Moon className="h-4 w-4 text-foreground" />
                )}
              </button>
              <HeaderWithAuth />
            </div>
          </div>
        </div>
      </header>

      {/* Mobile-only dark mode toggle button */}
      <button
        onClick={toggleDarkMode}
        className="md:hidden fixed bottom-24 right-5 z-50 p-1.5 rounded-full bg-background/50 backdrop-blur-sm border border-border hover:bg-background/80 transition-all duration-200"
        aria-label="Toggle dark mode"
      >
        {isDarkMode ? (
          <Sun className="h-4 w-4 text-foreground" />
        ) : (
          <Moon className="h-4 w-4 text-foreground" />
        )}
      </button>

      {/* Trending tags section with minimal padding */}
      <div className="bg-muted/50 border-b border-border shadow-sm">
        <div className="w-full px-2 py-2">
          <TrendingTagsSection showTitle={false} />
        </div>
      </div>
    </>
  );
}

export default HeaderEx;
