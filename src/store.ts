import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from './lib/supabaseClient';

// -----------------------------------------------------------------------------
// TYPES
// -----------------------------------------------------------------------------

export type Role = 'participant' | 'admin';

export interface User {
  id: string;
  fullName: string;
  displayName: string;
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
  sortOrder?: number;
}

export interface TripDay {
  id: string;
  date: string;
  title: string;
  description: string;
  isChoiceDay: boolean;
  isLocked?: boolean;
  scheduleItems: {
    time: string;
    activity: string;
    location?: string;
  }[];
  choiceBlockId?: string;
  sortOrder?: number;
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
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchData: () => Promise<void>;
  loginAsUser: (userId: string) => void;
  loginAdmin: (password: string) => boolean;
  
  // Data Modifications
  toggleActivitySignup: (activityId: string, choiceBlockId?: string) => Promise<void>;
  updateSignupStatus: (activityId: string, userId: string, status: Signup['status']) => Promise<void>;
  adminRemoveUser: (userId: string, activityId: string) => Promise<void>;
  
  adminToggleDayLock: (dayId: string) => Promise<void>;
  
  updateDay: (dayId: string, data: Partial<TripDay>) => Promise<void>;
  updateScheduleItem: (dayId: string, itemIdx: number, data: Partial<TripDay['scheduleItems'][0]>) => Promise<void>;
  addScheduleItem: (dayId: string) => Promise<void>;
  removeScheduleItem: (dayId: string, itemIdx: number) => Promise<void>;
  
  addDay: () => Promise<void>;
  removeDay: (dayId: string) => Promise<void>;
  reorderDays: (fromIndex: number, toIndex: number) => Promise<void>;

  updateActivity: (activityId: string, data: Partial<ActivityOption>) => Promise<void>;
  addActivity: () => Promise<void>;
  removeActivity: (activityId: string) => Promise<void>;
  reorderActivities: (fromIndex: number, toIndex: number) => Promise<void>;

  // Placeholder
  adminMoveUser: (userId: string, fromActivityId: string, toActivityId: string) => void;
  reorderScheduleItems: (dayId: string, fromIndex: number, toIndex: number) => void;
  addUser: (name: string) => Promise<void>;
  removeUser: (userId: string) => Promise<void>;
  updateUser: (userId: string, data: Partial<User>) => Promise<void>;
}

// -----------------------------------------------------------------------------
// STORE IMPLEMENTATION
// -----------------------------------------------------------------------------

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial Data
      currentUser: null,
      isAdmin: false,
      users: [],
      days: [],
      activities: [],
      signups: [],
      isLoading: false,
      error: null,

      addUser: async (name: string) => {
          const { data, error } = await supabase.from('profiles').insert({
              full_name: name,
              display_name: name,
              role: 'participant'
          }).select().single();
          
          if (data && !error) {
              const newUser: User = {
                  id: data.id,
                  fullName: data.full_name,
                  displayName: data.display_name,
                  role: data.role as Role
              };
              set(state => ({ users: [...state.users, newUser] }));
          }
      },

      removeUser: async (userId) => {
        set(state => ({ users: state.users.filter(u => u.id !== userId) }));
        await supabase.from('profiles').delete().eq('id', userId);
      },

      updateUser: async (userId, data) => {
          set(state => ({
              users: state.users.map(u => u.id === userId ? { ...u, ...data } : u)
          }));
          const dbData: any = {};
          if (data.fullName) dbData.full_name = data.fullName;
          if (data.displayName) dbData.display_name = data.displayName;
          if (data.role) dbData.role = data.role;
          
          if (Object.keys(dbData).length > 0) {
              await supabase.from('profiles').update(dbData).eq('id', userId);
          }
      },

      // -----------------------------------------------------------------------
      // DATA FETCHING
      // -----------------------------------------------------------------------
      fetchData: async () => {
        set({ isLoading: true, error: null });
        try {
          // Fetch Profiles
          const { data: profiles, error: usersError } = await supabase
            .from('profiles')
            .select('*');
          if (usersError) throw usersError;

          // Fetch Days
          const { data: daysData, error: daysError } = await supabase
            .from('trip_days')
            .select('*')
            .order('sort_order', { ascending: true });
          if (daysError) throw daysError;

          // Fetch Activities
          const { data: actsData, error: actsError } = await supabase
            .from('activities')
            .select('*')
            .order('sort_order', { ascending: true });
          if (actsError) throw actsError;

          // Fetch Signups
          const { data: signupsData, error: signupsError } = await supabase
            .from('signups')
            .select('*');
          if (signupsError) throw signupsError;

          // Map Data to Store Format
          const users: User[] = (profiles || []).map((p: any) => ({
            id: p.id,
            fullName: p.full_name,
            displayName: p.display_name,
            role: p.role as Role
          }));

          const days: TripDay[] = (daysData || []).map((d: any) => ({
            id: d.id,
            date: d.date,
            title: d.title,
            description: d.description || '',
            isChoiceDay: d.is_choice_day,
            isLocked: d.is_locked,
            choiceBlockId: d.choice_block_id,
            scheduleItems: d.schedule_items || [],
            sortOrder: d.sort_order
          }));

          const activities: ActivityOption[] = (actsData || []).map((a: any) => ({
            id: a.id,
            title: a.title,
            timeStart: a.time_start || '',
            timeEnd: a.time_end || '',
            location: a.location || '',
            meetingPoint: a.meeting_point || '',
            transport: a.transport || '',
            description: a.description || '',
            tags: a.tags || [],
            capacityMax: a.capacity_max || 20,
            sortOrder: a.sort_order
          }));

          const signups: Signup[] = (signupsData || []).map((s: any) => ({
            activityId: s.activity_id,
            userId: s.user_id,
            status: s.status,
            timestamp: new Date(s.created_at).getTime()
          }));

          set({ users, days, activities, signups, isLoading: false });

          // Auto-login first user if none selected (dev convenience)
          if (!get().currentUser && users.length > 0) {
            set({ currentUser: users[0] });
          }

        } catch (err: any) {
          console.error('Fetch error:', err);
          set({ error: err.message, isLoading: false });
        }
      },

      // -----------------------------------------------------------------------
      // AUTH ACTIONS
      // -----------------------------------------------------------------------
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

      // -----------------------------------------------------------------------
      // SIGNUP ACTIONS
      // -----------------------------------------------------------------------
      toggleActivitySignup: async (activityId, _choiceBlockId) => {
        const { currentUser, signups, activities, days } = get();
        if (!currentUser) return;

        // Optimistic check
        const activity = activities.find(a => a.id === activityId);
        if (!activity) return;

        // Check locks (simplified logic)
        const choiceDay = days.find(d => d.isChoiceDay); // In real app, find day by activity relation
        if (choiceDay?.isLocked && !get().isAdmin) {
             alert("Påmeldingen er stengt!");
             return;
        }

        const existingSignup = signups.find(s => s.userId === currentUser.id && s.activityId === activityId);

        if (existingSignup) {
          // DELETE
          // Optimistic Update
          set({ signups: signups.filter(s => s.userId !== currentUser.id || s.activityId !== activityId) });
          
          const { error } = await supabase
            .from('signups')
            .delete()
            .match({ user_id: currentUser.id, activity_id: activityId });
            
          if (error) {
             console.error(error);
             // Revert logic here if needed, or just re-fetch
             get().fetchData();
          }
        } else {
          // INSERT
          // Check capacity locally first
          const currentCount = signups.filter(s => s.activityId === activityId).length;
          if (currentCount >= activity.capacityMax) {
             alert("Fullt!");
             return;
          }

          // Conflicting signups? Ideally should be handled by DB constraints or explicit logic
          // For now, let's just insert. If we want to enforce single choice, we should delete others first.
          
          // Optimistic Update
          const newSignup: Signup = {
             activityId, 
             userId: currentUser.id, 
             status: 'confirmed', 
             timestamp: Date.now() 
          };
          set({ signups: [...signups, newSignup] });

          const { error } = await supabase
            .from('signups')
            .insert({ user_id: currentUser.id, activity_id: activityId, status: 'confirmed' });

          if (error) {
             console.error(error);
             get().fetchData(); // Revert
          }
        }
      },

      updateSignupStatus: async (activityId, userId, status) => {
         set(state => ({
          signups: state.signups.map(s => 
            (s.activityId === activityId && s.userId === userId) ? { ...s, status } : s
          )
        }));

        await supabase
          .from('signups')
          .update({ status })
          .match({ user_id: userId, activity_id: activityId });
      },

      adminRemoveUser: async (userId, activityId) => {
         set(state => ({
           signups: state.signups.filter(s => !(s.userId === userId && s.activityId === activityId))
         }));

         await supabase
            .from('signups')
            .delete()
            .match({ user_id: userId, activity_id: activityId });
      },

      adminMoveUser: (_userId, _fromId, _toId) => { console.log("Not impl"); },

      // -----------------------------------------------------------------------
      // CONTENT ACTIONS
      // -----------------------------------------------------------------------
      
      adminToggleDayLock: async (dayId) => {
        const day = get().days.find(d => d.id === dayId);
        if (!day) return;
        
        const newVal = !day.isLocked;
        
        set(state => ({
          days: state.days.map(d => d.id === dayId ? { ...d, isLocked: newVal } : d)
        }));

        await supabase
          .from('trip_days')
          .update({ is_locked: newVal })
          .eq('id', dayId);
      },

      updateDay: async (dayId, data) => {
        // Optimistic
        set(state => ({
          days: state.days.map(d => d.id === dayId ? { ...d, ...data } : d)
        }));

        // Map camel to snake for DB
        const dbData: any = {};
        if (data.title !== undefined) dbData.title = data.title;
        if (data.date !== undefined) dbData.date = data.date;
        if (data.description !== undefined) dbData.description = data.description;
        if (data.isChoiceDay !== undefined) dbData.is_choice_day = data.isChoiceDay;

        if (Object.keys(dbData).length > 0) {
           await supabase.from('trip_days').update(dbData).eq('id', dayId);
        }
      },

      updateScheduleItem: async (dayId, itemIdx, data) => {
        const day = get().days.find(d => d.id === dayId);
        if (!day) return;

        const newItems = [...day.scheduleItems];
        newItems[itemIdx] = { ...newItems[itemIdx], ...data };

        set(state => ({
          days: state.days.map(d => d.id === dayId ? { ...d, scheduleItems: newItems } : d)
        }));

        await supabase
          .from('trip_days')
          .update({ schedule_items: newItems })
          .eq('id', dayId);
      },

      addScheduleItem: async (dayId) => {
        const day = get().days.find(d => d.id === dayId);
        if (!day) return;

        const newItem = { time: '12:00', activity: 'Ny aktivitet', location: '' };
        const newItems = [...day.scheduleItems, newItem];

        set(state => ({
          days: state.days.map(d => d.id === dayId ? { ...d, scheduleItems: newItems } : d)
        }));

        await supabase
          .from('trip_days')
          .update({ schedule_items: newItems })
          .eq('id', dayId);
      },

      removeScheduleItem: async (dayId, itemIdx) => {
        const day = get().days.find(d => d.id === dayId);
        if (!day) return;

        const newItems = day.scheduleItems.filter((_, i) => i !== itemIdx);

        set(state => ({
          days: state.days.map(d => d.id === dayId ? { ...d, scheduleItems: newItems } : d)
        }));

        await supabase
          .from('trip_days')
          .update({ schedule_items: newItems })
          .eq('id', dayId);
      },
      
      reorderScheduleItems: (dayId, fromIndex, toIndex) => {
         // Optimistic only for now, saving handled by calls to updateScheduleItem conceptually
         // But actually we need to save the whole list order
         const day = get().days.find(d => d.id === dayId);
         if (!day) return;
         
         const newItems = [...day.scheduleItems];
         const [moved] = newItems.splice(fromIndex, 1);
         newItems.splice(toIndex, 0, moved);

         set(state => ({
            days: state.days.map(d => d.id === dayId ? { ...d, scheduleItems: newItems } : d)
         }));
         
         // Debounce or just fire?
         supabase
          .from('trip_days')
          .update({ schedule_items: newItems })
          .eq('id', dayId);
      },

      addDay: async () => {
         const newDay = {
            date: new Date().toISOString().split('T')[0],
            title: 'Ny Dag',
            description: 'Beskrivelse',
            is_choice_day: false,
            schedule_items: []
         };

         const { data, error } = await supabase.from('trip_days').insert(newDay).select().single();
         if (data && !error) {
            const mappedDay: TripDay = {
                id: data.id,
                date: data.date,
                title: data.title,
                description: data.description,
                isChoiceDay: data.is_choice_day,
                isLocked: data.is_locked,
                scheduleItems: data.schedule_items || []
            };
            set(state => ({ days: [...state.days, mappedDay] }));
         }
      },

      removeDay: async (dayId) => {
        set(state => ({ days: state.days.filter(d => d.id !== dayId) }));
        await supabase.from('trip_days').delete().eq('id', dayId);
      },

      reorderDays: async (fromIndex, toIndex) => {
          const { days } = get();
          const newDays = [...days];
          const [moved] = newDays.splice(fromIndex, 1);
          newDays.splice(toIndex, 0, moved);

          set({ days: newDays });

          // Persist order
          const updates = newDays.map((d, index) => 
              supabase.from('trip_days').update({ sort_order: index }).eq('id', d.id)
          );
          await Promise.all(updates);
      },

      // -----------------------------------------------------------------------
      // ACTIVITY ACTIONS
      // -----------------------------------------------------------------------

      updateActivity: async (activityId, data) => {
        set(state => ({
          activities: state.activities.map(a => a.id === activityId ? { ...a, ...data } : a)
        }));

        const dbData: any = {};
        if (data.title) dbData.title = data.title;
        if (data.timeStart) dbData.time_start = data.timeStart;
        if (data.timeEnd) dbData.time_end = data.timeEnd;
        if (data.location) dbData.location = data.location;
        if (data.capacityMax) dbData.capacity_max = data.capacityMax;
        if (data.description) dbData.description = data.description;
        if (data.transport) dbData.transport = data.transport;
        
        if (Object.keys(dbData).length > 0) {
            await supabase.from('activities').update(dbData).eq('id', activityId);
        }
      },

      addActivity: async () => {
         const newAct = {
            title: 'Ny Aktivitet',
            time_start: '10:00',
            time_end: '12:00',
            capacity_max: 10
         };
         
         const { data, error } = await supabase.from('activities').insert(newAct).select().single();
         if (data && !error) {
             const mapped: ActivityOption = {
                 id: data.id,
                 title: data.title,
                 timeStart: data.time_start,
                 timeEnd: data.time_end,
                 location: data.location || '',
                 meetingPoint: data.meeting_point || '',
                 transport: data.transport || '',
                 description: data.description || '',
                 tags: data.tags || [],
                 capacityMax: data.capacity_max
             };
             set(state => ({ activities: [...state.activities, mapped] }));
         }
      },

      removeActivity: async (activityId) => {
        set(state => ({
          activities: state.activities.filter(a => a.id !== activityId),
          signups: state.signups.filter(s => s.activityId !== activityId)
        }));
        await supabase.from('activities').delete().eq('id', activityId);
      },

      reorderActivities: async (fromIndex, toIndex) => {
        const { activities } = get();
        const newActivities = [...activities];
        const [moved] = newActivities.splice(fromIndex, 1);
        newActivities.splice(toIndex, 0, moved);
        
        set({ activities: newActivities });

        const updates = newActivities.map((a, index) => 
            supabase.from('activities').update({ sort_order: index }).eq('id', a.id)
        );
        await Promise.all(updates);
      }
    }),
    {
      name: 'travel-app-storage',
      partialize: (state) => ({ 
        currentUser: state.currentUser,
        isAdmin: state.isAdmin,
        // Don't persist data to allow DB to be source of truth
      }), 
    }
  )
);
