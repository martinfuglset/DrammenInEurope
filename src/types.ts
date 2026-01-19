export type Role = 'participant' | 'admin';

export interface User {
  id: string;
  fullName: string;
  role: Role;
}

export interface ItineraryItem {
  id: string;
  time: string;
  activity: string;
  location: string;
  notes?: string;
}

export interface TripDay {
  id: string;
  date: string; // ISO date string or display string
  title: string;
  description?: string;
  scheduleItems: ItineraryItem[];
  isElectionDay?: boolean; // If true, shows activity options
}

export interface ActivityOption {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  location: string;
  meetingPoint: string;
  travelTimeMin: number;
  transportType: string;
  description: string;
  tags: string[];
  maxCapacity: number;
}

export interface Signup {
  activityId: string;
  userId: string;
  timestamp: number;
  status: 'confirmed' | 'waitlist' | 'cancelled';
}
