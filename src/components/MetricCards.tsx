import React from 'react';
import {
  AlertOctagon,
  CheckCircle2,
  TrendingUp,
  Users,
  Building,
  Cpu,
  ArrowRight,
} from 'lucide-react';

interface MetricCardsProps {
  metrics: {
    roomUtilizationPct: number;
    seatOccupancyPct: number;
    capacityWastePct: number;
    criticalConflictsCount: number;
    warningsCount: number;
    totalAllocations: number;
    activeFacultyCount: number;
    totalFacultyCount: number;
    availableRoomsCount: number;
    totalRoomsCount: number;
  };
  onViewConflicts: () => void;
}

export const MetricCards: React.FC<MetricCardsProps> = ({ metrics, onViewConflicts }) => {
  const hasCritical = metrics.criticalConflictsCount > 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Conflict & Risk Status Card */}
      <div
        className={`p-4 rounded-xl border transition-all ${
          hasCritical
            ? 'bg-rose-50/80 border-rose-200 shadow-sm'
            : 'bg-white border-slate-200/80 shadow-xs'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
            Conflict Monitor
          </span>
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              hasCritical ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'
            }`}
          >
            {hasCritical ? (
              <AlertOctagon className="w-4 h-4 animate-pulse" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
          </div>
        </div>

        <div className="mt-3 flex items-baseline gap-2">
          <span
            className={`text-2xl font-bold tracking-tight ${
              hasCritical ? 'text-rose-700' : 'text-slate-800'
            }`}
          >
            {hasCritical ? `${metrics.criticalConflictsCount} Critical` : '0 Conflicts'}
          </span>
          {metrics.warningsCount > 0 && (
            <span className="text-xs font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
              +{metrics.warningsCount} warnings
            </span>
          )}
        </div>

        <div className="mt-2 text-xs text-slate-600 flex items-center justify-between">
          <span>
            {hasCritical ? 'Blocking allocations require resolution' : 'All campus bookings are valid & clash-free'}
          </span>
          {hasCritical && (
            <button
              onClick={onViewConflicts}
              className="text-rose-600 hover:text-rose-800 font-semibold inline-flex items-center gap-1 cursor-pointer"
            >
              Resolve <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Room Utilization Card */}
      <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
            Room Slot Utilization
          </span>
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>

        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-slate-800">
            {metrics.roomUtilizationPct}%
          </span>
          <span className="text-xs text-slate-500">
            ({metrics.totalAllocations} active sessions)
          </span>
        </div>

        <div className="mt-2">
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, metrics.roomUtilizationPct)}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-slate-500 mt-1">
            <span>20 slots/room weekly</span>
            <span className="text-indigo-600 font-medium">Capacity available</span>
          </div>
        </div>
      </div>

      {/* 3. Capacity & Space Efficiency */}
      <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
            Seating Efficiency
          </span>
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Users className="w-4 h-4" />
          </div>
        </div>

        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-slate-800">
            {metrics.seatOccupancyPct}%
          </span>
          <span className="text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-medium">
            Waste: {metrics.capacityWastePct}%
          </span>
        </div>

        <div className="mt-2">
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, metrics.seatOccupancyPct)}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-slate-500 mt-1">
            <span>Occupancy ratio</span>
            <span className="text-slate-600">Minimized idle seats</span>
          </div>
        </div>
      </div>

      {/* 4. Campus Readiness */}
      <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
            Operational Readiness
          </span>
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Building className="w-4 h-4" />
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <div>
            <div className="text-lg font-bold text-slate-800">
              {metrics.availableRoomsCount}/{metrics.totalRoomsCount}
            </div>
            <div className="text-[11px] text-slate-500 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
              Rooms Active
            </div>
          </div>
          <div>
            <div className="text-lg font-bold text-slate-800">
              {metrics.activeFacultyCount}/{metrics.totalFacultyCount}
            </div>
            <div className="text-[11px] text-slate-500 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
              Faculty Active
            </div>
          </div>
        </div>

        <div className="mt-2 pt-1 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
          <span className="flex items-center gap-1">
            <Cpu className="w-3 h-3 text-slate-400" />
            Labs & AV Operational
          </span>
          <span className="text-emerald-600 font-medium">100% OK</span>
        </div>
      </div>
    </div>
  );
};
