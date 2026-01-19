import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// -----------------------------------------------------------------------------
// TYPES
// -----------------------------------------------------------------------------

export type Role = 'participant' | 'admin';

export interface User {
  id: string;
  fullName: string;
  displayName: string; // "Elena S."
  role: Role;
}

export interface ActivityOption {
  id: string;
  title: string;
  timeStart: string;
  timeEnd: string;
  location: string;
  meetingPoint: string;
  transport: string;
  description: string;
  tags: string[];
  capacityMax: number;
}

export interface TripDay {
  id: string;
  date: string; // "YYYY-MM-DD"
  title: string;
  description: string;
  isChoiceDay: boolean; // If true, show activities
  isLocked?: boolean; // If true, signups are disabled
  scheduleItems: {
    time: string;
    activity: string;
    location?: string;
  }[]; // For regular timeline
  choiceBlockId?: string; // Grouping ID for mutually exclusive choices
}

export interface Signup {
  activityId: string;
  userId: string;
  timestamp: number;
  status: 'confirmed' | 'waitlist' | 'cancelled';
}

interface AppState {
  currentUser: User | null;
  isAdmin: boolean;
  users: User[];
  days: TripDay[];
  activities: ActivityOption[];
  signups: Signup[];
  
  // Actions
  loginAsUser: (userId: string) => void;
  loginAdmin: (password: string) => boolean;
  toggleActivitySignup: (activityId: string, choiceBlockId?: string) => void;
  adminMoveUser: (userId: string, fromActivityId: string, toActivityId: string) => void;
  adminRemoveUser: (userId: string, activityId: string) => void;
  adminToggleDayLock: (dayId: string) => void;
  
  // Edit Content Actions
  updateDay: (dayId: string, data: Partial<TripDay>) => void;
  updateScheduleItem: (dayId: string, itemIdx: number, data: Partial<TripDay['scheduleItems'][0]>) => void;
  addScheduleItem: (dayId: string) => void;
  removeScheduleItem: (dayId: string, itemIdx: number) => void;
  
  updateActivity: (activityId: string, data: Partial<ActivityOption>) => void;
  addActivity: () => void;
  removeActivity: (activityId: string) => void;

  addDay: () => void;
  removeDay: (dayId: string) => void;
  updateSignupStatus: (activityId: string, userId: string, status: Signup['status']) => void;

  // Reorder Actions
  reorderDays: (fromIndex: number, toIndex: number) => void;
  reorderActivities: (fromIndex: number, toIndex: number) => void;
  reorderScheduleItems: (dayId: string, fromIndex: number, toIndex: number) => void;
}

// -----------------------------------------------------------------------------
// MOCK DATA
// -----------------------------------------------------------------------------

const MOCK_USERS: User[] = [
  { id: 'u1', fullName: 'Elena Svendsen', displayName: 'Elena S.', role: 'participant' },
  { id: 'u2', fullName: 'Jonas Berg', displayName: 'Jonas B.', role: 'participant' },
  { id: 'u3', fullName: 'Isak Håland', displayName: 'Isak H.', role: 'participant' },
  { id: 'u4', fullName: 'Maria Nilsen', displayName: 'Maria N.', role: 'participant' },
  // ... simulated crowd
  ...Array.from({ length: 15 }).map((_, i) => ({
    id: `mock${i}`,
    fullName: `Deltaker ${i + 1}`,
    displayName: `Deltaker ${i + 1}`,
    role: 'participant' as Role
  }))
];

const MOCK_DAYS: TripDay[] = [
  {
    id: 'd1',
    date: '2026-06-20',
    title: 'Dag 1: Ankomst & Velkomst',
    description: 'Vi lander i paradiset. Innsjekk og felles middag.',
    isChoiceDay: false,
    scheduleItems: [
      { time: '14:00', activity: 'Ankomst Gardermoen', location: 'Oppmøte ved tog' },
      { time: '18:00', activity: 'Landing i Nice', location: 'Terminal 1' },
      { time: '20:30', activity: 'Velkomstmiddag', location: 'Hotel Plaza' },
    ]
  },
  {
    id: 'd2',
    date: '2026-06-21',
    title: 'Dag 2: Utforsk Drammen (i Europa)',
    description: 'Valgfri aktivitetsdag! Velg hva du vil gjøre på formiddagen.',
    isChoiceDay: true,
    isLocked: false,
    choiceBlockId: 'block_am',
    scheduleItems: [
      { time: '09:00', activity: 'Frokost', location: 'Hotellet' },
      { time: '10:00', activity: 'VALGFRI AKTIVITET (Se under)', location: 'Ulike steder' },
      { time: '19:00', activity: 'Felles Pizza', location: 'Piazza del Popolo' },
    ]
  },
  {
    id: 'd3',
    date: '2026-06-22',
    title: 'Dag 3: Hjemreise',
    description: 'Takk for turen!',
    isChoiceDay: false,
    scheduleItems: [
      { time: '10:00', activity: 'Utsjekk' },
      { time: '12:00', activity: 'Buss til flyplassen' },
    ]
  }
];

const MOCK_ACTIVITIES: ActivityOption[] = [
  {
    id: 'act1',
    title: 'Via Ferrata Klatring',
    timeStart: '10:00',
    timeEnd: '14:00',
    location: 'Fjellveggen Øst',
    meetingPoint: 'Lobbyen',
    transport: 'Minibuss (20 min)',
    description: 'For de som liker høyder og adrenalin. Vi klatrer den berømte løypen med guide.',
    tags: ['Adrenalin', 'Fysisk', 'Utsikt'],
    capacityMax: 8
  },
  {
    id: 'act2',
    title: 'Byvandring & Gelato',
    timeStart: '11:00',
    timeEnd: '13:00',
    location: 'Gamlebyen',
    meetingPoint: 'Fontenen',
    transport: 'Gange',
    description: 'En rolig tur gjennom historiske gater med stopp for byens beste is.',
    tags: ['Rolig', 'Kultur', 'Mat'],
    capacityMax: 20
  },
  {
    id: 'act3',
    title: 'Strand & Volleyball',
    timeStart: '10:30',
    timeEnd: '15:00',
    location: 'Blue Beach',
    meetingPoint: 'Lobbyen',
    transport: 'Trikk (10 min)',
    description: 'Vi reserverer en del av stranden. Ta med solkrem og badetøy!',
    tags: ['Sosialt', 'Badetøy', 'Sport'],
    capacityMax: 15
  }
];

// Pre-fill some signups to make it look alive
const MOCK_SIGNUPS: Signup[] = [
  { activityId: 'act1', userId: 'u2', timestamp: Date.now(), status: 'confirmed' },
  { activityId: 'act1', userId: 'u3', timestamp: Date.now(), status: 'confirmed' },
  { activityId: 'act2', userId: 'mock1', timestamp: Date.now(), status: 'confirmed' },
  { activityId: 'act2', userId: 'mock2', timestamp: Date.now(), status: 'confirmed' },
];

// -----------------------------------------------------------------------------
// STORE IMPLEMENTATION
// -----------------------------------------------------------------------------

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial Data
      currentUser: MOCK_USERS[0], // Default logged in as Elena
      isAdmin: false,
      users: MOCK_USERS,
      days: MOCK_DAYS,
      activities: MOCK_ACTIVITIES,
      signups: MOCK_SIGNUPS,

      // Actions
      loginAsUser: (userId) => {
        const user = get().users.find(u => u.id === userId);
        if (user) set({ currentUser: user });
      },

      loginAdmin: (password) => {
        if (password === 'admin123') {
          set({ isAdmin: true });
          return true;
        }
        return false;
      },

      toggleActivitySignup: (activityId, _choiceBlockId) => {
        const { currentUser, signups, activities, days } = get();
        if (!currentUser) return;

        // Check lock state
        // For this mock, we assume activity belongs to Day 2 (d2) which is the choice day.
        // In production, we'd look up the day properly.
        const choiceDay = days.find(d => d.isChoiceDay);
        if (choiceDay?.isLocked && !get().isAdmin) {
             alert("Påmeldingen er stengt!");
             return;
        }

        const existingSignup = signups.find(s => s.userId === currentUser.id && s.activityId === activityId);

        // CASE 1: Already signed up -> Cancel
        if (existingSignup) {
          set({
            signups: signups.filter(s => s.userId !== currentUser.id || s.activityId !== activityId)
          });
          return;
        }

        // CASE 2: New Signup
        // 1. Check Capacity
        const activity = activities.find(a => a.id === activityId);
        if (!activity) return;
        
        const currentCount = signups.filter(s => s.activityId === activityId).length;
        if (currentCount >= activity.capacityMax) {
          alert("Beklager, denne aktiviteten er full!");
          return;
        }

        // 2. Remove conflicting signups (switch activity)
        const otherActivityIds = activities.map(a => a.id);
        
        const newSignups = signups.filter(s => 
          !(s.userId === currentUser.id && otherActivityIds.includes(s.activityId))
        );

        // 3. Add new signup
        newSignups.push({
          activityId,
          userId: currentUser.id,
          timestamp: Date.now(),
          status: 'confirmed'
        });

        set({ signups: newSignups });
      },

      adminMoveUser: (_userId, _fromId, _toId) => {
        console.log("Admin moving user");
      },

      adminRemoveUser: (userId, activityId) => {
         set(state => ({
           signups: state.signups.filter(s => !(s.userId === userId && s.activityId === activityId))
         }));
      },

      adminToggleDayLock: (dayId) => {
        set(state => ({
          days: state.days.map(d => 
            d.id === dayId ? { ...d, isLocked: !d.isLocked } : d
          )
        }));
      },

      updateDay: (dayId, data) => {
        set(state => ({
          days: state.days.map(d => d.id === dayId ? { ...d, ...data } : d)
        }));
      },

      updateScheduleItem: (dayId, itemIdx, data) => {
        set(state => ({
          days: state.days.map(d => {
            if (d.id !== dayId) return d;
            const newItems = [...d.scheduleItems];
            newItems[itemIdx] = { ...newItems[itemIdx], ...data };
            return { ...d, scheduleItems: newItems };
          })
        }));
      },

      addScheduleItem: (dayId) => {
        set(state => ({
          days: state.days.map(d => {
            if (d.id !== dayId) return d;
            return {
              ...d,
              scheduleItems: [...d.scheduleItems, { time: '12:00', activity: 'Ny aktivitet', location: '' }]
            };
          })
        }));
      },

      removeScheduleItem: (dayId, itemIdx) => {
        set(state => ({
          days: state.days.map(d => {
            if (d.id !== dayId) return d;
            return {
              ...d,
              scheduleItems: d.scheduleItems.filter((_, i) => i !== itemIdx)
            };
          })
        }));
      },

      updateActivity: (activityId, data) => {
        set(state => ({
          activities: state.activities.map(a => a.id === activityId ? { ...a, ...data } : a)
        }));
      },

      addActivity: () => {
        set(state => ({
          activities: [...state.activities, {
            id: crypto.randomUUID(),
            title: 'Ny Aktivitet',
            timeStart: '10:00',
            timeEnd: '12:00',
            location: 'Sted',
            meetingPoint: 'Møtested',
            transport: 'Transport',
            description: 'Beskrivelse',
            tags: [],
            capacityMax: 10
          }]
        }));
      },

      removeActivity: (activityId) => {
        set(state => ({
          activities: state.activities.filter(a => a.id !== activityId),
          // Also remove signups for this activity?
          signups: state.signups.filter(s => s.activityId !== activityId)
        }));
      },

      addDay: () => {
        set(state => ({
          days: [...state.days, {
            id: crypto.randomUUID(),
            date: new Date().toISOString().split('T')[0],
            title: 'Ny Dag',
            description: 'Beskrivelse av dagen',
            isChoiceDay: false,
            scheduleItems: []
          }]
        }));
      },

      removeDay: (dayId) => {
        set(state => ({
          days: state.days.filter(d => d.id !== dayId)
        }));
      },

      updateSignupStatus: (activityId, userId, status) => {
        set(state => ({
          signups: state.signups.map(s => 
            (s.activityId === activityId && s.userId === userId) ? { ...s, status } : s
          )
        }));
      },

      reorderDays: (fromIndex, toIndex) => {
        set(state => {
          const newDays = [...state.days];
          const [moved] = newDays.splice(fromIndex, 1);
          newDays.splice(toIndex, 0, moved);
          return { days: newDays };
        });
      },

      reorderActivities: (fromIndex, toIndex) => {
        set(state => {
          const newActivities = [...state.activities];
          const [moved] = newActivities.splice(fromIndex, 1);
          newActivities.splice(toIndex, 0, moved);
          return { activities: newActivities };
        });
      },

      reorderScheduleItems: (dayId, fromIndex, toIndex) => {
        set(state => {
          const days = state.days.map(d => {
            if (d.id !== dayId) return d;
            const newItems = [...d.scheduleItems];
            const [moved] = newItems.splice(fromIndex, 1);
            newItems.splice(toIndex, 0, moved);
            return { ...d, scheduleItems: newItems };
          });
          return { days };
        });
      }
    }),
    {
      name: 'travel-app-storage',
      partialize: (state) => ({ 
        // Persist crucial data
        signups: state.signups,
        currentUser: state.currentUser,
        isAdmin: state.isAdmin,
        days: state.days
      }), 
    }
  )
);
