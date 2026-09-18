export type ActivityType = 'lecture' | 'lab_practical' | 'seminar' | 'workshop' | 'exam';

export type RoomType = 'classroom' | 'computer_lab' | 'science_lab' | 'engineering_lab' | 'seminar_hall';

export type RoomStatus = 'available' | 'maintenance' | 'offline' | 'restricted';

export type FacultyStatus = 'active' | 'on_leave' | 'emergency_absent';

export type EquipmentCondition = 'operational' | 'degraded' | 'faulty';

export type EquipmentCategory = 'computing' | 'projection' | 'specialized_hardware' | 'audio_visual' | 'lab_apparatus';

export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';

export interface RoomEquipment {
  id: string;
  name: string;
  count: number;
  condition: 'functional' | 'degraded' | 'maintenance';
}

export interface Room {
  id: string;
  name: string;
  code: string;
  type: RoomType;
  building: string;
  floor: number;
  capacity: number;
  fixedEquipment: RoomEquipment[];
  status: RoomStatus;
  statusReason?: string;
  notes?: string;
}

export interface Faculty {
  id: string;
  name: string;
  email: string;
  department: string;
  designation: string;
  status: FacultyStatus;
  statusReason?: string;
  specialties: string[];
  weeklyMaxHours: number;
  currentAssignedHours: number;
}

export interface EquipmentItem {
  id: string;
  name: string;
  category: EquipmentCategory;
  totalUnits: number;
  availableUnits: number;
  condition: EquipmentCondition;
  isPortable: boolean;
  location: string;
}

export interface RequiredEquipment {
  name: string;
  minQuantity: number;
}

export interface Allocation {
  id: string;
  courseCode: string;
  courseTitle: string;
  activityType: ActivityType;
  studentStrength: number;
  department: string;
  day: DayOfWeek;
  timeSlot: string; // e.g. "09:00 - 10:30", "10:45 - 12:15", "13:30 - 15:00", "15:15 - 16:45"
  assignedRoomId: string;
  assignedFacultyId: string;
  requiredEquipment: RequiredEquipment[];
  status: 'confirmed' | 'conflict_flagged' | 'reallocated';
  notes?: string;
}

export interface AllocationAlternative {
  roomId: string;
  roomName: string;
  roomCode: string;
  type: RoomType;
  building: string;
  capacity: number;
  availableComputers: number;
  matchScore: number; // 0 to 100
  pros: string[];
  cons?: string[];
  isRecommended: boolean;
  capacityHeadroom: number;
}

export interface Conflict {
  id: string;
  allocationId: string;
  type: 
    | 'capacity_mismatch'
    | 'double_booking'
    | 'faculty_conflict'
    | 'faculty_absent'
    | 'equipment_shortage'
    | 'room_unavailable'
    | 'activity_mismatch'
    | 'capacity_wastage';
  severity: 'critical' | 'warning';
  title: string;
  description: string;
  affectedResourceName: string;
  suggestedAction: string;
  alternatives: AllocationAlternative[];
}

export interface ReallocationLog {
  id: string;
  timestamp: string;
  allocationId: string;
  courseCode: string;
  courseTitle: string;
  reason: string;
  previousRoomId: string;
  previousRoomName: string;
  newRoomId: string;
  newRoomName: string;
  previousFacultyId?: string;
  newFacultyId?: string;
}
