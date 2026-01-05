import { useMemo, useState, useCallback } from 'react';
import type { Memory } from '../db/db';

interface TimelineSidebarProps {
  memories: Memory[];
  selectedYear?: number;
  selectedMonth?: number;
  onYearMonthSelect: (year: number, month: number) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export const TimelineSidebar = ({
  memories,
  selectedYear,
  selectedMonth,
  onYearMonthSelect,
  isOpen,
  onToggle,
}: TimelineSidebarProps) => {
  // Extract unique years and organize months with photos
  const timelineData = useMemo(() => {
    const yearMap = new Map<number, { months: Set<number>; count: number }>();

    memories.forEach((memory) => {
      const date = new Date(memory.date);
      const year = date.getFullYear();
      const month = date.getMonth() + 1; // 1-12

      if (!yearMap.has(year)) {
        yearMap.set(year, { months: new Set(), count: 0 });
      }
      const yearData = yearMap.get(year)!;
      yearData.months.add(month);
      yearData.count += 1; // 统计记忆总数
    });

    // Convert to sorted array
    return Array.from(yearMap.entries())
      .map(([year, data]) => ({
        year,
        months: Array.from(data.months).sort((a, b) => a - b),
        count: data.count, // 记忆总数
      }))
      .sort((a, b) => b.year - a.year); // Most recent year first
  }, [memories]);

  const [hoveredYear, setHoveredYear] = useState<number | null>(null);
  const [hoveredMonth, setHoveredMonth] = useState<number | null>(null);

  // Handle month click - if empty month, navigate to nearest month with photos
  const handleMonthClick = useCallback(
    (year: number, month: number, hasPhotos: boolean) => {
      if (hasPhotos) {
        onYearMonthSelect(year, month);
      } else {
        // Find nearest month with photos
        const yearData = timelineData.find((y) => y.year === year);
        if (yearData && yearData.months.length > 0) {
          const months = yearData.months;
          let nearestMonth = months[0];

          for (const m of months) {
            if (Math.abs(m - month) < Math.abs(nearestMonth - month)) {
              nearestMonth = m;
            }
          }
          onYearMonthSelect(year, nearestMonth);
        }
      }
    },
    [timelineData, onYearMonthSelect]
  );

  const monthNames = [
    '一月', '二月', '三月', '四月', '五月', '六月',
    '七月', '八月', '九月', '十月', '十一月', '十二月'
  ];

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={onToggle}
        className="lg:hidden fixed bottom-24 right-4 z-50 p-3 bg-gradient-primary text-white rounded-xl shadow-dramatic hover:shadow-dramatic-lg transform hover:scale-105 transition-all duration-300"
        title={isOpen ? '隐藏时间轴' : '显示时间轴'}
      >
        <svg
          className={`w-6 h-6 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </button>

      {/* Sidebar Overlay - Mobile only */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40 animate-fade-in"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed right-0 top-0 h-full w-80 bg-gallery-cream/95 dark:bg-gallery-midnight-light/95
          backdrop-blur-xl border-l border-gallery-sand/30 dark:border-gallery-midnight/30
          shadow-2xl z-40 transform transition-transform duration-500 ease-out
          overflow-y-auto overflow-x-hidden
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        {/* Decorative Header */}
        <div className="sticky top-0 z-10 bg-gallery-cream/95 dark:bg-gallery-midnight-light/95 backdrop-blur-xl border-b border-gallery-sand/30 dark:border-gallery-midnight/30">
          <div className="px-6 py-5">
            {/* Luxury decorative element */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-gallery-coral animate-pulse"></div>
                <h2 className="font-['Playfair_Display'] text-2xl font-black text-gallery-deep-teal dark:text-gallery-cream tracking-tight">
                  时间轴
                </h2>
              </div>
              {/* Mobile close button */}
              <button
                onClick={onToggle}
                className="lg:hidden p-1.5 text-gallery-deep-teal dark:text-gallery-cream hover:text-gallery-coral dark:hover:text-gallery-neon-pink rounded-lg transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Decorative line */}
            <div className="h-0.5 w-full bg-gradient-to-r from-gallery-coral via-gallery-gold to-transparent"></div>
          </div>
        </div>

        {/* Timeline Content */}
        <div className="px-6 py-6 space-y-8">
          {timelineData.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gallery-sand/50 dark:bg-gallery-midnight/50 flex items-center justify-center">
                <svg className="w-8 h-8 text-gallery-teal dark:text-gallery-cream-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-gallery-teal dark:text-gallery-cream-dark font-medium">
                暂无照片
              </p>
            </div>
          ) : (
            timelineData.map((yearData, yearIndex) => (
              <div
                key={yearData.year}
                className="relative animate-slide-down"
                style={{ animationDelay: `${yearIndex * 0.1}s` }}
              >
                {/* Year Header */}
                <div
                  className="sticky top-0 z-10 mb-4 cursor-pointer group"
                  onMouseEnter={() => setHoveredYear(yearData.year)}
                  onMouseLeave={() => setHoveredYear(null)}
                >
                  <div className="flex items-baseline space-x-3">
                    <h3 className="font-['Playfair_Display'] text-5xl font-black text-gallery-deep-teal dark:text-gallery-cream leading-none tracking-tight group-hover:text-gallery-coral dark:group-hover:text-gallery-neon-pink transition-colors duration-300">
                      {yearData.year}
                    </h3>
                    <span className="text-sm font-semibold text-gallery-gold uppercase tracking-widest">
                      {yearData.count} 个记忆
                    </span>
                  </div>

                  {/* Decorative underline */}
                  <div className={`h-0.5 w-full bg-gradient-to-r from-gallery-gold to-transparent transition-all duration-300 ${hoveredYear === yearData.year ? 'w-full' : 'w-2/3'}`}></div>
                </div>

                {/* Months Grid */}
                <div className="grid grid-cols-3 gap-3 ml-2">
                  {monthNames.map((monthName, monthIndex) => {
                    const month = monthIndex + 1;
                    const hasPhotos = yearData.months.includes(month);
                    const isSelected = selectedYear === yearData.year && selectedMonth === month;
                    const isHovered = hoveredMonth === month && hoveredYear === yearData.year;

                    return (
                      <button
                        key={month}
                        onClick={() => handleMonthClick(yearData.year, month, hasPhotos)}
                        onMouseEnter={() => setHoveredMonth(month)}
                        onMouseLeave={() => setHoveredMonth(null)}
                        disabled={!hasPhotos && !timelineData.some(y => y.months.length > 0)}
                        className={`
                          relative flex flex-col items-center justify-center py-3 px-2
                          rounded-xl transition-all duration-300
                          ${hasPhotos
                            ? 'bg-gallery-sand/30 dark:bg-gallery-midnight/30 hover:bg-gallery-coral/10 dark:hover:bg-gallery-neon-pink/10 cursor-pointer'
                            : 'bg-transparent cursor-not-allowed opacity-40'
                          }
                          ${isSelected ? 'ring-2 ring-gallery-coral dark:ring-gallery-neon-pink shadow-glow-coral' : ''}
                          ${isHovered && hasPhotos ? 'transform scale-105' : ''}
                        `}
                        title={hasPhotos ? `${yearData.year}年${monthName}` : '跳转到最近月份'}
                      >
                        {/* Month indicator */}
                        <div className={`
                          w-2 h-2 rounded-full mb-2 transition-all duration-300
                          ${hasPhotos
                            ? isSelected
                              ? 'bg-gallery-coral dark:bg-gallery-neon-pink animate-pulse'
                              : 'bg-gallery-gold hover:bg-gallery-coral dark:hover:bg-gallery-neon-pink'
                            : 'bg-gallery-teal/30 dark:bg-gallery-cream-dark/30'
                          }
                        `}></div>

                        {/* Month number */}
                        <span className={`
                          text-xs font-bold mb-0.5
                          ${hasPhotos
                            ? 'text-gallery-deep-teal dark:text-gallery-cream'
                            : 'text-gallery-teal dark:text-gallery-cream-dark'
                          }
                        `}>
                          {String(month).padStart(2, '0')}
                        </span>

                        {/* Month name */}
                        <span className={`
                          text-[10px] font-medium leading-tight
                          ${hasPhotos
                            ? 'text-gallery-teal dark:text-gallery-cream-dark'
                            : 'text-gallery-teal/50 dark:text-gallery-cream-dark/50'
                          }
                        `}>
                          {monthName}
                        </span>

                        {/* Photo count badge */}
                        {hasPhotos && (
                          <div className={`
                            absolute -top-1 -right-1 min-w-[16px] h-4 px-1
                            bg-gallery-coral dark:bg-gallery-neon-pink
                            text-white text-[9px] font-black rounded-full
                            flex items-center justify-center
                            ${isHovered ? 'scale-110' : 'scale-100'}
                            transition-transform duration-300
                          `}>
                            {memories.filter(m => {
                              const date = new Date(m.date);
                              return date.getFullYear() === yearData.year && date.getMonth() + 1 === month;
                            }).length}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Decorative spacing between years */}
                {yearIndex < timelineData.length - 1 && (
                  <div className="mt-8 flex items-center justify-center space-x-3">
                    <div className="flex-1 h-px bg-gallery-sand/30 dark:bg-gallery-midnight/30"></div>
                    <div className="w-2 h-2 rounded-full bg-gallery-gold/30"></div>
                    <div className="flex-1 h-px bg-gallery-sand/30 dark:bg-gallery-midnight/30"></div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Decorative Footer */}
        <div className="sticky bottom-0 px-6 py-4 bg-gradient-to-t from-gallery-cream/80 dark:from-gallery-midnight-light/80 to-transparent">
          <div className="flex items-center justify-center space-x-2 text-gallery-teal/50 dark:text-gallery-cream-dark/50">
            <div className="w-1 h-1 rounded-full bg-gallery-gold"></div>
            <div className="w-1 h-1 rounded-full bg-gallery-coral"></div>
            <div className="w-1 h-1 rounded-full bg-gallery-gold"></div>
          </div>
        </div>
      </aside>
    </>
  );
};
