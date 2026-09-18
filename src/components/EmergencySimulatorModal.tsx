import React from 'react';
import {
  X,
  Zap,
  RotateCcw,
  Users,
  Wrench,
  UserX,
  ArrowRight,
} from 'lucide-react';
import { useA11yModal } from '../utils/useA11yModal';

interface EmergencySimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTriggerPromptSampleScenario: () => void;
  onTriggerRoomMaintenance: () => void;
  onTriggerFacultyAbsence: () => void;
  onTriggerStudentSurge: () => void;
  onResetToCleanState: () => void;
}

export const EmergencySimulatorModal: React.FC<EmergencySimulatorModalProps> = ({
  isOpen,
  onClose,
  onTriggerPromptSampleScenario,
  onTriggerRoomMaintenance,
  onTriggerFacultyAbsence,
  onTriggerStudentSurge,
  onResetToCleanState,
}) => {
  const modalRef = useA11yModal(isOpen, onClose);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="emergency-modal-title"
      ref={modalRef}
    >
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-xl w-full p-6 text-slate-900 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close emergency simulator"
          className="absolute right-4 top-4 p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer focus:ring-2 focus:ring-indigo-600 focus:outline-hidden"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h3 id="emergency-modal-title" className="text-base font-bold text-slate-900">
              Last-Minute Emergency & Change Simulator
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              Test automated conflict detection, capacity alerts, and smart reallocations
            </p>
          </div>
        </div>

        {/* Scenarios Grid */}
        <div className="mt-4 space-y-3">
          {/* Preset 1: The Specific User Prompt Scenario */}
          <div className="p-3.5 rounded-xl border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-50 transition-colors">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-600 text-white uppercase tracking-wider">
                    Core Scenario
                  </span>
                  <h4 className="text-xs font-bold text-indigo-950">
                    Data Structures (65 Students vs 60-Capacity Lab)
                  </h4>
                </div>
                <p className="text-xs text-indigo-950 mt-1 leading-relaxed">
                  Class: <strong>Data Structures</strong> (65 students), requires <strong>65 computers</strong>. Assigned to <strong>Lab 204 (Capacity 60)</strong>. Tests immediate capacity mismatch detection & smart recommendation of <strong>Lab 301 (Capacity 75)</strong>.
                </p>
              </div>

              <button
                onClick={() => {
                  onTriggerPromptSampleScenario();
                  onClose();
                }}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs cursor-pointer flex-shrink-0 focus:ring-2 focus:ring-indigo-600 focus:outline-hidden"
              >
                <span>Trigger</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Preset 2: Room Maintenance / Breakdown */}
          <div className="p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <Wrench className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-slate-900">
                    Classroom Unavailability / Facility Breakdown
                  </h4>
                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                    Simulates sudden HVAC failure or electrical hazard in <strong>Lab 204</strong>, shifting all scheduled sessions to emergency status.
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  onTriggerRoomMaintenance();
                  onClose();
                }}
                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors cursor-pointer flex-shrink-0 focus:ring-2 focus:ring-slate-400 focus:outline-hidden"
              >
                Trigger
              </button>
            </div>
          </div>

          {/* Preset 3: Faculty Emergency Absence */}
          <div className="p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <UserX className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-slate-900">
                    Faculty Sudden Absence / Sick Leave
                  </h4>
                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                    Marks <strong>Dr. Alan Vance</strong> as Emergency Absent. System searches department colleagues with matching domain specialties to suggest substitutes.
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  onTriggerFacultyAbsence();
                  onClose();
                }}
                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors cursor-pointer flex-shrink-0 focus:ring-2 focus:ring-slate-400 focus:outline-hidden"
              >
                Trigger
              </button>
            </div>
          </div>

          {/* Preset 4: Student Strength Surge */}
          <div className="p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <Users className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-slate-900">
                    Change in Student Strength (Enrollment Surge)
                  </h4>
                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                    Expands <strong>Machine Learning Principles</strong> from 52 students to <strong>78 students</strong>, exceeding Classroom 205 limit (capacity 65).
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  onTriggerStudentSurge();
                  onClose();
                }}
                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors cursor-pointer flex-shrink-0 focus:ring-2 focus:ring-slate-400 focus:outline-hidden"
              >
                Trigger
              </button>
            </div>
          </div>
        </div>

        {/* Footer with Reset Action */}
        <div className="mt-5 pt-4 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={() => {
              onResetToCleanState();
              onClose();
            }}
            className="inline-flex items-center gap-1.5 text-xs text-slate-700 hover:text-slate-900 font-medium cursor-pointer focus:ring-2 focus:ring-slate-400 focus:outline-hidden px-2 py-1 rounded"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Reset to Clean 0-Conflict State</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 cursor-pointer focus:ring-2 focus:ring-slate-400 focus:outline-hidden"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
