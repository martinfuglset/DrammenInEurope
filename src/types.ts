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

/** Admin note (freeform text, supports Markdown). */
export interface AdminNote {
  id: string;
  title: string;
  content: string;
  sortOrder?: number;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  createdByName?: string;
}

/** Admin list item (checklist). */
export interface AdminListItem {
  id: string;
  text: string;
  done: boolean;
}

/** Admin list (checklist with items). */
export interface AdminList {
  id: string;
  title: string;
  items: AdminListItem[];
  sortOrder?: number;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  createdByName?: string;
}

/** Editable place for the trip map (admin-managed). */
export interface TripPlace {
  id: string;
  name: string;
  /** Country or region for better geocoding (e.g. "Norge", "Frankrike") */
  country?: string;
  lat?: number;
  lon?: number;
  isAirport?: boolean;
  notes?: string;
  sortOrder?: number;
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
  /** True if month was satisfied by dugnad (work party) instead of Vipps. */
  dugnad?: boolean;
}

/** Hoodie size options for merch registration. */
export type HoodieSize = 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL';

/** One hoodie registration per participant; pay via Vipps 550383. */
export interface HoodieRegistration {
  id: string;
  userId: string;
  size: HoodieSize;
  createdAt: string;
  updatedAt?: string;
}

export type BudgetCategory =
  | 'meals'
  | 'activities'
  | 'transportation'
  | 'staying_places'
  | 'equipment'
  | 'administration'
  | 'buffer'
  | 'other';

export interface BudgetAttachment {
  name: string;
  url: string;
  uploadedAt?: string;
}

/** Section IDs for participant view visibility (admin can hide/show). */
export const PARTICIPANT_VIEW_SECTION_IDS = [
  'countdown',
  'nav_noticeboard',
  'nav_groups',
  'nav_todays_plans',
  'nav_packing_list',
  'nav_rules',
  'nav_feedback',
  'nav_photodrop',
  'nav_team_competition',
  'payment_overview',
  'hoodie',
  'day_cards',
] as const;

export type ParticipantViewSectionId = (typeof PARTICIPANT_VIEW_SECTION_IDS)[number];

export const PARTICIPANT_VIEW_SECTION_LABELS: Record<ParticipantViewSectionId, string> = {
  countdown: 'Nedtelling til avreise',
  nav_noticeboard: 'Oppslagstavle',
  nav_groups: 'Grupper',
  nav_todays_plans: 'Dagens Planer',
  nav_packing_list: 'Pakkeliste',
  nav_rules: 'Regler',
  nav_feedback: 'Feedback',
  nav_photodrop: 'Photodrop',
  nav_team_competition: 'Star Clash (lagkonkurranse)',
  payment_overview: 'Betalingsplan',
  hoodie: 'Hoodie (merch)',
  day_cards: 'Dag for dag (programkort)',
};

export interface BudgetItem {
  id: string;
  category: BudgetCategory;
  name: string;
  budgeted: number;
  actual: number | null;
  notes?: string;
  sortOrder?: number;
  /** Forfallsdato – når må noe betales (ISO date) */
  dueDate?: string;
  /** Depositum (kr) */
  deposit?: number;
  /** Varsel X dager før forfallsdato */
  alertDaysBefore?: number;
  /** Vedlegg (avtaler, kvitteringer osv.) */
  attachments?: BudgetAttachment[];
}

/** Todo item for a minor event (e.g. feast with youth). */
export interface MinorEventTodo {
  id: string;
  text: string;
  done: boolean;
}

/** Program slot: time, activity name, responsible person (tagged participant or free text). */
export interface MinorEventProgramSlot {
  id: string;
  time: string;
  activity: string;
  /** Display name (used when no userId, or as fallback). */
  responsible: string;
  /** When set, responsible is a tagged participant (user id). */
  responsibleUserId?: string;
}

/** Status of a minor event. */
export type MinorEventStatus = 'draft' | 'confirmed' | 'done';
export type MinorEventRecurrencePattern = 'daily' | 'weekly' | 'monthly';

/** Single reminder with optional date (ISO date) for when to be reminded. */
export interface MinorEventReminder {
  id: string;
  text: string;
  /** Date to be reminded (ISO date string). */
  reminderDate?: string;
}

/** Minor event within the trip: feast, gathering, etc. */
export interface MinorEvent {
  id: string;
  title: string;
  eventDate?: string;
  location?: string;
  /** Goal/purpose of the event. */
  goal?: string;
  /** Expected number of attendees. */
  expectedAttendees?: number;
  /** Duration e.g. "2 timer", "ettermiddag". */
  duration?: string;
  /** Event status. */
  status?: MinorEventStatus;
  /** Type e.g. "Fest", "Møte", "Aktivitet". */
  eventType?: string;
  /** True when this event repeats on a schedule. */
  isRecurring?: boolean;
  /** Repetition pattern when recurring is enabled. */
  recurrencePattern?: MinorEventRecurrencePattern;
  /** Repeat every N units (e.g. every 2 weeks). */
  recurrenceInterval?: number;
  /** Optional end date for recurrence generation (ISO date). */
  recurrenceUntil?: string;
  /** Deadline for preparations (ISO date). */
  preparationDeadline?: string;
  /** List of equipment/materials needed. */
  equipmentList: string[];
  /** Plan B / alternative if weather or other cancels. */
  rainPlan?: string;
  /** Reminders with optional date for when to be reminded. */
  reminders: MinorEventReminder[];
  notes?: string;
  todos: MinorEventTodo[];
  program: MinorEventProgramSlot[];
  sortOrder?: number;
  createdAt?: string;
  updatedAt?: string;
}

/** Pre-trip planning event (separate from minor events during trip). */
export interface PreTripEvent {
  id: string;
  title: string;
  eventDate?: string;
  eventType?: string;
  location?: string;
  notes?: string;
  isRecurring?: boolean;
  recurrencePattern?: MinorEventRecurrencePattern;
  recurrenceInterval?: number;
  recurrenceUntil?: string;
  sortOrder?: number;
  createdAt?: string;
  updatedAt?: string;
}
