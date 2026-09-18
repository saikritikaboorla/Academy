import {
  Allocation,
  Room,
  Faculty,
  Conflict,
  AllocationAlternative,
  ReallocationLog,
  EquipmentItem,
} from '../types';

/**
 * Validates a single allocation against the campus state
 */
export function validateAllocation(
  allocation: Allocation,
  allAllocations: Allocation[],
  rooms: Room[],
  facultyList: Faculty[],
  equipmentList?: EquipmentItem[]
): Conflict[] {
  const conflicts: Conflict[] = [];
  const room = rooms.find((r) => r.id === allocation.assignedRoomId);
  const faculty = facultyList.find((f) => f.id === allocation.assignedFacultyId);

  // 1. Room Availability / Maintenance Check
  if (room && room.status !== 'available') {
    const reason = room.statusReason || (room.status === 'maintenance' ? 'Facility under emergency maintenance' : 'Room is currently offline');
    conflicts.push({
      id: `conf-room-status-${allocation.id}`,
      allocationId: allocation.id,
      type: 'room_unavailable',
      severity: 'critical',
      title: `Facility Unavailable: ${room.name}`,
      description: `${room.name} cannot be occupied because its status is set to "${room.status}". Reason: ${reason}.`,
      affectedResourceName: room.name,
      suggestedAction: 'Reallocate this session to an available equivalent facility.',
      alternatives: findAlternativesForAllocation(allocation, allAllocations, rooms),
    });
  }

  // 2. Double Booking Check (Room overlapping)
  const roomOverlap = allAllocations.find(
    (a) =>
      a.id !== allocation.id &&
      a.assignedRoomId === allocation.assignedRoomId &&
      a.day === allocation.day &&
      a.timeSlot === allocation.timeSlot
  );

  if (roomOverlap && room) {
    conflicts.push({
      id: `conf-double-booking-${allocation.id}-${roomOverlap.id}`,
      allocationId: allocation.id,
      type: 'double_booking',
      severity: 'critical',
      title: `Double Booking Detected in ${room.name}`,
      description: `Conflict with "${roomOverlap.courseTitle}" (${roomOverlap.courseCode}) already booked in ${room.name} on ${allocation.day} at ${allocation.timeSlot}.`,
      affectedResourceName: room.name,
      suggestedAction: 'Switch one of the conflicting sessions to another vacant room or reschedule to a free timeslot.',
      alternatives: findAlternativesForAllocation(allocation, allAllocations, rooms),
    });
  }

  // 3. Faculty Double Booking Check
  const facultyOverlap = allAllocations.find(
    (a) =>
      a.id !== allocation.id &&
      a.assignedFacultyId === allocation.assignedFacultyId &&
      a.day === allocation.day &&
      a.timeSlot === allocation.timeSlot
  );

  if (facultyOverlap && faculty) {
    conflicts.push({
      id: `conf-faculty-overlap-${allocation.id}-${facultyOverlap.id}`,
      allocationId: allocation.id,
      type: 'faculty_conflict',
      severity: 'critical',
      title: `Faculty Schedule Clash: ${faculty.name}`,
      description: `${faculty.name} is simultaneously scheduled to teach "${facultyOverlap.courseTitle}" in another venue at ${allocation.timeSlot} on ${allocation.day}.`,
      affectedResourceName: faculty.name,
      suggestedAction: 'Assign a qualified substitute instructor or adjust session timing.',
      alternatives: findAlternativesForAllocation(allocation, allAllocations, rooms),
    });
  }

  // 4. Faculty Absence Check
  if (faculty && faculty.status !== 'active') {
    const reason = faculty.statusReason || (faculty.status === 'emergency_absent' ? 'Emergency medical absence' : 'Scheduled academic leave');
    conflicts.push({
      id: `conf-faculty-absent-${allocation.id}`,
      allocationId: allocation.id,
      type: 'faculty_absent',
      severity: 'critical',
      title: `Assigned Instructor Unavailable: ${faculty.name}`,
      description: `${faculty.name} is currently marked as "${faculty.status.replace('_', ' ')}". Reason: ${reason}.`,
      affectedResourceName: faculty.name,
      suggestedAction: 'Assign an available department colleague with overlapping subject specialty.',
      alternatives: findAlternativesForAllocation(allocation, allAllocations, rooms),
    });
  }

  // 5. Capacity Mismatch Check
  if (room && allocation.studentStrength > room.capacity) {
    const deficit = allocation.studentStrength - room.capacity;
    conflicts.push({
      id: `conf-capacity-${allocation.id}`,
      allocationId: allocation.id,
      type: 'capacity_mismatch',
      severity: 'critical',
      title: `Capacity Shortfall in ${room.name}`,
      description: `Class enrollment is ${allocation.studentStrength} students, but ${room.name} has a maximum seating capacity of ${room.capacity}. Deficit of ${deficit} seats.`,
      affectedResourceName: `${room.name} (Cap: ${room.capacity})`,
      suggestedAction: `Reallocate to a room with capacity ≥ ${allocation.studentStrength} students.`,
      alternatives: findAlternativesForAllocation(allocation, allAllocations, rooms),
    });
  }

  // 6. Equipment Shortage Check (e.g. 65 computers requested vs available)
  if (room && allocation.requiredEquipment && allocation.requiredEquipment.length > 0) {
    for (const req of allocation.requiredEquipment) {
      if (req.name.toLowerCase().includes('computer') || req.name.toLowerCase().includes('pc')) {
        // Find computer equipment in room
        const pcEq = room.fixedEquipment.find(
          (eq) => eq.name.toLowerCase().includes('pc') || eq.name.toLowerCase().includes('desktop') || eq.name.toLowerCase().includes('terminal')
        );
        const availablePCs = pcEq && pcEq.condition !== 'maintenance' ? pcEq.count : 0;
        
        if (availablePCs < req.minQuantity) {
          const pcDeficit = req.minQuantity - availablePCs;
          conflicts.push({
            id: `conf-equip-${allocation.id}`,
            allocationId: allocation.id,
            type: 'equipment_shortage',
            severity: 'critical',
            title: `Equipment Deficit: ${req.minQuantity} Workstations Required`,
            description: `Session mandates ${req.minQuantity} individual computers, but ${room.name} only provides ${availablePCs} functional units (shortfall of ${pcDeficit} PCs).`,
            affectedResourceName: `${req.minQuantity}x ${req.name}`,
            suggestedAction: `Switch to a computer laboratory with at least ${req.minQuantity} installed terminals.`,
            alternatives: findAlternativesForAllocation(allocation, allAllocations, rooms),
          });
        }
      }
    }
  }

  // 7. Activity Type Compatibility Check
  if (room) {
    if (allocation.activityType === 'lab_practical') {
      const isLab = room.type.includes('lab');
      if (!isLab) {
        conflicts.push({
          id: `conf-activity-mismatch-${allocation.id}`,
          allocationId: allocation.id,
          type: 'activity_mismatch',
          severity: 'warning',
          title: `Activity Facility Mismatch`,
          description: `Practical lab session "${allocation.courseTitle}" is assigned to standard lecture room ${room.name} without hands-on lab benches.`,
          affectedResourceName: room.name,
          suggestedAction: 'Relocate to an equipped specialized laboratory.',
          alternatives: findAlternativesForAllocation(allocation, allAllocations, rooms),
        });
      }
    }
  }

  // 8. Capacity Wastage Check (Warning)
  if (room && room.capacity > 3 * allocation.studentStrength && room.capacity >= 80) {
    conflicts.push({
      id: `conf-waste-${allocation.id}`,
      allocationId: allocation.id,
      type: 'capacity_wastage',
      severity: 'warning',
      title: `Excessive Space Wastage Detected`,
      description: `Small group of ${allocation.studentStrength} students booked in ${room.name} (Capacity: ${room.capacity}). Space utilization is only ${Math.round((allocation.studentStrength / room.capacity) * 100)}%.`,
      affectedResourceName: room.name,
      suggestedAction: 'Consider shifting to a smaller seminar room or classroom to free up this high-capacity hall.',
      alternatives: findAlternativesForAllocation(allocation, allAllocations, rooms),
    });
  }

  return conflicts;
}

/**
 * Validates all allocations in the campus
 */
export function validateAllAllocations(
  allocations: Allocation[],
  rooms: Room[],
  facultyList: Faculty[],
  equipmentList?: EquipmentItem[]
): Conflict[] {
  const allConflicts: Conflict[] = [];
  for (const alloc of allocations) {
    const itemConflicts = validateAllocation(alloc, allocations, rooms, facultyList, equipmentList);
    allConflicts.push(...itemConflicts);
  }
  return allConflicts;
}

/**
 * Identifies and ranks alternative room candidates for a given allocation
 */
export function findAlternativesForAllocation(
  allocation: Allocation,
  allAllocations: Allocation[],
  rooms: Room[]
): AllocationAlternative[] {
  const requiredPCs = allocation.requiredEquipment.find(
    (e) => e.name.toLowerCase().includes('computer') || e.name.toLowerCase().includes('pc')
  )?.minQuantity || (allocation.activityType === 'lab_practical' && allocation.courseTitle.toLowerCase().includes('data structure') ? allocation.studentStrength : 0);

  const candidates: AllocationAlternative[] = [];

  for (const room of rooms) {
    // Cannot pick the current room if it has a problem
    if (room.id === allocation.assignedRoomId) {
      continue;
    }

    // Room must be currently operational
    if (room.status !== 'available') {
      continue;
    }

    // Check if room is already booked at that exact day and timeslot
    const isOccupied = allAllocations.some(
      (a) =>
        a.id !== allocation.id &&
        a.assignedRoomId === room.id &&
        a.day === allocation.day &&
        a.timeSlot === allocation.timeSlot
    );

    if (isOccupied) {
      continue;
    }

    // Extract PC count
    const pcEq = room.fixedEquipment.find(
      (eq) => eq.name.toLowerCase().includes('pc') || eq.name.toLowerCase().includes('desktop') || eq.name.toLowerCase().includes('terminal')
    );
    const availablePCs = pcEq && pcEq.condition !== 'maintenance' ? pcEq.count : 0;

    // Type compatibility
    let isTypeCompatible = true;
    if (allocation.activityType === 'lab_practical') {
      // Must be lab
      if (!room.type.includes('lab')) {
        isTypeCompatible = false;
      }
    }

    // Compute suitability score (0 - 100)
    let score = 50;
    const pros: string[] = [];
    const cons: string[] = [];

    // Capacity assessment
    const capacityHeadroom = room.capacity - allocation.studentStrength;
    if (capacityHeadroom >= 0) {
      score += 25;
      pros.push(`Sufficient capacity: Accommodates ${allocation.studentStrength} students (+${capacityHeadroom} buffer seats)`);
      if (capacityHeadroom <= 20) {
        score += 10;
        pros.push('Optimal fit: Low HVAC & space wastage');
      } else if (capacityHeadroom > 50) {
        score -= 10;
        cons.push(`Slightly oversized (${room.capacity} seats for ${allocation.studentStrength} students)`);
      }
    } else {
      score -= 40;
      cons.push(`Under-capacity by ${Math.abs(capacityHeadroom)} seats`);
    }

    // Equipment assessment
    if (requiredPCs > 0) {
      if (availablePCs >= requiredPCs) {
        score += 25;
        pros.push(`Equipment verified: ${availablePCs} functional PCs available (meets required ${requiredPCs})`);
      } else {
        score -= 50;
        cons.push(`Insufficient PCs: Only ${availablePCs} available (needs ${requiredPCs})`);
      }
    } else {
      score += 15;
    }

    // Lab type compatibility
    if (allocation.activityType === 'lab_practical') {
      if (room.type === 'computer_lab') {
        score += 10;
        pros.push('Equipped computing laboratory environment');
      } else if (room.type === 'science_lab' && allocation.department.toLowerCase().includes('chem')) {
        score += 15;
        pros.push('Chemical fume hoods and safety stations present');
      } else if (!isTypeCompatible) {
        score -= 30;
        cons.push('Room lacks specialized lab installations');
      }
    }

    // Building affinity
    if (room.building.includes('Science') || room.building.includes('Engineering')) {
      score += 5;
    }

    // Cap score 0 to 99
    score = Math.max(10, Math.min(99, score));

    // Only include candidates that can realistically seat the students or provide equipment
    if (room.capacity >= allocation.studentStrength && (!requiredPCs || availablePCs >= requiredPCs)) {
      candidates.push({
        roomId: room.id,
        roomName: room.name,
        roomCode: room.code,
        type: room.type,
        building: room.building,
        capacity: room.capacity,
        availableComputers: availablePCs,
        matchScore: score,
        pros,
        cons,
        isRecommended: false,
        capacityHeadroom,
      });
    }
  }

  // Sort candidates by matchScore descending
  candidates.sort((a, b) => b.matchScore - a.matchScore);

  // Mark the top candidate as recommended
  if (candidates.length > 0) {
    candidates[0].isRecommended = true;
    candidates[0].matchScore = Math.max(95, candidates[0].matchScore);
  }

  return candidates;
}

/**
 * Finds substitute faculty members for a given allocation
 */
export function findSubstituteFaculty(
  allocation: Allocation,
  allAllocations: Allocation[],
  facultyList: Faculty[]
): Array<{ faculty: Faculty; matchScore: number; reason: string }> {
  const currentFaculty = facultyList.find((f) => f.id === allocation.assignedFacultyId);
  const candidates: Array<{ faculty: Faculty; matchScore: number; reason: string }> = [];

  for (const fac of facultyList) {
    if (fac.id === allocation.assignedFacultyId) continue;
    if (fac.status !== 'active') continue;

    // Check if faculty has a clash in that slot
    const hasClash = allAllocations.some(
      (a) =>
        a.id !== allocation.id &&
        a.assignedFacultyId === fac.id &&
        a.day === allocation.day &&
        a.timeSlot === allocation.timeSlot
    );
    if (hasClash) continue;

    let score = 50;
    const reasons: string[] = [];

    // Department match
    if (currentFaculty && fac.department === currentFaculty.department) {
      score += 25;
      reasons.push(`Same department: ${fac.department}`);
    }

    // Specialty match
    const matchesSpecialty = fac.specialties.some(
      (s) =>
        allocation.courseTitle.toLowerCase().includes(s.toLowerCase()) ||
        (currentFaculty && currentFaculty.specialties.some((cs) => cs.toLowerCase() === s.toLowerCase()))
    );

    if (matchesSpecialty) {
      score += 20;
      reasons.push('Direct domain specialty match');
    }

    // Workload check
    if (fac.currentAssignedHours < fac.weeklyMaxHours) {
      score += 10;
      reasons.push(`Available teaching load (${fac.currentAssignedHours}/${fac.weeklyMaxHours} hrs)`);
    }

    candidates.push({
      faculty: fac,
      matchScore: Math.min(98, score),
      reason: reasons.join(' • '),
    });
  }

  return candidates.sort((a, b) => b.matchScore - a.matchScore);
}

/**
 * Calculates overall campus resource utilization metrics
 */
export function calculateCampusMetrics(
  allocations: Allocation[],
  rooms: Room[],
  facultyList: Faculty[],
  conflicts: Conflict[]
) {
  const totalSlotsPerRoom = 5 * 4; // 5 days * 4 slots = 20 slot capacity per room
  const totalPossibleRoomHours = rooms.length * totalSlotsPerRoom;
  const bookedRoomHours = allocations.length;

  const roomUtilizationPct = totalPossibleRoomHours > 0
    ? Math.round((bookedRoomHours / totalPossibleRoomHours) * 100)
    : 0;

  // Seat capacity utilization (students enrolled vs available capacity in booked rooms)
  let totalBookedCapacity = 0;
  let totalBookedStudents = 0;
  let totalWastedSeats = 0;

  allocations.forEach((alloc) => {
    const room = rooms.find((r) => r.id === alloc.assignedRoomId);
    if (room) {
      totalBookedCapacity += room.capacity;
      totalBookedStudents += alloc.studentStrength;
      if (room.capacity > alloc.studentStrength) {
        totalWastedSeats += (room.capacity - alloc.studentStrength);
      }
    }
  });

  const seatOccupancyPct = totalBookedCapacity > 0
    ? Math.round((totalBookedStudents / totalBookedCapacity) * 100)
    : 0;

  const capacityWastePct = totalBookedCapacity > 0
    ? Math.round((totalWastedSeats / totalBookedCapacity) * 100)
    : 0;

  const criticalConflictsCount = conflicts.filter((c) => c.severity === 'critical').length;
  const warningsCount = conflicts.filter((c) => c.severity === 'warning').length;

  const activeFacultyCount = facultyList.filter((f) => f.status === 'active').length;
  const availableRoomsCount = rooms.filter((r) => r.status === 'available').length;

  return {
    roomUtilizationPct,
    seatOccupancyPct,
    capacityWastePct,
    criticalConflictsCount,
    warningsCount,
    totalAllocations: allocations.length,
    activeFacultyCount,
    totalFacultyCount: facultyList.length,
    availableRoomsCount,
    totalRoomsCount: rooms.length,
  };
}
