import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  User,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Edit2,
  Cpu,
  Plus,
  LayoutGrid,
  List,
  RotateCcw,
  Download,
} from 'lucide-react';
import {
  Allocation,
  Room,
  Faculty,
  Conflict,
  DayOfWeek,
  ActivityType,
} from '../types';
import { DAYS_OF_WEEK, TIME_SLOTS } from '../data/initialData';

interface ScheduleTimetableProps {
  allocations: Allocation[];
  rooms: Room[];
  facultyList: Faculty[];
  conflicts: Conflict[];
  onSelectAllocation: (allocation: Allocation) => void;
  onEditAllocation: (allocation: Allocation) => void;
  onNewAllocationForSlot?: (day: DayOfWeek, slot: string) => void;
  onResolveConflictForAllocation: (allocation: Allocation) => void;
  onExportCSV?: () => void;
}

export const ScheduleTimetable: React.FC<ScheduleTimetableProps> = ({
  allocations,
  rooms,
  facultyList,
  conflicts,
  onSelectAllocation,
  onEditAllocation,
  onNewAllocationForSlot,
  onResolveConflictForAllocation,
  onExportCSV,
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'agenda'>('grid');
  const [selectedDay, setSelectedDay] = useState<DayOfWeek | 'all'>('all');
  const [selectedActivity, setSelectedActivity] = useState<ActivityType | 'all'>('all');
  const [selectedRoomFilter, setSelectedRoomFilter] = useState<string>('all');
  const [showConflictsOnly, setShowConflictsOnly] = useState<boolean>(false);

  // Filter allocations
  const filteredAllocations = allocations.filter((alloc) => {
    if (selectedDay !== 'all' && alloc.day !== selectedDay) return false;
    if (selectedActivity !== 'all' && alloc.activityType !== selectedActivity) return false;
    if (selectedRoomFilter !== 'all' && alloc.assignedRoomId !== selectedRoomFilter) return false;
    if (showConflictsOnly) {
      const hasConflict = conflicts.some((c) => c.allocationId === alloc.id);
      if (!hasConflict) return false;
    }
    return true;
  });

  const getConflictForAllocation = (allocId: string) => {
    return conflicts.find((c) => c.allocationId === allocId);
  };

  const getRoom = (roomId: string) => rooms.find((r) => r.id === roomId);
  const getFaculty = (facultyId: string) => facultyList.find((f) => f.id === facultyId);

  const daysToDisplay: DayOfWeek[] = selectedDay === 'all' ? [...DAYS_OF_WEEK] : [selectedDay];

  const handleResetFilters = () => {
    setSelectedDay('all');
    setSelectedActivity('all');
    setSelectedRoomFilter('all');
    setShowConflictsOnly(false);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Filter & View Toolbar */}
      <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <CalendarIcon className="w-5 h-5 text-indigo-600 flex-shrink-0" />
          <h2 className="text-base font-bold text-slate-900">
            Campus Timetable & Schedule Grid
          </h2>
          <span className="text-xs font-semibold text-slate-600">
            ({filteredAllocations.length} sessions)
          </span>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Grid vs Agenda Mode Switcher */}
          <div
            role="radiogroup"
            aria-label="Timetable layout mode"
            className="inline-flex rounded-lg border border-slate-300 bg-white p-0.5 text-xs shadow-xs"
          >
            <button
              type="button"
              role="radio"
              aria-checked={viewMode === 'grid'}
              onClick={() => setViewMode('grid')}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer focus:ring-2 focus:ring-indigo-600 focus:outline-hidden ${
                viewMode === 'grid'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Grid</span>
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={viewMode === 'agenda'}
              onClick={() => setViewMode('agenda')}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer focus:ring-2 focus:ring-indigo-600 focus:outline-hidden ${
                viewMode === 'agenda'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Agenda</span>
            </button>
          </div>

          {/* Day Selector Buttons */}
          <div
            role="group"
            aria-label="Filter by day"
            className="hidden sm:inline-flex rounded-lg border border-slate-300 bg-white p-0.5 text-xs shadow-xs"
          >
            <button
              type="button"
              aria-pressed={selectedDay === 'all'}
              onClick={() => setSelectedDay('all')}
              className={`px-2 py-1 rounded-md font-semibold transition-colors cursor-pointer focus:ring-2 focus:ring-indigo-600 focus:outline-hidden ${
                selectedDay === 'all'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              All
            </button>
            {DAYS_OF_WEEK.map((day) => (
              <button
                key={day}
                type="button"
                aria-pressed={selectedDay === day}
                onClick={() => setSelectedDay(day)}
                className={`px-2 py-1 rounded-md font-semibold transition-colors cursor-pointer focus:ring-2 focus:ring-indigo-600 focus:outline-hidden ${
                  selectedDay === day
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-700 hover:text-slate-900'
                }`}
              >
                {day.slice(0, 3)}
              </button>
            ))}
          </div>

          {/* Activity Filter */}
          <div className="flex items-center">
            <label htmlFor="filter-activity" className="sr-only">
              Filter by Activity Type
            </label>
            <select
              id="filter-activity"
              value={selectedActivity}
              onChange={(e) => setSelectedActivity(e.target.value as any)}
              className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-800 shadow-xs focus:ring-2 focus:ring-indigo-600 focus:outline-hidden cursor-pointer"
            >
              <option value="all">All Activities</option>
              <option value="lab_practical">Laboratory Practical</option>
              <option value="lecture">Theory Lecture</option>
              <option value="seminar">Seminar / Defense</option>
            </select>
          </div>

          {/* Room Filter */}
          <div className="flex items-center">
            <label htmlFor="filter-room" className="sr-only">
              Filter by Room
            </label>
            <select
              id="filter-room"
              value={selectedRoomFilter}
              onChange={(e) => setSelectedRoomFilter(e.target.value)}
              className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-800 shadow-xs focus:ring-2 focus:ring-indigo-600 focus:outline-hidden cursor-pointer max-w-[140px] truncate"
            >
              <option value="all">All Rooms & Labs</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.code} ({r.capacity} seats)
                </option>
              ))}
            </select>
          </div>

          {/* Conflicts Only Toggle */}
          <button
            type="button"
            aria-pressed={showConflictsOnly}
            onClick={() => setShowConflictsOnly(!showConflictsOnly)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer focus:ring-2 focus:ring-rose-500 focus:outline-hidden ${
              showConflictsOnly
                ? 'bg-rose-100 text-rose-900 border-rose-400'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            <AlertTriangle className={`w-3.5 h-3.5 ${showConflictsOnly ? 'text-rose-700' : 'text-slate-500'}`} />
            <span>Conflicts Only</span>
          </button>

          {/* Export CSV Button */}
          {onExportCSV && (
            <button
              type="button"
              onClick={onExportCSV}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 transition-colors cursor-pointer focus:ring-2 focus:ring-indigo-600 focus:outline-hidden"
              title="Export timetable to CSV"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden md:inline">Export CSV</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Schedule Content */}
      <div className="p-4 space-y-6">
        {filteredAllocations.length === 0 ? (
          /* Empty State */
          <div className="py-12 px-4 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300 max-w-lg mx-auto my-6">
            <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-900">
              No sessions match your filter criteria
            </h3>
            <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto">
              Try adjusting the day, activity, or room filter, or clear all filters to view the full campus timetable.
            </p>
            <button
              type="button"
              onClick={handleResetFilters}
              className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs cursor-pointer focus:ring-2 focus:ring-indigo-600 focus:outline-hidden"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset All Filters</span>
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          /* Grid View Mode */
          daysToDisplay.map((day) => {
            const dayAllocations = filteredAllocations.filter((a) => a.day === day);

            return (
              <div key={day} className="space-y-2">
                <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-indigo-600" aria-hidden="true" />
                    {day}
                  </span>
                  <span className="text-xs font-semibold text-slate-600">
                    {dayAllocations.length} class{dayAllocations.length === 1 ? '' : 'es'} scheduled
                  </span>
                </div>

                {/* Time slot columns */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                  {TIME_SLOTS.map((slot) => {
                    const slotAllocations = dayAllocations.filter((a) => a.timeSlot === slot);

                    return (
                      <div
                        key={`${day}-${slot}`}
                        className="rounded-lg border border-slate-200 bg-slate-50/50 p-2.5 flex flex-col min-h-[140px]"
                      >
                        {/* Slot Header */}
                        <div className="flex items-center justify-between text-xs font-semibold text-slate-700 pb-2 border-b border-slate-200 mb-2">
                          <span className="flex items-center gap-1 text-slate-800 font-bold">
                            <Clock className="w-3.5 h-3.5 text-slate-500" />
                            {slot}
                          </span>
                          {slotAllocations.length === 0 && (
                            <span className="text-[11px] text-slate-500 font-medium">Available</span>
                          )}
                        </div>

                        {/* Allocations in this slot */}
                        <div className="space-y-2 flex-1">
                          {slotAllocations.length > 0 ? (
                            slotAllocations.map((alloc) => {
                              const conflict = getConflictForAllocation(alloc.id);
                              const room = getRoom(alloc.assignedRoomId);
                              const faculty = getFaculty(alloc.assignedFacultyId);
                              const isCapacityMismatch = room && alloc.studentStrength > room.capacity;

                              return (
                                <div
                                  key={alloc.id}
                                  className={`p-3 rounded-lg border transition-all text-xs relative group ${
                                    conflict
                                      ? 'bg-rose-50 border-rose-300 shadow-xs'
                                      : alloc.status === 'reallocated'
                                      ? 'bg-emerald-50 border-emerald-300 shadow-xs'
                                      : 'bg-white border-slate-200 hover:border-indigo-300 shadow-xs'
                                  }`}
                                >
                                  {/* Activity and Status Badges */}
                                  <div className="flex items-center justify-between gap-1 mb-1.5">
                                    <span
                                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                        alloc.activityType === 'lab_practical'
                                          ? 'bg-emerald-100 text-emerald-900'
                                          : alloc.activityType === 'lecture'
                                          ? 'bg-blue-100 text-blue-900'
                                          : 'bg-amber-100 text-amber-950'
                                      }`}
                                    >
                                      {alloc.activityType === 'lab_practical'
                                        ? 'Lab'
                                        : alloc.activityType === 'lecture'
                                        ? 'Lecture'
                                        : 'Seminar'}
                                    </span>

                                    {conflict ? (
                                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-800 bg-rose-100 px-1.5 py-0.5 rounded">
                                        <AlertTriangle className="w-3 h-3 text-rose-600" />
                                        Clash
                                      </span>
                                    ) : alloc.status === 'reallocated' ? (
                                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">
                                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                        Reallocated
                                      </span>
                                    ) : (
                                      <span className="text-[11px] font-semibold text-slate-600">
                                        {alloc.courseCode}
                                      </span>
                                    )}
                                  </div>

                                  {/* Course Title */}
                                  <h3 className="font-bold text-slate-900 line-clamp-1 mb-1.5" title={alloc.courseTitle}>
                                    {alloc.courseTitle}
                                  </h3>

                                  {/* Venue and Capacity */}
                                  <div className="space-y-1 text-slate-700 text-xs">
                                    <div className="flex items-center justify-between">
                                      <span className="flex items-center gap-1 text-slate-800 font-semibold truncate max-w-[130px]">
                                        <MapPin className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                                        {room?.name || 'Unassigned'}
                                      </span>

                                      {/* Capacity Badge */}
                                      {room && (
                                        <span
                                          className={`px-1.5 py-0.5 rounded text-[11px] font-bold ${
                                            isCapacityMismatch
                                              ? 'bg-rose-700 text-white'
                                              : 'bg-slate-100 text-slate-800'
                                          }`}
                                          title={`Enrolled: ${alloc.studentStrength} students / Room Capacity: ${room.capacity}`}
                                        >
                                          {alloc.studentStrength}/{room.capacity}
                                        </span>
                                      )}
                                    </div>

                                    {/* Faculty */}
                                    <div className="flex items-center gap-1 text-slate-600">
                                      <User className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                                      <span className="truncate">{faculty?.name || 'Unassigned'}</span>
                                    </div>

                                    {/* Equipment requirement tag */}
                                    {alloc.requiredEquipment.length > 0 && (
                                      <div className="flex items-center gap-1 text-slate-600 text-xs pt-0.5">
                                        <Cpu className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                                        <span>
                                          {alloc.requiredEquipment.map((eq) => `${eq.minQuantity} ${eq.name}`).join(', ')}
                                        </span>
                                      </div>
                                    )}
                                  </div>

                                  {/* Action Buttons */}
                                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
                                    {conflict ? (
                                      <button
                                        type="button"
                                        onClick={() => onResolveConflictForAllocation(alloc)}
                                        className="inline-flex items-center gap-1 text-xs font-bold text-rose-800 hover:text-rose-950 bg-rose-100 hover:bg-rose-200 px-2 py-0.5 rounded transition-colors cursor-pointer focus:ring-2 focus:ring-rose-600 focus:outline-hidden"
                                      >
                                        <Sparkles className="w-3.5 h-3.5" />
                                        <span>Resolve Clash</span>
                                      </button>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => onEditAllocation(alloc)}
                                        className="inline-flex items-center gap-1 text-xs font-medium text-slate-700 hover:text-indigo-600 transition-colors cursor-pointer focus:ring-2 focus:ring-indigo-600 focus:outline-hidden rounded px-1"
                                      >
                                        <Edit2 className="w-3 h-3" />
                                        <span>Modify</span>
                                      </button>
                                    )}

                                    <button
                                      type="button"
                                      onClick={() => onSelectAllocation(alloc)}
                                      className="text-xs font-medium text-indigo-700 hover:underline cursor-pointer focus:ring-2 focus:ring-indigo-600 focus:outline-hidden rounded px-1"
                                    >
                                      Details
                                    </button>
                                  </div>
                                </div>
                              );
                            })
                          ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center p-2 text-slate-500 text-xs">
                              <span className="text-xs">Free Slot</span>
                              {onNewAllocationForSlot && (
                                <button
                                  type="button"
                                  onClick={() => onNewAllocationForSlot(day, slot)}
                                  className="mt-1 inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer focus:ring-2 focus:ring-indigo-600 focus:outline-hidden px-1.5 py-0.5 rounded"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  Book
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        ) : (
          /* Agenda / List View Mode (Ideal for scanning and screen readers) */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-900 border-b border-slate-300 uppercase tracking-wider font-bold text-[11px]">
                  <th scope="col" className="p-3">Day & Time</th>
                  <th scope="col" className="p-3">Course</th>
                  <th scope="col" className="p-3">Activity</th>
                  <th scope="col" className="p-3">Enrolled</th>
                  <th scope="col" className="p-3">Venue</th>
                  <th scope="col" className="p-3">Instructor</th>
                  <th scope="col" className="p-3">Status</th>
                  <th scope="col" className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredAllocations.map((alloc) => {
                  const conflict = getConflictForAllocation(alloc.id);
                  const room = getRoom(alloc.assignedRoomId);
                  const faculty = getFaculty(alloc.assignedFacultyId);
                  const isCapacityMismatch = room && alloc.studentStrength > room.capacity;

                  return (
                    <tr
                      key={alloc.id}
                      className={`hover:bg-slate-50 transition-colors ${
                        conflict ? 'bg-rose-50/60' : alloc.status === 'reallocated' ? 'bg-emerald-50/40' : ''
                      }`}
                    >
                      <td className="p-3 font-semibold text-slate-900">
                        {alloc.day} <span className="block text-slate-600 font-normal">{alloc.timeSlot}</span>
                      </td>
                      <td className="p-3">
                        <div className="font-bold text-slate-900">{alloc.courseTitle}</div>
                        <div className="text-slate-600 font-mono text-[11px]">{alloc.courseCode}</div>
                      </td>
                      <td className="p-3 capitalize">
                        {alloc.activityType.replace('_', ' ')}
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-1.5 py-0.5 rounded font-bold ${
                            isCapacityMismatch ? 'bg-rose-700 text-white' : 'text-slate-800'
                          }`}
                        >
                          {alloc.studentStrength} students
                        </span>
                      </td>
                      <td className="p-3 font-medium text-slate-900">
                        {room ? `${room.name} (${room.capacity} seats)` : 'Unassigned'}
                      </td>
                      <td className="p-3">
                        {faculty?.name || 'Unassigned'}
                      </td>
                      <td className="p-3">
                        {conflict ? (
                          <span className="inline-flex items-center gap-1 font-bold text-rose-800 bg-rose-100 px-2 py-0.5 rounded text-[11px]">
                            <AlertTriangle className="w-3 h-3 text-rose-600" />
                            Clash
                          </span>
                        ) : alloc.status === 'reallocated' ? (
                          <span className="inline-flex items-center gap-1 font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded text-[11px]">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Reallocated
                          </span>
                        ) : (
                          <span className="text-slate-600 font-medium">Confirmed</span>
                        )}
                      </td>
                      <td className="p-3 text-right space-x-2">
                        {conflict ? (
                          <button
                            type="button"
                            onClick={() => onResolveConflictForAllocation(alloc)}
                            className="text-rose-800 hover:text-rose-950 font-bold underline cursor-pointer"
                          >
                            Resolve
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onEditAllocation(alloc)}
                            className="text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
                          >
                            Edit
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onSelectAllocation(alloc)}
                          className="text-slate-600 hover:text-slate-900 font-medium cursor-pointer"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
