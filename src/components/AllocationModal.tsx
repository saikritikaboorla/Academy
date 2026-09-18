import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import {
  Allocation,
  Room,
  Faculty,
  DayOfWeek,
  ActivityType,
} from '../types';
import { DAYS_OF_WEEK, TIME_SLOTS } from '../data/initialData';
import { validateAllocation, findAlternativesForAllocation } from '../utils/conflictEngine';
import { useA11yModal } from '../utils/useA11yModal';

interface AllocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  allocationToEdit?: Allocation | null;
  initialDay?: DayOfWeek;
  initialTimeSlot?: string;
  allAllocations: Allocation[];
  rooms: Room[];
  facultyList: Faculty[];
  onSave: (allocation: Allocation) => void;
  onDelete?: (allocationId: string) => void;
}

export const AllocationModal: React.FC<AllocationModalProps> = ({
  isOpen,
  onClose,
  allocationToEdit,
  initialDay,
  initialTimeSlot,
  allAllocations,
  rooms,
  facultyList,
  onSave,
  onDelete,
}) => {
  const modalRef = useA11yModal(isOpen, onClose);

  const [courseCode, setCourseCode] = useState('CS201');
  const [courseTitle, setCourseTitle] = useState('Data Structures');
  const [activityType, setActivityType] = useState<ActivityType>('lab_practical');
  const [studentStrength, setStudentStrength] = useState<number>(65);
  const [department, setDepartment] = useState('Computer Science & Engineering');
  const [day, setDay] = useState<DayOfWeek>(initialDay || 'Monday');
  const [timeSlot, setTimeSlot] = useState<string>(initialTimeSlot || '10:45 - 12:15');
  const [assignedRoomId, setAssignedRoomId] = useState<string>('room-lab-204');
  const [assignedFacultyId, setAssignedFacultyId] = useState<string>('fac-alan-vance');
  const [requireComputers, setRequireComputers] = useState<boolean>(true);

  // Initialize or reset form state
  useEffect(() => {
    if (allocationToEdit) {
      setCourseCode(allocationToEdit.courseCode);
      setCourseTitle(allocationToEdit.courseTitle);
      setActivityType(allocationToEdit.activityType);
      setStudentStrength(allocationToEdit.studentStrength);
      setDepartment(allocationToEdit.department);
      setDay(allocationToEdit.day);
      setTimeSlot(allocationToEdit.timeSlot);
      setAssignedRoomId(allocationToEdit.assignedRoomId);
      setAssignedFacultyId(allocationToEdit.assignedFacultyId);
      const hasPCs = allocationToEdit.requiredEquipment.some((eq) =>
        eq.name.toLowerCase().includes('computer') || eq.name.toLowerCase().includes('pc')
      );
      setRequireComputers(hasPCs || allocationToEdit.activityType === 'lab_practical');
    } else {
      setCourseCode('');
      setCourseTitle('');
      setActivityType('lecture');
      setStudentStrength(45);
      setDepartment('Computer Science & Engineering');
      setDay(initialDay || 'Monday');
      setTimeSlot(initialTimeSlot || '09:00 - 10:30');
      setAssignedRoomId(rooms[0]?.id || '');
      setAssignedFacultyId(facultyList[0]?.id || '');
      setRequireComputers(false);
    }
  }, [allocationToEdit, initialDay, initialTimeSlot, rooms, facultyList, isOpen]);

  // Temporary mock allocation for live validation
  const currentDraftAllocation: Allocation = useMemo(() => {
    return {
      id: allocationToEdit ? allocationToEdit.id : 'draft-temp',
      courseCode: courseCode || 'COURSE',
      courseTitle: courseTitle || 'Untitled Course',
      activityType,
      studentStrength: Number(studentStrength) || 0,
      department,
      day,
      timeSlot,
      assignedRoomId,
      assignedFacultyId,
      requiredEquipment: requireComputers ? [{ name: 'computers', minQuantity: Number(studentStrength) }] : [],
      status: 'confirmed',
    };
  }, [
    allocationToEdit,
    courseCode,
    courseTitle,
    activityType,
    studentStrength,
    department,
    day,
    timeSlot,
    assignedRoomId,
    assignedFacultyId,
    requireComputers,
  ]);

  // Live conflict evaluation
  const liveConflicts = useMemo(() => {
    return validateAllocation(currentDraftAllocation, allAllocations, rooms, facultyList);
  }, [currentDraftAllocation, allAllocations, rooms, facultyList]);

  const criticalConflicts = liveConflicts.filter((c) => c.severity === 'critical');
  const hasCriticalConflict = criticalConflicts.length > 0;

  // Suggested alternatives if there is a conflict
  const suggestedAlternatives = useMemo(() => {
    if (hasCriticalConflict) {
      return findAlternativesForAllocation(currentDraftAllocation, allAllocations, rooms);
    }
    return [];
  }, [hasCriticalConflict, currentDraftAllocation, allAllocations, rooms]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (hasCriticalConflict) {
      return; // Prevent conflicting allocations from being saved!
    }

    onSave({
      ...currentDraftAllocation,
      id: allocationToEdit ? allocationToEdit.id : `alloc-${Date.now()}`,
      status: 'confirmed',
    });
    onClose();
  };

  const selectedRoom = rooms.find((r) => r.id === assignedRoomId);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="alloc-modal-title"
      ref={modalRef}
    >
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col text-slate-900 relative">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 id="alloc-modal-title" className="text-base font-bold text-slate-900">
              {allocationToEdit ? 'Modify Campus Allocation' : 'Create New Course Allocation'}
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              Allocates rooms, labs, faculty and equipment with live conflict prevention
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close allocation modal"
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer focus:ring-2 focus:ring-indigo-600 focus:outline-hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Live Conflict Warning Banner if invalid */}
          {hasCriticalConflict && (
            <div
              role="alert"
              aria-live="assertive"
              className="p-3.5 rounded-xl bg-rose-50 border border-rose-300 text-rose-950 text-xs space-y-2"
            >
              <div className="flex items-center gap-2 font-bold text-rose-800">
                <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>Conflict Detected — Saving Prevented</span>
              </div>
              <ul className="list-disc pl-5 space-y-1 text-rose-900">
                {criticalConflicts.map((c) => (
                  <li key={c.id}>
                    <strong>{c.title}:</strong> {c.description}
                  </li>
                ))}
              </ul>

              {/* Quick 1-click alternative pills */}
              {suggestedAlternatives.length > 0 && (
                <div className="pt-2 border-t border-rose-200/80">
                  <span className="font-semibold text-slate-800 block mb-1">
                    Quick-pick suggested conflict-free facility:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {suggestedAlternatives.slice(0, 3).map((alt) => (
                      <button
                        key={alt.roomId}
                        type="button"
                        onClick={() => setAssignedRoomId(alt.roomId)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-white text-emerald-800 border border-emerald-300 hover:bg-emerald-50 transition-colors cursor-pointer focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                      >
                        <Sparkles className="w-3 h-3 text-emerald-600" />
                        <span>
                          {alt.roomCode} ({alt.capacity} seats, {alt.matchScore}% Match)
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Form Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="course-code" className="block text-xs font-semibold text-slate-800 mb-1">
                Course Code *
              </label>
              <input
                id="course-code"
                type="text"
                required
                value={courseCode}
                onChange={(e) => setCourseCode(e.target.value)}
                placeholder="e.g. CS201"
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label htmlFor="course-title" className="block text-xs font-semibold text-slate-800 mb-1">
                Course Title *
              </label>
              <input
                id="course-title"
                type="text"
                required
                value={courseTitle}
                onChange={(e) => setCourseTitle(e.target.value)}
                placeholder="e.g. Data Structures"
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label htmlFor="activity-type" className="block text-xs font-semibold text-slate-800 mb-1">
                Activity Type
              </label>
              <select
                id="activity-type"
                value={activityType}
                onChange={(e) => {
                  const newType = e.target.value as ActivityType;
                  setActivityType(newType);
                  if (newType === 'lab_practical') setRequireComputers(true);
                }}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 focus:outline-hidden bg-white"
              >
                <option value="lecture">Theory Lecture</option>
                <option value="lab_practical">Laboratory Practical</option>
                <option value="seminar">Seminar / Defense</option>
                <option value="workshop">Workshop</option>
              </select>
            </div>

            <div>
              <label htmlFor="student-strength" className="block text-xs font-semibold text-slate-800 mb-1">
                Student Strength *
              </label>
              <input
                id="student-strength"
                type="number"
                min="1"
                max="250"
                required
                value={studentStrength}
                onChange={(e) => setStudentStrength(parseInt(e.target.value) || 0)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label htmlFor="department-name" className="block text-xs font-semibold text-slate-800 mb-1">
                Department
              </label>
              <input
                id="department-name"
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Schedule Timing */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label htmlFor="select-day" className="block text-xs font-semibold text-slate-800 mb-1">
                Day of Week
              </label>
              <select
                id="select-day"
                value={day}
                onChange={(e) => setDay(e.target.value as DayOfWeek)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 focus:outline-hidden bg-white"
              >
                {DAYS_OF_WEEK.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="select-slot" className="block text-xs font-semibold text-slate-800 mb-1">
                Time Slot
              </label>
              <select
                id="select-slot"
                value={timeSlot}
                onChange={(e) => setTimeSlot(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 focus:outline-hidden bg-white"
              >
                {TIME_SLOTS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Facility & Faculty Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label htmlFor="select-venue" className="block text-xs font-semibold text-slate-800 mb-1">
                Assigned Venue (Classroom / Lab) *
              </label>
              <select
                id="select-venue"
                value={assignedRoomId}
                onChange={(e) => setAssignedRoomId(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 focus:outline-hidden bg-white"
              >
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} (Cap: {r.capacity} seats) {r.status !== 'available' ? `[${r.status}]` : ''}
                  </option>
                ))}
              </select>
              {selectedRoom && (
                <span className="text-xs text-slate-600 block mt-1">
                  Capacity: {selectedRoom.capacity} seats • {selectedRoom.building}
                </span>
              )}
            </div>

            <div>
              <label htmlFor="select-faculty" className="block text-xs font-semibold text-slate-800 mb-1">
                Assigned Faculty *
              </label>
              <select
                id="select-faculty"
                value={assignedFacultyId}
                onChange={(e) => setAssignedFacultyId(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 focus:outline-hidden bg-white"
              >
                {facultyList.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} ({f.department}) {f.status !== 'active' ? `[${f.status}]` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Equipment Mandate Checkbox */}
          <div className="pt-2">
            <label className="flex items-center gap-2.5 text-xs text-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={requireComputers}
                onChange={(e) => setRequireComputers(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 cursor-pointer"
              />
              <span className="font-medium">
                Mandate 1-to-1 PC Workstations (Requires {studentStrength} functional computers)
              </span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            {allocationToEdit && onDelete ? (
              <button
                type="button"
                onClick={() => {
                  onDelete(allocationToEdit.id);
                  onClose();
                }}
                className="text-xs font-semibold text-rose-600 hover:text-rose-800 cursor-pointer focus:ring-2 focus:ring-rose-600 focus:outline-hidden px-2 py-1 rounded"
              >
                Delete Allocation
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 cursor-pointer focus:ring-2 focus:ring-slate-400 focus:outline-hidden"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={hasCriticalConflict}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all focus:ring-2 focus:outline-hidden ${
                  hasCriticalConflict
                    ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs cursor-pointer focus:ring-indigo-600'
                }`}
              >
                {allocationToEdit ? 'Save Changes' : 'Confirm Allocation'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
