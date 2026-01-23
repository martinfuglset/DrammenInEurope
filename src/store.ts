import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from './lib/supabaseClient';
import type { User, TripDay, ActivityOption, Signup, Role, InfoPage, Feedback, Quote, Photo } from './types';

type ExportKind = 'users' | 'days' | 'activities' | 'signups' | 'infoPages' | 'feedbacks' | 'quotes' | 'photos';
type ParticipantImport = {
  fullName: string;
  displayName?: string;
  email?: string;
  phone?: string;
  birthDate?: string;
  age?: number;
  role?: Role;
};

const csvEscape = (value: unknown) => {
  if (value === null || value === undefined) return '""';
  const stringValue = String(value);
  return `"${stringValue.replace(/"/g, '""')}"`;
};

const toCsv = (headers: string[], rows: Array<Record<string, unknown>>) => {
  const headerLine = headers.map(csvEscape).join(',');
  const dataLines = rows.map((row) => headers.map((key) => csvEscape(row[key])).join(','));
  return [headerLine, ...dataLines].join('\n');
};

const downloadFile = (filename: string, content: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

const formatSurnameFirst = (fullName: string) => {
  const trimmed = fullName.trim();
  if (!trimmed || trimmed.includes(',')) return trimmed;
  const parts = trimmed.split(/\s+/);
  if (parts.length < 2) return trimmed;
  const surname = parts[parts.length - 1];
  const firstNames = parts.slice(0, -1).join(' ');
  return `${surname}, ${firstNames}`;
};

const calculateAge = (birthDate?: string) => {
  if (!birthDate) return undefined;
  const [year, month, day] = birthDate.split('-').map((part) => Number(part));
  if (!year || !month || !day) return undefined;
  const today = new Date();
  let age = today.getFullYear() - year;
  const hasHadBirthday =
    today.getMonth() + 1 > month || (today.getMonth() + 1 === month && today.getDate() >= day);
  if (!hasHadBirthday) age -= 1;
  return age;
};

const columnAvailability: Record<'birth_date' | 'age' | 'email' | 'phone', boolean | null> = {
  birth_date: null,
  age: null,
  email: null,
  phone: null
};

const canUseColumn = async (column: keyof typeof columnAvailability) => {
  if (columnAvailability[column] !== null) return columnAvailability[column] as boolean;
  const { error } = await supabase.from('profiles').select(column).limit(1);
  columnAvailability[column] = !error;
  return !error;
};

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
  quotes: Quote[];
  photos: Photo[];
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

  // Photodrop
  addQuote: (text: string, author: string) => Promise<void>;
  uploadPhoto: (file: File, caption?: string) => Promise<void>;

  // User Management
  addUser: (name: string) => Promise<void>;
  removeUser: (userId: string) => Promise<void>;
  updateUser: (userId: string, data: Partial<User>) => Promise<void>;
  importParticipants: (participants: ParticipantImport[]) => Promise<void>;
  removeAllUsers: () => Promise<void>;
  
  // Placeholder
  adminMoveUser: (userId: string, fromActivityId: string, toActivityId: string) => void;
  reorderScheduleItems: (dayId: string, fromIndex: number, toIndex: number) => void;

  // Exports (admin only)
  exportAdminData: (kind: ExportKind) => void;
  exportAllData: () => void;
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
      quotes: [],
      photos: [],
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

      removeAllUsers: async () => {
        const { error } = await supabase.from('profiles').delete().not('id', 'is', null);
        if (error) {
          console.error("Remove all users error:", error);
          alert("Kunne ikke slette alle deltakere: " + error.message);
          return;
        }
        set({ users: [] });
      },

      updateUser: async (userId, data) => {
          set(state => ({
              users: state.users.map(u => u.id === userId ? { ...u, ...data } : u)
          }));
          const dbData: any = {};
          if (data.fullName) dbData.full_name = data.fullName;
          if (data.displayName) dbData.display_name = data.displayName;
          if (data.role) dbData.role = data.role;
          if (data.email !== undefined) {
            if (await canUseColumn('email')) {
              dbData.email = data.email;
            }
          }
          if (data.phone !== undefined) {
            if (await canUseColumn('phone')) {
              dbData.phone = data.phone;
            }
          }
          if (data.age !== undefined) {
            if (await canUseColumn('age')) {
              dbData.age = data.age;
            }
          }
          if (data.birthDate !== undefined) {
            if (await canUseColumn('birth_date')) {
              dbData.birth_date = data.birthDate;
            } else if (await canUseColumn('age')) {
              const derivedAge = calculateAge(data.birthDate);
              if (derivedAge !== undefined) dbData.age = derivedAge;
            }
          }
          
          if (Object.keys(dbData).length > 0) {
              const { error } = await supabase.from('profiles').update(dbData).eq('id', userId);
              if (error) {
                  console.error("User update error:", error);
                  alert("Kunne ikke oppdatere deltaker: " + error.message);
              }
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
            { data: feedbackData, error: feedbackError },
            { data: quotesData, error: quotesError },
            { data: photosData, error: photosError }
          ] = await Promise.all([
            supabase.from('profiles').select('*'),
            supabase.from('trip_days').select('*').order('sort_order', { ascending: true }),
            supabase.from('activities').select('*').order('sort_order', { ascending: true }),
            supabase.from('signups').select('*'),
            supabase.from('info_pages').select('*'),
            supabase.from('feedback').select('*').order('created_at', { ascending: false }),
            supabase.from('quotes').select('*').order('created_at', { ascending: false }),
            supabase.from('photos').select('*').order('created_at', { ascending: false })
          ]);

          if (usersError) throw usersError;
          if (daysError) throw daysError;
          if (actsError) throw actsError;
          if (signupsError) throw signupsError;
          if (infoError) console.error("Info pages fetch error:", infoError);
          if (feedbackError) console.error("Feedback fetch error:", feedbackError);
          if (quotesError) console.error("Quotes fetch error:", quotesError);
          if (photosError) console.error("Photos fetch error:", photosError);

          // Map Data to Store Format
          const users: User[] = (profiles || []).map((p: any) => ({
            id: p.id,
            fullName: p.full_name,
            displayName: p.display_name,
            role: p.role as Role,
            email: p.email,
            phone: p.phone,
            age: p.age,
            birthDate: p.birth_date
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

          const quotes: Quote[] = (quotesData || []).map((q: any) => ({
              id: q.id,
              text: q.text,
              author: q.author,
              submittedBy: q.submitted_by,
              createdAt: q.created_at,
              likes: q.likes || 0
          }));

          const photos: Photo[] = (photosData || []).map((p: any) => ({
              id: p.id,
              url: p.url,
              caption: p.caption,
              uploadedBy: p.uploaded_by,
              createdAt: p.created_at,
              width: p.width,
              height: p.height
          }));

          set({ users, days, activities, signups, infoPages, feedbacks, quotes, photos, isLoading: false });

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
      toggleActivitySignup: async (activityId) => {
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

      adminMoveUser: () => { console.log("Not impl"); },

      importParticipants: async (participants) => {
        if (!get().isAdmin) {
          alert("Du må være admin for å importere deltakere.");
          return;
        }
        if (participants.length === 0) return;
        const allowBirthDate = await canUseColumn('birth_date');
        const allowAge = await canUseColumn('age');
        const allowEmail = await canUseColumn('email');
        const allowPhone = await canUseColumn('phone');

        const needsEmail = participants.some((participant) => Boolean(participant.email));
        const needsPhone = participants.some((participant) => Boolean(participant.phone));
        const needsBirthDate = participants.some((participant) => Boolean(participant.birthDate));
        const needsAge = participants.some((participant) => participant.age !== undefined);

        const missingColumns: string[] = [];
        if (needsEmail && !allowEmail) missingColumns.push('email');
        if (needsPhone && !allowPhone) missingColumns.push('phone');
        if (needsBirthDate && !allowBirthDate) missingColumns.push('birth_date');
        if (needsAge && !allowAge) missingColumns.push('age');

        if (missingColumns.length > 0) {
          alert(
            `Mangler kolonner i Supabase (profiles): ${missingColumns.join(', ')}. ` +
            `Oppdater databasen og prøv igjen.`
          );
          return;
        }

        const rows = participants.map((participant) => {
          const derivedAge = calculateAge(participant.birthDate);
          const finalAge = participant.age ?? derivedAge ?? null;
          return {
            full_name: participant.fullName,
            display_name: participant.displayName || participant.fullName,
            role: participant.role || 'participant',
            ...(allowEmail ? { email: participant.email || null } : {}),
            ...(allowPhone ? { phone: participant.phone || null } : {}),
            ...(allowBirthDate ? { birth_date: participant.birthDate || null } : {}),
            ...(allowAge ? { age: finalAge } : {})
          };
        });

        const { data, error } = await supabase.from('profiles').insert(rows).select();
        if (error) {
          console.error("Import participants error:", error);
          alert("Kunne ikke importere deltakere: " + error.message);
          return;
        }

        if (data && data.length > 0) {
          const newUsers: User[] = data.map((p: any) => ({
            id: p.id,
            fullName: p.full_name,
            displayName: p.display_name,
            role: p.role as Role,
            email: p.email,
            phone: p.phone,
            age: p.age,
            birthDate: p.birth_date
          }));
          set(state => ({ users: [...state.users, ...newUsers] }));
        }

      },

      exportAdminData: (kind) => {
        if (!get().isAdmin) {
          alert("Du må være admin for å eksportere data.");
          return;
        }

        const { users, days, activities, signups, infoPages, feedbacks, quotes, photos } = get();
        const dateTag = new Date().toISOString().split('T')[0];

        if (kind === 'users') {
          const rows = users.map((user) => ({
            Navn: formatSurnameFirst(user.fullName),
            Alder: calculateAge(user.birthDate) ?? user.age ?? '',
            Fødselsdato: user.birthDate || '',
            Mobiltelefon: user.phone || '',
            Epostadresse: user.email || ''
          }));
          const csv = toCsv(['Navn', 'Alder', 'Fødselsdato', 'Mobiltelefon', 'Epostadresse'], rows);
          downloadFile(`deltakere-${dateTag}.csv`, csv, 'text/csv;charset=utf-8');
          return;
        }

        if (kind === 'days') {
          const rows = days.map((day) => ({
            id: day.id,
            date: day.date,
            title: day.title,
            description: day.description,
            isChoiceDay: day.isChoiceDay,
            isLocked: day.isLocked,
            choiceBlockId: day.choiceBlockId || '',
            scheduleItems: JSON.stringify(day.scheduleItems || [])
          }));
          const csv = toCsv(
            ['id', 'date', 'title', 'description', 'isChoiceDay', 'isLocked', 'choiceBlockId', 'scheduleItems'],
            rows
          );
          downloadFile(`program-${dateTag}.csv`, csv, 'text/csv;charset=utf-8');
          return;
        }

        if (kind === 'activities') {
          const rows = activities.map((activity) => ({
            id: activity.id,
            title: activity.title,
            timeStart: activity.timeStart,
            timeEnd: activity.timeEnd,
            location: activity.location,
            meetingPoint: activity.meetingPoint,
            transport: activity.transport,
            description: activity.description,
            tags: activity.tags?.join(', ') || '',
            capacityMax: activity.capacityMax,
            sortOrder: activity.sortOrder ?? ''
          }));
          const csv = toCsv(
            [
              'id',
              'title',
              'timeStart',
              'timeEnd',
              'location',
              'meetingPoint',
              'transport',
              'description',
              'tags',
              'capacityMax',
              'sortOrder'
            ],
            rows
          );
          downloadFile(`aktiviteter-${dateTag}.csv`, csv, 'text/csv;charset=utf-8');
          return;
        }

        if (kind === 'signups') {
          const rows = signups.map((signup) => {
            const user = users.find((u) => u.id === signup.userId);
            const activity = activities.find((a) => a.id === signup.activityId);
            return {
              activityId: signup.activityId,
              activityTitle: activity?.title || '',
              userId: signup.userId,
              userFullName: user?.fullName || '',
              userDisplayName: user?.displayName || '',
              role: user?.role || '',
              status: signup.status,
              timestamp: signup.timestamp ? new Date(signup.timestamp).toISOString() : ''
            };
          });
          const csv = toCsv(
            [
              'activityId',
              'activityTitle',
              'userId',
              'userFullName',
              'userDisplayName',
              'role',
              'status',
              'timestamp'
            ],
            rows
          );
          downloadFile(`pameldinger-${dateTag}.csv`, csv, 'text/csv;charset=utf-8');
          return;
        }

        if (kind === 'infoPages') {
          const rows = infoPages.map((page) => ({
            slug: page.slug,
            title: page.title,
            content: page.content,
            updatedAt: page.updatedAt
          }));
          const csv = toCsv(['slug', 'title', 'content', 'updatedAt'], rows);
          downloadFile(`innholdssider-${dateTag}.csv`, csv, 'text/csv;charset=utf-8');
          return;
        }

        if (kind === 'feedbacks') {
          const rows = feedbacks.map((feedback) => {
            const user = users.find((u) => u.id === feedback.userId);
            return {
              id: feedback.id,
              userId: feedback.userId,
              userFullName: user?.fullName || '',
              message: feedback.message,
              highlights: feedback.highlights || '',
              improvements: feedback.improvements || '',
              ratingOverall: feedback.ratings?.overall || '',
              ratingHotel: feedback.ratings?.hotel || '',
              ratingActivities: feedback.ratings?.activities || '',
              ratingFood: feedback.ratings?.food || '',
              createdAt: feedback.createdAt
            };
          });
          const csv = toCsv(
            [
              'id',
              'userId',
              'userFullName',
              'message',
              'highlights',
              'improvements',
              'ratingOverall',
              'ratingHotel',
              'ratingActivities',
              'ratingFood',
              'createdAt'
            ],
            rows
          );
          downloadFile(`feedback-${dateTag}.csv`, csv, 'text/csv;charset=utf-8');
          return;
        }

        if (kind === 'quotes') {
          const rows = quotes.map((quote) => ({
            id: quote.id,
            text: quote.text,
            author: quote.author,
            submittedBy: quote.submittedBy || '',
            createdAt: quote.createdAt,
            likes: quote.likes
          }));
          const csv = toCsv(['id', 'text', 'author', 'submittedBy', 'createdAt', 'likes'], rows);
          downloadFile(`quotes-${dateTag}.csv`, csv, 'text/csv;charset=utf-8');
          return;
        }

        if (kind === 'photos') {
          const rows = photos.map((photo) => ({
            id: photo.id,
            url: photo.url,
            caption: photo.caption || '',
            uploadedBy: photo.uploadedBy || '',
            createdAt: photo.createdAt,
            width: photo.width || '',
            height: photo.height || ''
          }));
          const csv = toCsv(['id', 'url', 'caption', 'uploadedBy', 'createdAt', 'width', 'height'], rows);
          downloadFile(`photos-${dateTag}.csv`, csv, 'text/csv;charset=utf-8');
          return;
        }
      },

      exportAllData: () => {
        if (!get().isAdmin) {
          alert("Du må være admin for å eksportere data.");
          return;
        }
        const { users, days, activities, signups, infoPages, feedbacks, quotes, photos } = get();
        const dateTag = new Date().toISOString().split('T')[0];
        const payload = {
          exportedAt: new Date().toISOString(),
          users,
          days,
          activities,
          signups,
          infoPages,
          feedbacks,
          quotes,
          photos
        };
        downloadFile(`turdata-${dateTag}.json`, JSON.stringify(payload, null, 2), 'application/json;charset=utf-8');
      },

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
      },

      // -----------------------------------------------------------------------
      // PHOTODROP ACTIONS
      // -----------------------------------------------------------------------

      addQuote: async (text, author) => {
          const { currentUser } = get();
          const userId = currentUser ? currentUser.id : null;
          
          // Try RPC call first to bypass potential schema cache issues
          const { data, error } = await supabase.rpc('add_quote_rpc', {
              quote_text: text,
              quote_author: author,
              user_id: userId
          });
          
          if (data && !error) {
              // RPC returns the new quote directly
              // Note: RPC return type might be any, cast to Quote if needed
              // Depending on RPC, it returns an array of rows or single row
              const newQuoteRow = Array.isArray(data) ? data[0] : data;
              
              const newQuote: Quote = {
                  id: newQuoteRow.id,
                  text: newQuoteRow.text,
                  author: newQuoteRow.author,
                  submittedBy: newQuoteRow.submitted_by,
                  createdAt: newQuoteRow.created_at,
                  likes: newQuoteRow.likes || 0
              };
              set(state => ({ quotes: [newQuote, ...state.quotes] }));
          } else if (error) {
            console.error("Quote submit error (RPC):", error);
            alert("Kunne ikke sende quote: " + error.message);
          }
      },

      uploadPhoto: async (file, caption) => {
          const { currentUser } = get();
          if (!currentUser) {
            alert("Du må være logget inn for å laste opp bilder.");
            return;
          }

          const fileExt = file.name.split('.').pop();
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
          const filePath = `${fileName}`;

          // Upload to Supabase Storage
          const { error: uploadError } = await supabase.storage
              .from('photos')
              .upload(filePath, file);

          if (uploadError) {
              console.error('Upload error:', uploadError);
              alert("Feil ved opplasting av bilde: " + uploadError.message);
              return;
          }

          // Get Public URL
          const { data: urlData } = supabase.storage.from('photos').getPublicUrl(filePath);
          const publicUrl = urlData.publicUrl;

          // Insert into DB using RPC to bypass schema cache issues
          const { data, error } = await supabase.rpc('add_photo_rpc', {
              photo_url: publicUrl,
              photo_caption: caption || '',
              user_id: currentUser.id
          });

          if (data && !error) {
               const newPhotoRow = Array.isArray(data) ? data[0] : data;
               
               const newPhoto: Photo = {
                   id: newPhotoRow.id,
                   url: newPhotoRow.url,
                   caption: newPhotoRow.caption,
                   uploadedBy: newPhotoRow.uploaded_by,
                   createdAt: newPhotoRow.created_at,
                   width: newPhotoRow.width,
                   height: newPhotoRow.height
               };
               set(state => ({ photos: [newPhoto, ...state.photos] }));
          } else if (error) {
            console.error("Photo DB error (RPC):", error);
            alert("Feil ved lagring av bilde-data: " + error.message);
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
