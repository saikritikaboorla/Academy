import React from 'react';
import { X, History, ArrowRight } from 'lucide-react';
import { ReallocationLog } from '../types';
import { useA11yModal } from '../utils/useA11yModal';

interface ReallocationHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  logs: ReallocationLog[];
  onRevertLog?: (log: ReallocationLog) => void;
  onClearLogs?: () => void;
}

export const ReallocationHistoryModal: React.FC<ReallocationHistoryModalProps> = ({
  isOpen,
  onClose,
  logs,
  onClearLogs,
}) => {
  const modalRef = useA11yModal(isOpen, onClose);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="history-modal-title"
      ref={modalRef}
    >
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-2xl w-full max-h-[85vh] flex flex-col text-slate-900 relative">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h3 id="history-modal-title" className="text-base font-bold text-slate-900">
                Reallocation Audit Trail & History
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Structured log of facility shifts, conflict resolutions, and emergency replacements
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close audit log modal"
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer focus:ring-2 focus:ring-indigo-600 focus:outline-hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Log List */}
        <div className="p-5 space-y-3 overflow-y-auto flex-1" tabIndex={0} aria-label="Audit log entries">
          {logs.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              <History className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <p className="font-medium text-slate-600">No reallocations logged yet in this session.</p>
              <p className="text-slate-500 mt-0.5">
                When you apply smart recommendations to solve conflicts, they will appear here.
              </p>
            </div>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 text-xs space-y-2 shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">
                      {log.courseTitle} ({log.courseCode})
                    </span>
                    <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
                      Applied
                    </span>
                  </div>
                  <span className="text-xs text-slate-600">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>

                {/* Previous vs New Room */}
                <div className="flex items-center gap-2 text-slate-800 bg-white p-2.5 rounded-lg border border-slate-200">
                  <span className="line-through text-slate-500 font-medium">
                    {log.previousRoomName}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span className="font-bold text-emerald-700">
                    {log.newRoomName}
                  </span>
                </div>

                <div className="text-xs text-slate-600 italic">
                  Reason: {log.reason}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 flex items-center justify-between">
          {logs.length > 0 && onClearLogs ? (
            <button
              onClick={onClearLogs}
              className="text-xs text-rose-600 hover:text-rose-800 font-medium cursor-pointer focus:ring-2 focus:ring-rose-600 focus:outline-hidden px-2 py-1 rounded"
            >
              Clear Log History
            </button>
          ) : (
            <div />
          )}

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 cursor-pointer focus:ring-2 focus:ring-slate-400 focus:outline-hidden"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
