import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Building,
  Users,
  Cpu,
  Check,
  Zap,
  Info,
  ChevronRight,
} from 'lucide-react';
import { Conflict, Allocation, Room, Faculty } from '../types';

interface ConflictReallocationCenterProps {
  conflicts: Conflict[];
  allocations: Allocation[];
  rooms: Room[];
  facultyList: Faculty[];
  onApplyAlternative: (allocationId: string, targetRoomId: string, reason: string) => void;
  onAutoResolveAll: () => void;
  onOpenNewAllocation?: () => void;
}

export const ConflictReallocationCenter: React.FC<ConflictReallocationCenterProps> = ({
  conflicts,
  allocations,
  rooms,
  facultyList,
  onApplyAlternative,
  onAutoResolveAll,
}) => {
  const [selectedConflictId, setSelectedConflictId] = useState<string | null>(
    conflicts.length > 0 ? conflicts[0].id : null
  );

  // If selected conflict was resolved, pick the next one
  const currentConflict = conflicts.find((c) => c.id === selectedConflictId) || (conflicts.length > 0 ? conflicts[0] : null);

  const getTargetAllocation = (allocId: string) => allocations.find((a) => a.id === allocId);
  const getRoom = (roomId: string) => rooms.find((r) => r.id === roomId);
  const getFaculty = (facultyId: string) => facultyList.find((f) => f.id === facultyId);

  if (conflicts.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center shadow-xs">
        <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 mb-1">
          Zero Conflicts Detected Across Campus
        </h3>
        <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto mb-6 leading-relaxed">
          Every classroom, computer lab, science facility, and instructor schedule is completely valid with no overlapping bookings, capacity shortages, or equipment deficits.
        </p>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-300 text-xs text-slate-700">
          <Info className="w-4 h-4 text-indigo-600 flex-shrink-0" />
          <span>Tip: You can use the "Simulate Emergency" button in the top bar to test last-minute breakdown handling.</span>
        </div>
      </div>
    );
  }

  const activeAllocation = currentConflict ? getTargetAllocation(currentConflict.allocationId) : null;
  const currentRoom = activeAllocation ? getRoom(activeAllocation.assignedRoomId) : null;
  const currentFaculty = activeAllocation ? getFaculty(activeAllocation.assignedFacultyId) : null;
  const topAlternative = currentConflict?.alternatives && currentConflict.alternatives.length > 0 ? currentConflict.alternatives[0] : null;

  return (
    <div className="space-y-4">
      {/* Top Banner with Auto-Resolve Action */}
      <div className="bg-slate-900 text-white rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-xs font-bold bg-rose-600 text-white">
              {conflicts.length} Active Issue{conflicts.length === 1 ? '' : 's'}
            </span>
            <h2 className="text-base font-bold text-white">
              Smart Conflict Resolution & Reallocation Workbench
            </h2>
          </div>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            The automated constraint solver evaluates capacity limits, installed PC workstations, faculty commitments, and room availability to provide optimal zero-clash alternatives.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={onAutoResolveAll}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition-all cursor-pointer focus:ring-2 focus:ring-emerald-400 focus:outline-hidden"
          >
            <Zap className="w-4 h-4" />
            <span>Auto-Resolve All ({conflicts.length})</span>
          </button>
        </div>
      </div>

      {/* Main 2-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Conflict Selector */}
        <div className="lg:col-span-5 space-y-2">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-700 px-1">
            Detected Scheduling Conflicts ({conflicts.length})
          </div>

          <div className="space-y-2" role="listbox" aria-label="Conflict List">
            {conflicts.map((conflict) => {
              const alloc = getTargetAllocation(conflict.allocationId);
              const isSelected = currentConflict?.id === conflict.id;

              return (
                <button
                  key={conflict.id}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => setSelectedConflictId(conflict.id)}
                  className={`w-full p-3.5 rounded-xl border text-left transition-all cursor-pointer block focus:ring-2 focus:ring-indigo-600 focus:outline-hidden ${
                    isSelected
                      ? 'bg-rose-50 border-rose-400 shadow-sm ring-1 ring-rose-300'
                      : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                          conflict.severity === 'critical'
                            ? 'bg-rose-600 text-white'
                            : 'bg-amber-500 text-slate-950'
                        }`}
                      >
                        {conflict.type.replace('_', ' ')}
                      </span>
                      <span className="text-xs font-semibold text-slate-600">
                        {alloc?.day} {alloc?.timeSlot}
                      </span>
                    </div>

                    {conflict.alternatives && conflict.alternatives.length > 0 && (
                      <span className="text-xs text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded font-bold">
                        {conflict.alternatives.length} alt{conflict.alternatives.length === 1 ? '' : 's'}
                      </span>
                    )}
                  </div>

                  <h3 className="text-xs font-bold text-slate-900 mt-2">
                    {conflict.title}
                  </h3>
                  <p className="text-xs text-slate-600 line-clamp-2 mt-1">
                    {conflict.description}
                  </p>

                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                    <span className="font-semibold text-slate-800 truncate max-w-[180px]">
                      {alloc?.courseTitle}
                    </span>
                    <span className="text-indigo-600 flex items-center gap-0.5 font-bold">
                      Inspect <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Alternative Solver & Comparison */}
        <div className="lg:col-span-7">
          {currentConflict && activeAllocation ? (
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
              {/* Conflict Header */}
              <div className="pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2 text-xs text-rose-800 font-bold mb-1">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>Conflict Analysis & Resolution Details</span>
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  {currentConflict.title}
                </h3>
                <p className="text-xs text-slate-700 mt-1 leading-relaxed">
                  {currentConflict.description}
                </p>
              </div>

              {/* Side-by-side comparison: Problematic assignment vs Recommended resolution */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Allocation Comparison: Current vs. Proposed
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Current Problem Card */}
                  <div className="p-3.5 rounded-xl border border-rose-200 bg-rose-50/70 text-xs space-y-2">
                    <div className="flex items-center justify-between font-bold text-rose-900 border-b border-rose-200 pb-1.5">
                      <span>Current Assignment</span>
                      <span className="text-rose-700 bg-rose-200/80 px-2 py-0.5 rounded text-[11px]">Conflict</span>
                    </div>

                    <div className="space-y-1 text-slate-800">
                      <div>
                        <span className="text-slate-600 font-medium">Facility: </span>
                        <strong>{currentRoom?.name || 'Unassigned'}</strong>
                      </div>
                      <div>
                        <span className="text-slate-600 font-medium">Capacity: </span>
                        <span className="font-bold text-rose-800">
                          {currentRoom?.capacity || 0} seats (Deficit of {Math.max(0, activeAllocation.studentStrength - (currentRoom?.capacity || 0))})
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-600 font-medium">Enrolled: </span>
                        <strong>{activeAllocation.studentStrength} Students</strong>
                      </div>
                      <div>
                        <span className="text-slate-600 font-medium">Instructor: </span>
                        <span>{currentFaculty?.name || 'Unassigned'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Proposed Resolution Card */}
                  {topAlternative ? (
                    <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/70 text-xs space-y-2">
                      <div className="flex items-center justify-between font-bold text-emerald-950 border-b border-emerald-200 pb-1.5">
                        <span>Proposed Target ({topAlternative.roomCode})</span>
                        <span className="text-emerald-800 bg-emerald-200/80 px-2 py-0.5 rounded text-[11px]">
                          {topAlternative.matchScore}% Match
                        </span>
                      </div>

                      <div className="space-y-1 text-slate-800">
                        <div>
                          <span className="text-slate-600 font-medium">Facility: </span>
                          <strong>{topAlternative.roomName}</strong>
                        </div>
                        <div>
                          <span className="text-slate-600 font-medium">Capacity: </span>
                          <span className="font-bold text-emerald-800">
                            {topAlternative.capacity} seats (+{topAlternative.capacityHeadroom} buffer)
                          </span>
                        </div>
                        {topAlternative.availableComputers > 0 && (
                          <div>
                            <span className="text-slate-600 font-medium">Workstations: </span>
                            <span className="font-bold text-blue-900">{topAlternative.availableComputers} Working PCs</span>
                          </div>
                        )}
                        <div>
                          <span className="text-slate-600 font-medium">Location: </span>
                          <span>{topAlternative.building}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 text-xs flex items-center justify-center text-slate-500">
                      No vacant room found in this exact slot.
                    </div>
                  )}
                </div>
              </div>

              {/* Alternative Recommendations */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-800">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span>Ranked Reallocation Options</span>
                  </div>
                  <span className="text-xs text-slate-600">
                    Evaluated by capacity, equipment & non-overlap
                  </span>
                </div>

                {currentConflict.alternatives && currentConflict.alternatives.length > 0 ? (
                  <div className="space-y-2.5">
                    {currentConflict.alternatives.map((alt) => (
                      <div
                        key={alt.roomId}
                        className={`p-4 rounded-xl border transition-all ${
                          alt.isRecommended
                            ? 'bg-emerald-50/70 border-emerald-300 ring-1 ring-emerald-200'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              {alt.isRecommended && (
                                <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-600 text-white uppercase tracking-wider">
                                  Top Recommendation
                                </span>
                              )}
                              <h4 className="text-sm font-bold text-slate-900">
                                {alt.roomName}
                              </h4>
                              <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                                {alt.matchScore}% Match
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-700 mt-1.5">
                              <span className="flex items-center gap-1 font-semibold text-slate-800">
                                <Users className="w-3.5 h-3.5 text-slate-500" />
                                Capacity: {alt.capacity} seats (+{alt.capacityHeadroom} buffer)
                              </span>
                              {alt.availableComputers > 0 && (
                                <span className="flex items-center gap-1 font-semibold text-blue-900">
                                  <Cpu className="w-3.5 h-3.5 text-blue-600" />
                                  {alt.availableComputers} Working PCs
                                </span>
                              )}
                              <span className="flex items-center gap-1 text-slate-600">
                                <Building className="w-3.5 h-3.5 text-slate-400" />
                                {alt.building}
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={() =>
                              onApplyAlternative(
                                activeAllocation.id,
                                alt.roomId,
                                `Reallocated from ${currentRoom?.name || 'troubled venue'} to ${alt.roomName} via Conflict Resolution Workbench.`
                              )
                            }
                            className={`inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex-shrink-0 focus:ring-2 focus:outline-hidden ${
                              alt.isRecommended
                                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs focus:ring-emerald-400'
                                : 'bg-slate-900 hover:bg-slate-800 text-white focus:ring-slate-400'
                            }`}
                          >
                            <span>Apply Reallocation</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Pros and Cons */}
                        <div className="mt-2.5 pt-2 border-t border-slate-200/80 text-xs space-y-1">
                          {alt.pros.map((pro, pIdx) => (
                            <div key={pIdx} className="text-emerald-900 flex items-center gap-1.5 font-medium">
                              <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                              <span>{pro}</span>
                            </div>
                          ))}
                          {alt.cons &&
                            alt.cons.map((con, cIdx) => (
                              <div key={cIdx} className="text-amber-900 flex items-center gap-1.5 font-medium">
                                <Info className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                                <span>{con}</span>
                              </div>
                            ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 bg-amber-50 rounded-lg border border-amber-200 text-amber-900 text-xs">
                    <p className="font-semibold">No direct room alternatives currently vacant in this timeslot.</p>
                    <p className="mt-1 text-slate-700">
                      Recommendation: Consider shifting this class to a different time slot or splitting into two lab batches.
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-600 text-xs">
              Select a conflict from the left panel to inspect alternatives.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
