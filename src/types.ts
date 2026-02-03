export type Role = 'participant' | 'admin';

export interface User {
  id: string;
  fullName: string;
  displayName?: string;
  role: Role;
  email?: string;
  phone?: string;
  age?: number;
  birthDate?: string;
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
  isChoiceDay?: boolean;
  isLocked?: boolean;
  choiceBlockId?: string;
  sortOrder?: number;
}

export interface ActivityOption {
  id: string;
  title: string;
  timeStart: string; // Changed from startTime to match store
  timeEnd: string;   // Changed from endTime to match store
  location: string;
  meetingPoint: string;
  transport: string; // Changed from transportType to match store
  description: string;
  tags: string[];
  capacityMax: number; // Changed from maxCapacity to match store
  sortOrder?: number;
  /** Display price e.g. "350 kr" or "Gratis" */
  price?: string;
  /** Driving length e.g. "45 min" or "120 km" */
  drivingLength?: string;
  /** URL to more info / booking */
  link?: string;
}

export interface Signup {
  activityId: string;
  userId: string;
  timestamp: number;
  status: 'confirmed' | 'waitlist' | 'cancelled';
}

export interface InfoPage {
  slug: string;
  title: string;
  content: string;
  updatedAt?: string;
}

export interface Feedback {
  id: string;
  userId: string;
  message: string;
  createdAt: string;
  ratings?: {
    overall: number;
    hotel: number;
    activities: number;
    food: number;
  };
  highlights?: string;
  improvements?: string;
}

export interface Quote {
  id: string;
  text: string;
  author: string; // The person quoted
  submittedBy: string; // userId
  createdAt: string;
  likes: number;
}

export interface Photo {
  id: string;
  url: string;
  caption?: string;
  uploadedBy: string; // userId
  createdAt: string;
  width?: number;
  height?: number;
}

export interface PaymentPlan {
  id: string;
  userId: string;
  planType: 'monthly' | 'annual' | 'trial';
  amount: number;
  currency: string;
  status: 'active' | 'cancelled' | 'expired' | 'pending';
  startDate: string;
  endDate?: string;
  billingCycleStart?: string;
  nextBillingDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentTransaction {
  id: string;
  userId: string;
  planId?: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentMethod?: string;
  transactionId?: string;
  createdAt: string;
}

export interface PaymentMonth {
  id: string;
  userId: string;
  month: string; // YYYY-MM
  paid: boolean;
  paidAt?: string;
}
