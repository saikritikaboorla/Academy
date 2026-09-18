import React, { useState } from 'react';
import {
  Building2,
  Users,
  Cpu,
  Search,
  CheckCircle2,
  AlertTriangle,
  Wrench,
  Sparkles,
  MapPin,
  Mail,
  BookOpen,
} from 'lucide-react';
import { Room, Faculty, EquipmentItem, RoomStatus, FacultyStatus } from '../types';

interface ResourceDirectoryProps {
  rooms: Room[];
  facultyList: Faculty[];
  equipmentList: EquipmentItem[];
  onUpdateRoomStatus: (roomId: string, newStatus: RoomStatus, reason?: string) => void;
  onUpdateFacultyStatus: (facultyId: string, newStatus: FacultyStatus, reason?: string) => void;
}

export const ResourceDirectory: React.FC<ResourceDirectoryProps> = ({
  rooms,
  facultyList,
  equipmentList,
  onUpdateRoomStatus,
  onUpdateFacultyStatus,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'rooms' | 'faculty' | 'equipment'>('rooms');
  const [searchTerm, setSearchTerm] = useState('');
  const [buildingFilter, setBuildingFilter] = useState('all');

  const buildings = Array.from(new Set(rooms.map((r) => r.building)));

  // Filter rooms
  const filteredRooms = rooms.filter((r) => {
    const matchesSearch =
      r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBuilding = buildingFilter === 'all' || r.building === buildingFilter;
    return matchesSearch && matchesBuilding;
  });

  // Filter faculty
  const filteredFaculty = facultyList.filter((f) => {
    return (
      f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.specialties.some((s) => s.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  // Filter equipment
  const filteredEquipment = equipmentList.filter((eq) => {
    return (
      eq.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      eq.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      eq.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
      {/* Top Header & Sub-Tabs */}
      <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {/* Sub-tabs buttons */}
          <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 text-xs shadow-xs">
            <button
              onClick={() => setActiveSubTab('rooms')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                activeSubTab === 'rooms'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Rooms & Labs ({rooms.length})</span>
            </button>

            <button
              onClick={() => setActiveSubTab('faculty')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                activeSubTab === 'faculty'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Faculty Directory ({facultyList.length})</span>
            </button>

            <button
              onClick={() => setActiveSubTab('equipment')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                activeSubTab === 'equipment'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Specialized Equipment ({equipmentList.length})</span>
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={`Search ${activeSubTab}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="text-xs pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg bg-white text-slate-700 w-44 sm:w-56 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {activeSubTab === 'rooms' && (
            <select
              value={buildingFilter}
              onChange={(e) => setBuildingFilter(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Buildings</option>
              {buildings.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="p-4">
        {/* ROOMS & LABS TAB */}
        {activeSubTab === 'rooms' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRooms.map((room) => {
              const isMaintenance = room.status === 'maintenance';
              const pcCount = room.fixedEquipment.find((e) => e.name.toLowerCase().includes('pc'))?.count || 0;

              return (
                <div
                  key={room.id}
                  className={`p-4 rounded-xl border transition-all ${
                    isMaintenance
                      ? 'bg-rose-50/70 border-rose-300 shadow-xs'
                      : 'bg-white border-slate-200/90 hover:border-slate-300 shadow-xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">
                          {room.code}
                        </span>
                        <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                          {room.type.replace('_', ' ')}
                        </span>
                      </div>
                      <h4 className="text-xs font-semibold text-slate-700 mt-0.5">
                        {room.name}
                      </h4>
                    </div>

                    {/* Status Pill */}
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        room.status === 'available'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {room.status}
                    </span>
                  </div>

                  <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Seating Capacity:</span>
                      <span className="font-bold text-slate-900">{room.capacity} seats</span>
                    </div>

                    {pcCount > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Installed Workstations:</span>
                        <span className="font-bold text-blue-700">{pcCount} PCs</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Location:</span>
                      <span className="text-slate-700 truncate max-w-[170px]">
                        {room.building}, Floor {room.floor}
                      </span>
                    </div>
                  </div>

                  {/* Installed Equipment Tags */}
                  <div className="mt-3 pt-2 border-t border-slate-100">
                    <span className="text-[10px] font-semibold text-slate-400 block mb-1">
                      Installed Hardware:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {room.fixedEquipment.map((eq) => (
                        <span
                          key={eq.id}
                          className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-medium"
                        >
                          {eq.count}x {eq.name}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Interactive Status Control (Simulate maintenance) */}
                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-slate-400">Emergency Test:</span>
                    {room.status === 'available' ? (
                      <button
                        onClick={() =>
                          onUpdateRoomStatus(
                            room.id,
                            'maintenance',
                            'Simulated emergency: Power & HVAC maintenance breakdown'
                          )
                        }
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 px-2 py-1 rounded transition-colors cursor-pointer"
                      >
                        <Wrench className="w-3 h-3" />
                        <span>Trigger Maintenance</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => onUpdateRoomStatus(room.id, 'available')}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded transition-colors cursor-pointer"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Restore Online</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* FACULTY DIRECTORY TAB */}
        {activeSubTab === 'faculty' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredFaculty.map((fac) => {
              const isAbsent = fac.status !== 'active';

              return (
                <div
                  key={fac.id}
                  className={`p-4 rounded-xl border transition-all ${
                    isAbsent
                      ? 'bg-amber-50/70 border-amber-300 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">
                        {fac.name}
                      </h4>
                      <p className="text-xs text-indigo-600 font-medium">
                        {fac.designation}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {fac.department}
                      </p>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        fac.status === 'active'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {fac.status.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Workload Progress */}
                  <div className="mt-3 text-xs space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-500">
                      <span>Weekly Teaching Load:</span>
                      <span className="font-semibold text-slate-800">
                        {fac.currentAssignedHours} / {fac.weeklyMaxHours} hrs
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-indigo-600 h-1.5 rounded-full"
                        style={{
                          width: `${Math.min(100, (fac.currentAssignedHours / fac.weeklyMaxHours) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Specialties */}
                  <div className="mt-3 pt-2 border-t border-slate-100">
                    <span className="text-[10px] font-semibold text-slate-400 block mb-1">
                      Subject Specialties:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {fac.specialties.map((s, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-medium"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Toggle Absence Simulation */}
                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-slate-400">Emergency Test:</span>
                    {fac.status === 'active' ? (
                      <button
                        onClick={() =>
                          onUpdateFacultyStatus(
                            fac.id,
                            'emergency_absent',
                            'Sudden medical emergency absence'
                          )
                        }
                        className="text-[11px] font-semibold text-amber-700 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 px-2 py-1 rounded transition-colors cursor-pointer"
                      >
                        Simulate Absence
                      </button>
                    ) : (
                      <button
                        onClick={() => onUpdateFacultyStatus(fac.id, 'active')}
                        className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded transition-colors cursor-pointer"
                      >
                        Mark Active
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* SPECIALIZED EQUIPMENT TAB */}
        {activeSubTab === 'equipment' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEquipment.map((eq) => (
              <div
                key={eq.id}
                className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      {eq.name}
                    </h4>
                    <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 inline-block mt-0.5">
                      {eq.category.replace('_', ' ')}
                    </span>
                  </div>

                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-emerald-100 text-emerald-800">
                    {eq.condition}
                  </span>
                </div>

                <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Available Units:</span>
                    <span className="font-bold text-slate-900">
                      {eq.availableUnits} of {eq.totalUnits} Units
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Portability:</span>
                    <span className="font-medium text-slate-700">
                      {eq.isPortable ? 'Portable / Moveable' : 'Fixed Station Installation'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Primary Depot:</span>
                    <span className="text-slate-700 truncate max-w-[170px]">
                      {eq.location}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
