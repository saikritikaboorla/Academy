import React, { useState } from 'react';
import {
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Cpu,
  Users,
  Building,
  ShieldAlert,
} from 'lucide-react';
import { Conflict, Allocation, Room } from '../types';

interface ConflictAlertBannerProps {
  conflicts: Conflict[];
  allocations: Allocation[];
  rooms: Room[];
  onApplyAlternative: (allocationId: string, targetRoomId: string, reason: string) => void;
  onViewAllConflicts: () => void;
}

export const ConflictAlertBanner: React.FC<ConflictAlertBannerProps> = ({
  conflicts,
  allocations,
  rooms,
  onApplyAlternative,
  onViewAllConflicts,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  if (conflicts.length === 0) {
    return (
      <section
        role="region"
        aria-label="Campus Scheduling Status"
        className="bg-emerald-50 border border-emerald-300 rounded-xl p-4 flex items-center justify-between text-emerald-950 shadow-xs"
      >
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 flex-shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-emerald-950">
              Campus Schedules Synchronized & Clash-Free
            </h3>
            <p className="text-xs text-emerald-800 mt-0.5">
              All classrooms, computer labs, faculty schedules, and specialized equipment match capacity and activity parameters.
            </p>
          </div>
        </div>
        <span className="hidden sm:inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-900 border border-emerald-300">
          Optimal Allocation Active
        </span>
      </section>
    );
  }

  // Find primary critical conflict (e.g. Data Structures 65 vs 60 if present)
  const primaryConflict = conflicts.find((c) => c.severity === 'critical') || conflicts[0];
  const targetAllocation = allocations.find((a) => a.id === primaryConflict.allocationId);
  const currentRoom = rooms.find((r) => r.id === targetAllocation?.assignedRoomId);
  const topAlternative = primaryConflict.alternatives && primaryConflict.alternatives.length > 0
    ? primaryConflict.alternatives[0]
    : null;

  return (
    <section
      role="region"
      aria-label="Active Campus Scheduling Conflicts"
      aria-live="polite"
      className="bg-rose-50 border border-rose-300 rounded-xl p-4 shadow-sm text-rose-950 transition-all"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start space-x-3">
          <div className="w-9 h-9 rounded-xl bg-rose-100 border border-rose-300 flex items-center justify-center text-rose-700 flex-shrink-0 mt-0.5">
            <ShieldAlert className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider bg-rose-700 text-white">
                Conflict Detected
              </span>
              <h3 className="text-sm font-bold text-rose-950">
                {primaryConflict.title}
              </h3>
              {conflicts.length > 1 && (
                <span className="text-xs text-rose-900 font-semibold">
                  (+{conflicts.length - 1} other issue{conflicts.length > 2 ? 's' : ''})
                </span>
              )}
            </div>
            <p className="text-xs text-rose-950 font-medium mt-1 max-w-3xl leading-relaxed">
              {primaryConflict.description}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            aria-expanded={isExpanded}
            aria-label={isExpanded ? 'Collapse recommended solution' : 'Expand recommended solution'}
            className="p-1.5 rounded-lg text-rose-900 hover:bg-rose-200/70 transition-colors cursor-pointer focus:ring-2 focus:ring-rose-600 focus:outline-hidden"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expandable Smart Recommendation Block */}
      {isExpanded && topAlternative && targetAllocation && (
        <div className="mt-3 pt-3 border-t border-rose-200 bg-white/95 rounded-lg p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                Recommended Smart Replacement ({topAlternative.matchScore}% Match)
              </span>
              <span className="text-xs font-bold text-slate-900">
                {topAlternative.roomName}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-700">
              <span className="flex items-center gap-1 font-semibold text-emerald-800">
                <Users className="w-3.5 h-3.5" />
                Capacity: {topAlternative.capacity} seats (handles {targetAllocation.studentStrength} students with +{topAlternative.capacityHeadroom} margin)
              </span>

              {topAlternative.availableComputers > 0 && (
                <span className="flex items-center gap-1 font-semibold text-blue-900">
                  <Cpu className="w-3.5 h-3.5" />
                  {topAlternative.availableComputers} Working PCs (meets required {targetAllocation.studentStrength})
                </span>
              )}

              <span className="flex items-center gap-1 text-slate-700">
                <Building className="w-3.5 h-3.5" />
                {topAlternative.building}
              </span>
            </div>

            <p className="text-xs text-slate-600 italic">
              {topAlternative.pros.join(' • ')}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() =>
                onApplyAlternative(
                  targetAllocation.id,
                  topAlternative.roomId,
                  `Smart Resolution: Reallocated from ${currentRoom?.name || 'congested facility'} to ${topAlternative.roomName} to solve capacity mismatch & equip deficiency.`
                )
              }
              className="w-full md:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-emerald-700 hover:bg-emerald-600 text-white shadow-sm transition-all cursor-pointer focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
            >
              <span>Apply Reallocation to {topAlternative.roomCode}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            {conflicts.length > 1 && (
              <button
                onClick={onViewAllConflicts}
                className="text-xs text-slate-700 hover:text-slate-900 font-semibold px-2 py-1 underline cursor-pointer focus:ring-2 focus:ring-slate-400 focus:outline-hidden rounded"
              >
                View all ({conflicts.length})
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  );
};
