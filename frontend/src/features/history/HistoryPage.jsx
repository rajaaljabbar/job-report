import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import useReportStore from '../../stores/reportStore';

const categoryMap = {
  primary: { dot: 'bg-primary', bg: 'bg-primary-container/10', text: 'text-primary' },
  secondary: { dot: 'bg-secondary-container', bg: 'bg-secondary-container/10', text: 'text-secondary' },
  tertiary: { dot: 'bg-tertiary', bg: 'bg-tertiary-container/10', text: 'text-tertiary' },
};

export default function HistoryPage() {
  const { allReports } = useReportStore();
  const [searchParams] = useSearchParams();
  const highlightId = searchParams.get('highlight');

  const [search, setSearch] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [activeFilters, setActiveFilters] = useState(false);

  const applyFilters = () => {
    setActiveFilters(!!(dateFrom || dateTo || catFilter !== 'all'));
    setFilterOpen(false);
  };

  const resetFilters = () => {
    setDateFrom('');
    setDateTo('');
    setCatFilter('all');
    setActiveFilters(false);
    setFilterOpen(false);
  };

  const filteredReports = useMemo(() => {
    return allReports.filter((r) => {
      if (search && !r.title.toLowerCase().includes(search.toLowerCase()) && !(r.userName || '').toLowerCase().includes(search.toLowerCase())) return false;
      if (catFilter !== 'all' && r.category !== catFilter) return false;
      return true;
    });
  }, [allReports, search, activeFilters, catFilter]);

  // Group by date
  const grouped = useMemo(() => {
    const map = {};
    filteredReports.forEach((r) => {
      if (!map[r.date]) map[r.date] = [];
      map[r.date].push(r);
    });
    return Object.entries(map);
  }, [filteredReports]);

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 pt-4 md:pt-8 flex flex-col gap-6">
      {/* Header & Search */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm pb-4 -mx-4 px-4 md:mx-0 md:px-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-on-surface">History &amp; Export</h2>
            <p className="text-sm text-on-surface-variant">Review, filter, and export your task timeline.</p>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">search</span>
              <input
                type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                className="w-full h-10 pl-10 pr-4 rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm transition-shadow"
                placeholder="Cari nama user atau pekerjaan..."
              />
            </div>
            <button onClick={() => setFilterOpen(true)}
              className="h-10 px-4 rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface hover:bg-surface-container-low flex items-center gap-2 text-xs font-semibold transition-colors whitespace-nowrap">
              <span className="material-symbols-outlined text-xl">filter_list</span> Filter
            </button>
            <button
              className="h-10 px-4 rounded-lg bg-primary text-on-primary hover:bg-surface-tint flex items-center gap-2 text-xs font-semibold transition-colors whitespace-nowrap shadow-sm">
              <span className="material-symbols-outlined text-xl">download</span> Download
            </button>
          </div>
        </div>

        {/* Active Filter Chips */}
        {activeFilters && (
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container text-on-surface-variant text-xs font-semibold border border-outline-variant">
              Date: Active
              <button onClick={resetFilters} className="material-symbols-outlined text-sm hover:text-on-surface">close</button>
            </span>
            {catFilter !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container text-on-surface-variant text-xs font-semibold border border-outline-variant">
                Category: {catFilter}
                <button onClick={() => setCatFilter('all')} className="material-symbols-outlined text-sm hover:text-on-surface">close</button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Timeline */}
      <div className="flex flex-col gap-8">
        {grouped.map(([date, reports]) => (
          <section key={date} className="flex flex-col gap-4 relative">
            <div className="flex items-center gap-4">
              <h3 className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider bg-background pr-4 relative z-10">{date}</h3>
              <div className="flex-1 h-[1px] bg-outline-variant" />
            </div>
            <div className="flex flex-col gap-3">
              {reports.map((report) => {
                const cat = categoryMap[report.category];
                const isHighlighted = highlightId === report.id;
                return (
                  <div
                    key={report.id}
                    id={isHighlighted ? `report-${report.id}` : undefined}
                    className={`relative flex gap-4 w-full group ${isHighlighted ? 'ring-2 ring-primary rounded-xl' : ''}`}
                  >
                    {/* Timeline Dot */}
                    <div className="mt-4 w-10 md:w-12 flex justify-center relative z-10">
                      <div className={`w-[14px] h-[14px] rounded-full ${cat.dot} border-2 border-background ring-4 ring-background group-hover:scale-125 transition-transform`} />
                    </div>

                    {/* Card */}
                    <div className="flex-1 bg-surface-container-lowest border border-surface-variant rounded-xl p-4 shadow-sm flex flex-col md:flex-row gap-4 hover:shadow-md transition-shadow relative overflow-hidden">
                      <div className={`absolute left-0 top-0 bottom-0 w-1 ${cat.dot}`} />
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className={`text-xs font-semibold ${cat.text} px-2 py-0.5 rounded ${cat.bg}`}>{report.categoryLabel}</span>
                            <span className="text-sm text-on-surface-variant">{report.time}</span>
                          </div>
                          <h4 className="text-lg font-semibold text-on-surface mb-2">{report.title}</h4>
                          <p className="text-sm text-on-surface-variant line-clamp-2 mb-3">{report.description}</p>
                        </div>
                        <div className="flex items-center gap-2 mt-auto">
                          <span className="material-symbols-outlined text-outline text-base">person</span>
                          <span className="text-xs font-semibold text-on-surface">{report.userName || '-'}</span>
                        </div>
                      </div>
                      {report.hasEvidence && (
                        <div className="w-full md:w-32 h-24 md:h-auto rounded-lg overflow-hidden shrink-0 border border-outline-variant">
                          <div className="w-full h-full bg-surface-container flex items-center justify-center text-on-surface-variant">
                            <span className="material-symbols-outlined text-3xl">image</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
        {filteredReports.length === 0 && (
          <div className="text-center py-16 text-on-surface-variant">
            <span className="material-symbols-outlined text-5xl mb-4">search_off</span>
            <p className="text-lg font-semibold">Tidak ada laporan</p>
            <p className="text-sm">Coba ubah filter atau kata kunci pencarian.</p>
          </div>
        )}
      </div>

      {/* Filter Modal */}
      {filterOpen && (
        <div className="fixed inset-0 z-[60]">
          <div className="absolute inset-0 bg-on-background/30 backdrop-blur-sm" onClick={() => setFilterOpen(false)} />
          <div className="absolute bottom-0 md:bottom-auto md:top-1/2 left-0 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 w-full md:w-[480px] bg-surface-container-lowest rounded-t-2xl md:rounded-2xl shadow-xl flex flex-col animate-in slide-in-from-bottom">
            <div className="flex items-center justify-between p-4 border-b border-surface-variant">
              <h3 className="text-lg font-bold text-on-surface">Filter Timeline</h3>
              <button onClick={() => setFilterOpen(false)} className="p-2 rounded-full hover:bg-surface-container transition-colors text-on-surface-variant">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-6 flex flex-col gap-6 overflow-y-auto max-h-[60vh]">
              <div className="flex flex-col gap-3">
                <h4 className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Date Range</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-on-surface">From</label>
                    <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
                      className="h-10 px-3 rounded-lg border border-outline-variant bg-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm w-full" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-on-surface">To</label>
                    <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
                      className="h-10 px-3 rounded-lg border border-outline-variant bg-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm w-full" />
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <h4 className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Categories</h4>
                <div className="flex flex-col gap-2">
                  {[
                    { key: 'all', label: 'Semua', dot: 'bg-on-surface' },
                    { key: 'primary', label: 'Jobdesc Utama', dot: 'bg-primary' },
                    { key: 'secondary', label: 'Improvement', dot: 'bg-secondary-container' },
                    { key: 'tertiary', label: 'Help User', dot: 'bg-tertiary' },
                  ].map((c) => (
                    <label key={c.key} className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-container transition-colors cursor-pointer">
                      <input type="radio" name="filterCat" checked={catFilter === c.key} onChange={() => setCatFilter(c.key)}
                        className="w-5 h-5 text-primary focus:ring-primary" />
                      <div className={`w-3 h-3 rounded-full ${c.dot}`} />
                      <span className="text-base text-on-surface">{c.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-surface-variant flex justify-end gap-3 bg-surface-bright rounded-b-2xl">
              <button onClick={resetFilters}
                className="h-10 px-4 rounded-lg text-on-surface-variant hover:bg-surface-container text-xs font-semibold transition-colors">Reset</button>
              <button onClick={applyFilters}
                className="h-10 px-6 rounded-lg bg-primary text-on-primary hover:bg-surface-tint text-xs font-semibold transition-colors shadow-sm">Apply Filters</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
