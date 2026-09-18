import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { MetricCards } from './components/MetricCards';
import { ConflictAlertBanner } from './components/ConflictAlertBanner';
import { ScheduleTimetable } from './components/ScheduleTimetable';
import { ConflictReallocationCenter } from './components/ConflictReallocationCenter';
import { ResourceDirectory } from './components/ResourceDirectory';
import { EmergencySimulatorModal } from './components/EmergencySimulatorModal';
import { AllocationModal } from './components/AllocationModal';
import { ReallocationHistoryModal } from './components/ReallocationHistoryModal';
import { AIAssistantDrawer } from './components/AIAssistantDrawer';

import {
  Allocation,
  Room,
  Faculty,
  EquipmentItem,
  ReallocationLog,
  RoomStatus,
  FacultyStatus,
  DayOfWeek,
} from './types';

import {
  INITIAL_ROOMS,
  INITIAL_FACULTY,
  INITIAL_EQUIPMENT,
  INITIAL_ALLOCATIONS,
} from './data/initialData';

import {
  validateAllAllocations,
  calculateCampusMetrics,
  findAlternativesForAllocation,
} from './utils/conflictEngine';

import { CheckCircle2, AlertTriangle, Undo2 } from 'lucide-react';

interface UndoItem {
  allocations: Allocation[];
  logs: ReallocationLog[];
  desc: string;
}

export default function App() {
  // --- Persistent State ---
  const [rooms, setRooms] = useState<Room[]>(() => {
    const saved = localStorage.getItem('smart_campus_rooms');
    return saved ? JSON.parse(saved) : INITIAL_ROOMS;
  });

  const [facultyList, setFacultyList] = useState<Faculty[]>(() => {
    const saved = localStorage.getItem('smart_campus_faculty');
    return saved ? JSON.parse(saved) : INITIAL_FACULTY;
  });

  const [equipmentList, setEquipmentList] = useState<EquipmentItem[]>(() => {
    const saved = localStorage.getItem('smart_campus_equipment');
    return saved ? JSON.parse(saved) : INITIAL_EQUIPMENT;
  });

  const [allocations, setAllocations] = useState<Allocation[]>(() => {
    const saved = localStorage.getItem('smart_campus_allocations');
    return saved ? JSON.parse(saved) : INITIAL_ALLOCATIONS;
  });

  const [reallocationLogs, setReallocationLogs] = useState<ReallocationLog[]>(() => {
    const saved = localStorage.getItem('smart_campus_logs');
    return saved ? JSON.parse(saved) : [];
  });

  // --- Undo Stack ---
  const [undoStack, setUndoStack] = useState<UndoItem[]>([]);

  const pushUndoState = (desc: string) => {
    setUndoStack((prev) => [
      { allocations: [...allocations], logs: [...reallocationLogs], desc },
      ...prev.slice(0, 9),
    ]);
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const [lastState, ...rest] = undoStack;
    setAllocations(lastState.allocations);
    setReallocationLogs(lastState.logs);
    setUndoStack(rest);
    showToast(`Reverted: ${lastState.desc}`, 'info');
  };

  // Save to localStorage on change
  useEffect(() => {
    localStorage.setItem('smart_campus_rooms', JSON.stringify(rooms));
  }, [rooms]);

  useEffect(() => {
    localStorage.setItem('smart_campus_faculty', JSON.stringify(facultyList));
  }, [facultyList]);

  useEffect(() => {
    localStorage.setItem('smart_campus_equipment', JSON.stringify(equipmentList));
  }, [equipmentList]);

  useEffect(() => {
    localStorage.setItem('smart_campus_allocations', JSON.stringify(allocations));
  }, [allocations]);

  useEffect(() => {
    localStorage.setItem('smart_campus_logs', JSON.stringify(reallocationLogs));
  }, [reallocationLogs]);

  // --- Active Navigation Tab ---
  const [activeTab, setActiveTab] = useState<'overview' | 'schedule' | 'conflicts' | 'resources'>('overview');

  // --- Modals State ---
  const [isAllocationModalOpen, setIsAllocationModalOpen] = useState(false);
  const [allocationToEdit, setAllocationToEdit] = useState<Allocation | null>(null);
  const [initialSlotForNew, setInitialSlotForNew] = useState<{ day: DayOfWeek; slot: string } | null>(null);

  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isAIDrawerOpen, setIsAIDrawerOpen] = useState(false);

  // --- Toast Notification Banner ---
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: 'success' | 'info' | 'warning';
    showUndo?: boolean;
  } | null>(null);

  const showToast = (
    text: string,
    type: 'success' | 'info' | 'warning' = 'success',
    showUndo = false
  ) => {
    setToastMessage({ text, type, showUndo });
    setTimeout(() => {
      setToastMessage((curr) => (curr?.text === text ? null : curr));
    }, 5500);
  };

  // --- Real-time Conflict Engine Evaluation ---
  const activeConflicts = useMemo(() => {
    return validateAllAllocations(allocations, rooms, facultyList, equipmentList);
  }, [allocations, rooms, facultyList, equipmentList]);

  // --- Campus Metrics ---
  const campusMetrics = useMemo(() => {
    return calculateCampusMetrics(allocations, rooms, facultyList, activeConflicts);
  }, [allocations, rooms, facultyList, activeConflicts]);

  // --- Reallocation Action ---
  const handleApplyAlternative = (allocationId: string, targetRoomId: string, reason: string) => {
    const targetAlloc = allocations.find((a) => a.id === allocationId);
    const prevRoom = rooms.find((r) => r.id === targetAlloc?.assignedRoomId);
    const newRoom = rooms.find((r) => r.id === targetRoomId);

    if (!targetAlloc || !newRoom) return;

    pushUndoState(`Reallocation of ${targetAlloc.courseCode}`);

    // Apply update to allocations
    setAllocations((prev) =>
      prev.map((a) => {
        if (a.id === allocationId) {
          return {
            ...a,
            assignedRoomId: targetRoomId,
            status: 'reallocated',
            notes: reason,
          };
        }
        return a;
      })
    );

    // Record audit log
    const newLog: ReallocationLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      allocationId,
      courseCode: targetAlloc.courseCode,
      courseTitle: targetAlloc.courseTitle,
      reason,
      previousRoomId: prevRoom?.id || '',
      previousRoomName: prevRoom?.name || 'Previous Room',
      newRoomId: newRoom.id,
      newRoomName: newRoom.name,
    };

    setReallocationLogs((prev) => [newLog, ...prev]);

    showToast(
      `Reallocated ${targetAlloc.courseTitle} to ${newRoom.name}. Constraints satisfied!`,
      'success',
      true
    );
  };

  // --- Batch Auto-Resolve All Conflicts ---
  const handleAutoResolveAll = () => {
    if (activeConflicts.length === 0) return;

    pushUndoState('Auto-Resolve All conflicts');

    let updatedAllocations = [...allocations];
    const newLogs: ReallocationLog[] = [];
    let resolvedCount = 0;

    for (const conflict of activeConflicts) {
      if (conflict.severity === 'critical') {
        const alloc = updatedAllocations.find((a) => a.id === conflict.allocationId);
        if (!alloc) continue;

        // Find alternatives with current working snapshot
        const alternatives = findAlternativesForAllocation(alloc, updatedAllocations, rooms);
        if (alternatives.length > 0) {
          const bestAlt = alternatives[0];
          const prevRoom = rooms.find((r) => r.id === alloc.assignedRoomId);
          const newRoom = rooms.find((r) => r.id === bestAlt.roomId);

          if (newRoom) {
            updatedAllocations = updatedAllocations.map((a) =>
              a.id === alloc.id
                ? {
                    ...a,
                    assignedRoomId: newRoom.id,
                    status: 'reallocated',
                    notes: `Auto-resolved conflict: Reallocated to ${newRoom.name} (${bestAlt.matchScore}% Match)`,
                  }
                : a
            );

            newLogs.push({
              id: `log-${Date.now()}-${resolvedCount}`,
              timestamp: new Date().toISOString(),
              allocationId: alloc.id,
              courseCode: alloc.courseCode,
              courseTitle: alloc.courseTitle,
              reason: `Automated Reallocation: Shifted to ${newRoom.name} to eliminate ${conflict.title}`,
              previousRoomId: prevRoom?.id || '',
              previousRoomName: prevRoom?.name || 'Previous Room',
              newRoomId: newRoom.id,
              newRoomName: newRoom.name,
            });

            resolvedCount++;
          }
        }
      }
    }

    setAllocations(updatedAllocations);
    setReallocationLogs((prev) => [...newLogs, ...prev]);

    showToast(
      `System reallocated ${resolvedCount} conflicting session${
        resolvedCount === 1 ? '' : 's'
      } with zero cascade clashes!`,
      'success',
      true
    );
  };

  // --- Room and Faculty Status Handlers ---
  const handleUpdateRoomStatus = (roomId: string, newStatus: RoomStatus, reason?: string) => {
    setRooms((prev) =>
      prev.map((r) => (r.id === roomId ? { ...r, status: newStatus, statusReason: reason } : r))
    );

    const room = rooms.find((r) => r.id === roomId);
    if (newStatus === 'maintenance') {
      showToast(`Facility ${room?.code || roomId} marked for maintenance. Checking affected sessions...`, 'warning');
    } else {
      showToast(`Facility ${room?.code || roomId} restored to Available status.`, 'success');
    }
  };

  const handleUpdateFacultyStatus = (facultyId: string, newStatus: FacultyStatus, reason?: string) => {
    setFacultyList((prev) =>
      prev.map((f) => (f.id === facultyId ? { ...f, status: newStatus, statusReason: reason } : f))
    );

    const fac = facultyList.find((f) => f.id === facultyId);
    if (newStatus !== 'active') {
      showToast(`Instructor ${fac?.name || facultyId} marked as ${newStatus.replace('_', ' ')}.`, 'warning');
    } else {
      showToast(`Instructor ${fac?.name || facultyId} is now Active.`, 'success');
    }
  };

  // --- Emergency Simulation Presets ---
  const handleTriggerPromptSampleScenario = () => {
    pushUndoState('Load Demo Conflict');

    // Reset room statuses
    setRooms(INITIAL_ROOMS);
    setFacultyList(INITIAL_FACULTY);

    // Set Data Structures with 65 students in Lab 204 (capacity 60)
    setAllocations((prev) => {
      const existing = prev.filter((a) => a.id !== 'alloc-ds-lab-sample');
      return [
        {
          id: 'alloc-ds-lab-sample',
          courseCode: 'CS201',
          courseTitle: 'Data Structures Lab (Core CS)',
          activityType: 'lab_practical',
          studentStrength: 65,
          department: 'Computer Science & Engineering',
          day: 'Monday',
          timeSlot: '10:45 - 12:15',
          assignedRoomId: 'room-lab-204', // Capacity 60! Over capacity by 5!
          assignedFacultyId: 'fac-alan-vance',
          requiredEquipment: [{ name: 'computers', minQuantity: 65 }],
          status: 'conflict_flagged',
          notes: '65 enrolled students assigned to Lab 204 (holds only 60).',
        },
        ...existing,
      ];
    });

    showToast(
      'Loaded Prompt Scenario: Data Structures (65 students) assigned to Lab 204 (Capacity 60). Capacity mismatch flagged!',
      'warning',
      true
    );
  };

  const handleTriggerRoomMaintenance = () => {
    handleUpdateRoomStatus(
      'room-lab-204',
      'maintenance',
      'Emergency HVAC electrical repair and refrigerant leak'
    );
  };

  const handleTriggerFacultyAbsence = () => {
    handleUpdateFacultyStatus(
      'fac-alan-vance',
      'emergency_absent',
      'Medical emergency sick leave'
    );
  };

  const handleTriggerStudentSurge = () => {
    pushUndoState('Student Enrollment Surge');
    setAllocations((prev) =>
      prev.map((a) => {
        if (a.courseCode === 'CS405') {
          return {
            ...a,
            studentStrength: 78, // CR-205 capacity is 65
            notes: 'Enrollment surged from 52 to 78 students!',
          };
        }
        return a;
      })
    );
    showToast('Student Strength Surge applied: CS405 enrollment increased to 78 students.', 'warning', true);
  };

  const handleResetToCleanState = () => {
    pushUndoState('Clean State Reset');
    setRooms(INITIAL_ROOMS);
    setFacultyList(INITIAL_FACULTY);
    setEquipmentList(INITIAL_EQUIPMENT);

    // Reallocate Data Structures to Lab 301 clean
    const cleanAllocations = INITIAL_ALLOCATIONS.map((a) => {
      if (a.id === 'alloc-ds-lab-sample') {
        return {
          ...a,
          assignedRoomId: 'room-lab-301', // Lab 301 has 75 capacity & 75 PCs!
          status: 'reallocated' as const,
          notes: 'Reallocated to Lab 301 HPC Center (Capacity 75, 75 PCs). Clash-free.',
        };
      }
      return { ...a, status: 'confirmed' as const };
    });

    setAllocations(cleanAllocations);
    showToast('Campus reset to clean state: Data Structures allocated to Lab 301 (75 seats). Zero conflicts.', 'success', true);
  };

  // --- Allocation Modal Handlers ---
  const handleSaveAllocation = (newAlloc: Allocation) => {
    pushUndoState(`Saved ${newAlloc.courseCode}`);
    setAllocations((prev) => {
      const exists = prev.some((a) => a.id === newAlloc.id);
      if (exists) {
        return prev.map((a) => (a.id === newAlloc.id ? newAlloc : a));
      }
      return [newAlloc, ...prev];
    });

    showToast(`Saved schedule for ${newAlloc.courseTitle} (${newAlloc.courseCode}).`, 'success', true);
  };

  const handleDeleteAllocation = (allocId: string) => {
    pushUndoState('Deleted Allocation');
    setAllocations((prev) => prev.filter((a) => a.id !== allocId));
    showToast('Allocation removed from timetable.', 'info', true);
  };

  // --- CSV Export Handler ---
  const handleExportCSV = () => {
    const headers = ['Course Code', 'Course Title', 'Activity', 'Students', 'Day', 'Time Slot', 'Room', 'Capacity', 'Faculty', 'Status'];
    const rows = allocations.map((a) => {
      const room = rooms.find((r) => r.id === a.assignedRoomId);
      const faculty = facultyList.find((f) => f.id === a.assignedFacultyId)?.name || 'Unassigned';
      return [
        `"${a.courseCode}"`,
        `"${a.courseTitle.replace(/"/g, '""')}"`,
        `"${a.activityType}"`,
        a.studentStrength,
        `"${a.day}"`,
        `"${a.timeSlot}"`,
        `"${room?.name || 'Unassigned'}"`,
        room?.capacity || 0,
        `"${faculty}"`,
        `"${a.status}"`,
      ];
    });

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `campus_timetable_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast('Timetable exported successfully to CSV format.', 'success');
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Skip to Main Content Link for Keyboard / Screen Reader Accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-indigo-600 focus:text-white focus:font-bold focus:rounded-lg focus:shadow-lg focus:outline-hidden"
      >
        Skip to main content
      </a>

      {/* Toast Notification Banner with ARIA Live Region */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 right-5 z-50 animate-in fade-in slide-in-from-bottom-3 duration-300 max-w-md"
        >
          <div
            className={`p-3.5 rounded-xl shadow-lg border flex items-center gap-3 text-xs font-medium ${
              toastMessage.type === 'success'
                ? 'bg-slate-900 text-slate-100 border-slate-700'
                : toastMessage.type === 'warning'
                ? 'bg-amber-950 text-amber-100 border-amber-800'
                : 'bg-slate-900 text-slate-100 border-slate-700'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
            )}
            <span className="flex-1 leading-snug">{toastMessage.text}</span>

            {toastMessage.showUndo && undoStack.length > 0 && (
              <button
                type="button"
                onClick={handleUndo}
                className="inline-flex items-center gap-1 px-2 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold cursor-pointer transition-colors focus:ring-2 focus:ring-white focus:outline-hidden"
              >
                <Undo2 className="w-3 h-3" />
                <span>Undo</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setToastMessage(null)}
              aria-label="Dismiss notification"
              className="text-slate-400 hover:text-white cursor-pointer px-1 py-0.5 rounded focus:ring-2 focus:ring-white focus:outline-hidden"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Global Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        criticalConflictCount={campusMetrics.criticalConflictsCount}
        warningsCount={campusMetrics.warningsCount}
        onOpenNewAllocation={() => {
          setAllocationToEdit(null);
          setInitialSlotForNew(null);
          setIsAllocationModalOpen(true);
        }}
        onOpenEmergencySimulator={() => setIsEmergencyModalOpen(true)}
        onOpenAIAssistant={() => setIsAIDrawerOpen(true)}
        onOpenHistory={() => setIsHistoryModalOpen(true)}
        onAutoResolveAll={handleAutoResolveAll}
        onUndo={handleUndo}
        canUndo={undoStack.length > 0}
        onExportCSV={handleExportCSV}
      />

      {/* Main Content Landmark with ID for Skip Link */}
      <main id="main-content" className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5">
        {/* Metric Cards Banner */}
        <MetricCards
          metrics={campusMetrics}
          onViewConflicts={() => setActiveTab('conflicts')}
        />

        {/* Conflict Alert Banner */}
        <ConflictAlertBanner
          conflicts={activeConflicts}
          allocations={allocations}
          rooms={rooms}
          onApplyAlternative={handleApplyAlternative}
          onViewAllConflicts={() => setActiveTab('conflicts')}
        />

        {/* Tab 1: Dashboard Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-5">
            {/* Quick Demo Prompt Banner */}
            <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white rounded-xl p-4 sm:p-5 shadow-sm border border-indigo-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider bg-indigo-500 text-white">
                    Interactive Demonstration
                  </span>
                  <h3 className="text-sm font-bold text-white">
                    Smart Campus Resource Management Scenario
                  </h3>
                </div>
                <p className="text-xs text-indigo-200 max-w-2xl leading-relaxed">
                  <strong>Class:</strong> Data Structures (65 Students) • <strong>Required Resource:</strong> Computer Laboratory (65 Computers) • <strong>Initial Lab:</strong> Lab 204 (Capacity 60). The assistant detects the 5-seat deficit and recommends <strong>Lab 301 (Capacity 75, 75 PCs)</strong>.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={handleTriggerPromptSampleScenario}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-500 hover:bg-indigo-400 text-white shadow-xs cursor-pointer transition-colors focus:ring-2 focus:ring-white focus:outline-hidden"
                >
                  Load Demo Conflict
                </button>
                <button
                  type="button"
                  onClick={() => setIsEmergencyModalOpen(true)}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer transition-colors focus:ring-2 focus:ring-slate-400 focus:outline-hidden"
                >
                  More Scenarios
                </button>
              </div>
            </div>

            {/* Schedule Timetable in Overview */}
            <ScheduleTimetable
              allocations={allocations}
              rooms={rooms}
              facultyList={facultyList}
              conflicts={activeConflicts}
              onSelectAllocation={(alloc) => {
                setAllocationToEdit(alloc);
                setIsAllocationModalOpen(true);
              }}
              onEditAllocation={(alloc) => {
                setAllocationToEdit(alloc);
                setIsAllocationModalOpen(true);
              }}
              onNewAllocationForSlot={(day, slot) => {
                setAllocationToEdit(null);
                setInitialSlotForNew({ day, slot });
                setIsAllocationModalOpen(true);
              }}
              onResolveConflictForAllocation={() => {
                setActiveTab('conflicts');
              }}
              onExportCSV={handleExportCSV}
            />
          </div>
        )}

        {/* Tab 2: Timetable & Schedule Grid */}
        {activeTab === 'schedule' && (
          <ScheduleTimetable
            allocations={allocations}
            rooms={rooms}
            facultyList={facultyList}
            conflicts={activeConflicts}
            onSelectAllocation={(alloc) => {
              setAllocationToEdit(alloc);
              setIsAllocationModalOpen(true);
            }}
            onEditAllocation={(alloc) => {
              setAllocationToEdit(alloc);
              setIsAllocationModalOpen(true);
            }}
            onNewAllocationForSlot={(day, slot) => {
              setAllocationToEdit(null);
              setInitialSlotForNew({ day, slot });
              setIsAllocationModalOpen(true);
            }}
            onResolveConflictForAllocation={() => {
              setActiveTab('conflicts');
            }}
            onExportCSV={handleExportCSV}
          />
        )}

        {/* Tab 3: Conflict Workbench & Smart Reallocation */}
        {activeTab === 'conflicts' && (
          <ConflictReallocationCenter
            conflicts={activeConflicts}
            allocations={allocations}
            rooms={rooms}
            facultyList={facultyList}
            onApplyAlternative={handleApplyAlternative}
            onAutoResolveAll={handleAutoResolveAll}
            onOpenNewAllocation={() => {
              setAllocationToEdit(null);
              setInitialSlotForNew(null);
              setIsAllocationModalOpen(true);
            }}
          />
        )}

        {/* Tab 4: Resource Directory */}
        {activeTab === 'resources' && (
          <ResourceDirectory
            rooms={rooms}
            facultyList={facultyList}
            equipmentList={equipmentList}
            onUpdateRoomStatus={handleUpdateRoomStatus}
            onUpdateFacultyStatus={handleUpdateFacultyStatus}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-4 text-xs text-slate-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>
            Smart Campus Resource Management Assistant • Designed for Higher Education Institutions
          </p>
          <div className="flex items-center gap-3 text-slate-500 font-medium">
            <span>Capacity Constraint Solver</span>
            <span aria-hidden="true">•</span>
            <span>Real-time Anti-Clash Verification</span>
            <span aria-hidden="true">•</span>
            <span>WCAG 2.1 AA Accessible</span>
          </div>
        </div>
      </footer>

      {/* Modals & Drawers */}
      <AllocationModal
        isOpen={isAllocationModalOpen}
        onClose={() => {
          setIsAllocationModalOpen(false);
          setAllocationToEdit(null);
          setInitialSlotForNew(null);
        }}
        allocationToEdit={allocationToEdit}
        initialDay={initialSlotForNew?.day}
        initialTimeSlot={initialSlotForNew?.slot}
        allAllocations={allocations}
        rooms={rooms}
        facultyList={facultyList}
        onSave={handleSaveAllocation}
        onDelete={handleDeleteAllocation}
      />

      <EmergencySimulatorModal
        isOpen={isEmergencyModalOpen}
        onClose={() => setIsEmergencyModalOpen(false)}
        onTriggerPromptSampleScenario={handleTriggerPromptSampleScenario}
        onTriggerRoomMaintenance={handleTriggerRoomMaintenance}
        onTriggerFacultyAbsence={handleTriggerFacultyAbsence}
        onTriggerStudentSurge={handleTriggerStudentSurge}
        onResetToCleanState={handleResetToCleanState}
      />

      <ReallocationHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        logs={reallocationLogs}
        onClearLogs={() => {
          setReallocationLogs([]);
          showToast('Audit trail history cleared.', 'info');
        }}
      />

      <AIAssistantDrawer
        isOpen={isAIDrawerOpen}
        onClose={() => setIsAIDrawerOpen(false)}
        allocations={allocations}
        rooms={rooms}
        facultyList={facultyList}
        conflicts={activeConflicts}
      />
    </div>
  );
}
