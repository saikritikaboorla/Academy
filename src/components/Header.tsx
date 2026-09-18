import React from 'react';
import {
  Building2,
  AlertTriangle,
  Zap,
  Sparkles,
  History,
  Plus,
  BarChart3,
  Calendar,
  Layers,
  Undo2,
  Download,
} from 'lucide-react';

interface HeaderProps {
  activeTab: 'overview' | 'schedule' | 'conflicts' | 'resources';
  setActiveTab: (tab: 'overview' | 'schedule' | 'conflicts' | 'resources') => void;
  criticalConflictCount: number;
  warningsCount: number;
  onOpenNewAllocation: () => void;
  onOpenEmergencySimulator: () => void;
  onOpenAIAssistant: () => void;
  onOpenHistory: () => void;
  onAutoResolveAll: () => void;
  onUndo?: () => void;
  canUndo?: boolean;
  onExportCSV?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  criticalConflictCount,
  warningsCount,
  onOpenNewAllocation,
  onOpenEmergencySimulator,
  onOpenAIAssistant,
  onOpenHistory,
  onAutoResolveAll,
  onUndo,
  canUndo = false,
  onExportCSV,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-slate-900 text-white border-b border-slate-800 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main top bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between py-3 gap-3">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3">
            <div
              className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center shadow-inner text-white flex-shrink-0"
              aria-hidden="true"
            >
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                  Smart Campus Resource Assistant
                </h1>
                <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-indigo-950 text-indigo-300 border border-indigo-700/60">
                  EduResource OS v2.4
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Automated classroom, lab, faculty & equipment allocation engine
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center flex-wrap gap-2">
            {/* Undo button */}
            {canUndo && onUndo && (
              <button
                type="button"
                onClick={onUndo}
                aria-label="Undo last scheduling change"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-950 text-indigo-200 border border-indigo-700 hover:bg-indigo-900 transition-colors cursor-pointer focus:ring-2 focus:ring-indigo-400 focus:outline-hidden"
                title="Undo last change"
              >
                <Undo2 className="w-3.5 h-3.5" />
                <span>Undo</span>
              </button>
            )}

            {/* Last-minute simulator trigger */}
            <button
              type="button"
              onClick={onOpenEmergencySimulator}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 transition-colors cursor-pointer focus:ring-2 focus:ring-amber-400 focus:outline-hidden"
              title="Test last-minute emergencies like room maintenance, faculty absence or capacity surge"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Simulate Emergency</span>
            </button>

            {/* AI Assistant */}
            <button
              type="button"
              onClick={onOpenAIAssistant}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-purple-500/15 text-purple-300 border border-purple-500/30 hover:bg-purple-500/25 transition-colors cursor-pointer focus:ring-2 focus:ring-purple-400 focus:outline-hidden"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>AI Advisor</span>
            </button>

            {/* Reallocation History */}
            <button
              type="button"
              onClick={onOpenHistory}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 transition-colors cursor-pointer focus:ring-2 focus:ring-slate-400 focus:outline-hidden"
              title="View audit log of reallocations"
            >
              <History className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">Audit Log</span>
            </button>

            {/* Export Schedule */}
            {onExportCSV && (
              <button
                type="button"
                onClick={onExportCSV}
                className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 transition-colors cursor-pointer focus:ring-2 focus:ring-slate-400 focus:outline-hidden"
                title="Export timetable as CSV"
              >
                <Download className="w-3.5 h-3.5 text-slate-400" />
                <span>Export CSV</span>
              </button>
            )}

            {/* Auto-Resolve button if conflicts exist */}
            {criticalConflictCount > 0 && (
              <button
                type="button"
                onClick={onAutoResolveAll}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-all cursor-pointer focus:ring-2 focus:ring-emerald-400 focus:outline-hidden"
                title="Automatically reallocate all conflicting sessions to best available rooms"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Auto-Resolve All ({criticalConflictCount})</span>
              </button>
            )}

            {/* New Allocation */}
            <button
              type="button"
              onClick={onOpenNewAllocation}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition-all cursor-pointer focus:ring-2 focus:ring-indigo-400 focus:outline-hidden"
            >
              <Plus className="w-4 h-4" />
              <span>New Allocation</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav
          aria-label="Main Campus Sections"
          className="flex items-center space-x-1 sm:space-x-2 border-t border-slate-800 pt-2 pb-1 overflow-x-auto text-sm"
        >
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            aria-current={activeTab === 'overview' ? 'page' : undefined}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md font-medium text-xs transition-colors cursor-pointer focus:ring-2 focus:ring-indigo-400 focus:outline-hidden ${
              activeTab === 'overview'
                ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Dashboard Overview</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('schedule')}
            aria-current={activeTab === 'schedule' ? 'page' : undefined}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md font-medium text-xs transition-colors cursor-pointer focus:ring-2 focus:ring-indigo-400 focus:outline-hidden ${
              activeTab === 'schedule'
                ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Timetable & Grid</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('conflicts')}
            aria-current={activeTab === 'conflicts' ? 'page' : undefined}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md font-medium text-xs transition-colors cursor-pointer relative focus:ring-2 focus:ring-rose-400 focus:outline-hidden ${
              activeTab === 'conflicts'
                ? 'bg-rose-600/30 text-rose-300 border border-rose-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <span>Conflict Workbench</span>
            {criticalConflictCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-500 text-white">
                {criticalConflictCount}
              </span>
            )}
            {criticalConflictCount === 0 && warningsCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-slate-900">
                {warningsCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('resources')}
            aria-current={activeTab === 'resources' ? 'page' : undefined}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md font-medium text-xs transition-colors cursor-pointer focus:ring-2 focus:ring-indigo-400 focus:outline-hidden ${
              activeTab === 'resources'
                ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Resource Directory</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
