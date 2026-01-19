import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from './lib/supabaseClient';
import type { User, TripDay, ActivityOption, Signup, Role, InfoPage, Feedback } from './types';

// -----------------------------------------------------------------------------
// TYPES
// -----------------------------------------------------------------------------

interface AppState {
  currentUser: User | null;
  isAdmin: boolean;
  users: User[];
  days: TripDay[];
  activities: ActivityOption[];
  signups: Signup[];
  infoPages: InfoPage[];
  feedbacks: Feedback[];
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

  // Info Pages
  updateInfoPage: (slug: string, content: string) => Promise<void>;
  
  // Feedback
  submitFeedback: (message: string, ratings?: Feedback['ratings'], highlights?: string, improvements?: string) => Promise<void>;

  // User Management
  addUser: (name: string) => Promise<void>;
  removeUser: (userId: string) => Promise<void>;
  updateUser: (userId: string, data: Partial<User>) => Promise<void>;
  
  // Placeholder
  adminMoveUser: (userId: string, fromActivityId: string, toActivityId: string) => void;
  reorderScheduleItems: (dayId: string, fromIndex: number, toIndex: number) => void;
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
      infoPages: [],
      feedbacks: [],
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
          // Parallel Fetch
          const [
            { data: profiles, error: usersError },
            { data: daysData, error: daysError },
            { data: actsData, error: actsError },
            { data: signupsData, error: signupsError },
            { data: infoData, error: infoError },
            { data: feedbackData, error: feedbackError }
          ] = await Promise.all([
            supabase.from('profiles').select('*'),
            supabase.from('trip_days').select('*').order('sort_order', { ascending: true }),
            supabase.from('activities').select('*').order('sort_order', { ascending: true }),
            supabase.from('signups').select('*'),
            supabase.from('info_pages').select('*'),
            supabase.from('feedback').select('*').order('created_at', { ascending: false })
          ]);

          if (usersError) throw usersError;
          if (daysError) throw daysError;
          if (actsError) throw actsError;
          if (signupsError) throw signupsError;
          if (infoError) console.error("Info pages fetch error:", infoError);
          if (feedbackError) console.error("Feedback fetch error:", feedbackError);

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

          const infoPages: InfoPage[] = (infoData || []).map((i: any) => ({
              slug: i.slug,
              title: i.title,
              content: i.content,
              updatedAt: i.updated_at
          }));

          const feedbacks: Feedback[] = (feedbackData || []).map((f: any) => ({
              id: f.id,
              userId: f.user_id,
              message: f.message,
              ratings: f.ratings,
              highlights: f.highlights,
              improvements: f.improvements,
              createdAt: f.created_at
          }));

          set({ users, days, activities, signups, infoPages, feedbacks, isLoading: false });

          // Auto-login first user if none selected (dev convenience)
          if (!get().currentUser && users.length > 0) {
            set({ currentUser: users[0] });
          }

        } catch (err: any) {
          console.error('Fetch error:', err);
          // Don't set error state aggressively to avoid UI blocking if one table is missing
          // set({ error: err.message, isLoading: false });
          set({ isLoading: false });
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
        
        if (!currentUser) {
            alert("Du er ikke logget inn. En administrator må opprette deltakere.");
            return;
        }

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
          // DELETE (Meld av)
          // Optimistic Update
          set({ signups: signups.filter(s => s.userId !== currentUser.id || s.activityId !== activityId) });
          
          const { error } = await supabase
            .from('signups')
            .delete()
            .match({ user_id: currentUser.id, activity_id: activityId });
            
          if (error) {
             console.error("Signup delete error:", error);
             alert("Feil ved avmelding: " + error.message);
             get().fetchData(); // Revert
          }
        } else {
          // INSERT (Meld på)
          // Check capacity locally first
          const currentCount = signups.filter(s => s.activityId === activityId).length;
          if (currentCount >= activity.capacityMax) {
             alert("Beklager, denne aktiviteten er full!");
             return;
          }

          // Handle Switching: Remove other signups for any activity in the list
          // (Assuming all activities are mutually exclusive choices for the same time slot)
          const allActivityIds = activities.map(a => a.id);
          const idsToRemove = signups
            .filter(s => s.userId === currentUser.id && allActivityIds.includes(s.activityId))
            .map(s => s.activityId);

          // Optimistic Update
          const newSignup: Signup = {
             activityId, 
             userId: currentUser.id, 
             status: 'confirmed', 
             timestamp: Date.now() 
          };
          
          set({ 
              signups: [
                  ...signups.filter(s => !(s.userId === currentUser.id && allActivityIds.includes(s.activityId))),
                  newSignup
              ] 
          });

          // DB Operations
          // 1. Delete conflicting signups
          if (idsToRemove.length > 0) {
              await supabase
                .from('signups')
                .delete()
                .eq('user_id', currentUser.id)
                .in('activity_id', idsToRemove);
          }

          // 2. Insert new signup
          const { error } = await supabase
            .from('signups')
            .insert({ user_id: currentUser.id, activity_id: activityId, status: 'confirmed' });

          if (error) {
             console.error("Signup insert error:", error);
             alert("Feil ved påmelding: " + error.message);
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

        const newItem = { id: crypto.randomUUID(), time: '12:00', activity: 'Ny aktivitet', location: '' };
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
      },

      // -----------------------------------------------------------------------
      // INFO PAGE ACTIONS
      // -----------------------------------------------------------------------

      updateInfoPage: async (slug, content) => {
          const { infoPages } = get();
          const existing = infoPages.find(p => p.slug === slug);
          
          if (existing) {
              set({
                  infoPages: infoPages.map(p => p.slug === slug ? { ...p, content, updatedAt: new Date().toISOString() } : p)
              });
          } else {
              set({
                  infoPages: [...infoPages, { slug, content, title: slug, updatedAt: new Date().toISOString() }]
              });
          }

          // DB Upsert
          const { error } = await supabase.from('info_pages').upsert({
              slug,
              content,
              title: slug
          });
          
          if (error) console.error("Error updating page:", error);
      },

      // -----------------------------------------------------------------------
      // FEEDBACK ACTIONS
      // -----------------------------------------------------------------------
      
      submitFeedback: async (message, ratings, highlights, improvements) => {
          const { currentUser } = get();
          
          // Allow submitting without being logged in (anonymous feedback for testing/admins)
          // Ideally we would want a user, but for now we relax this constraint
          const userId = currentUser ? currentUser.id : null;

          const { data, error } = await supabase.from('feedback').insert({
              user_id: userId,
              message,
              ratings,
              highlights,
              improvements
          }).select().single();

          if (data && !error) {
              const newFeedback: Feedback = {
                  id: data.id,
                  userId: data.user_id || 'anonymous',
                  message: data.message,
                  ratings: data.ratings,
                  highlights: data.highlights,
                  improvements: data.improvements,
                  createdAt: data.created_at
              };
              set(state => ({ feedbacks: [newFeedback, ...state.feedbacks] }));
          } else {
              console.error("Feedback submission error:", error);
              if (error) alert("Kunne ikke sende feedback: " + error.message);
          }
      }
    }),
    {
      name: 'travel-app-storage',
      partialize: (state) => ({ 
        currentUser: state.currentUser,
        // Don't persist isAdmin to prevent accidental access
        // isAdmin: state.isAdmin,
      }), 
    }
  )
);
