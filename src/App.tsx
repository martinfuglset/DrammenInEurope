import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ParticipantView } from './views/ParticipantView';
import { AdminView } from './views/AdminView';
import { AdminLayout } from './components/AdminLayout';
import { NoticeboardView } from './views/NoticeboardView';
import { GroupsView } from './views/GroupsView';
import { TodaysPlansView } from './views/TodaysPlansView';
import { PackingListView } from './views/PackingListView';
import { RulesView } from './views/RulesView';
import { FeedbackView } from './views/FeedbackView';
import { PhotoDropView } from './views/PhotoDropView';
import { AdminBudgetsView } from './views/AdminBudgetsView';
import { AdminAdminsView } from './views/AdminAdminsView';
import { AdminParticipantVisibilityView } from './views/AdminParticipantVisibilityView';
import { AdminPaymentStatusView } from './views/AdminPaymentStatusView';
import { AdminParticipantsView } from './views/AdminParticipantsView';
import { AdminProgramView } from './views/AdminProgramView';
import { AdminActivitiesView } from './views/AdminActivitiesView';
import { AdminSignupsView } from './views/AdminSignupsView';
import { AdminExportView } from './views/AdminExportView';
import { AdminMinorEventsWorkspaceView } from './views/AdminMinorEventsWorkspaceView';
import { AdminHoodieRegistrationsView } from './views/AdminHoodieRegistrationsView';
import { AdminMapView } from './views/AdminMapView';
import { AdminNotesView } from './views/AdminNotesView';
import { AdminTripPrepView } from './views/AdminTripPrepView';
import { useStore, selectIsAdmin } from './store';

function AnimatedPage({ children }: { children: React.ReactNode }) {
  return <div className="animate-page-in">{children}</div>;
}

function AdminGuard({ children }: { children: React.ReactNode }) {
  const currentUser = useStore((s) => s.currentUser);
  const isAdmin = useStore(selectIsAdmin);
  if (!currentUser || !isAdmin) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  const fetchData = useStore(state => state.fetchData);
  const subscribePhotoFeed = useStore(state => state.subscribePhotoFeed);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const unsubscribe = subscribePhotoFeed();
    return () => unsubscribe();
  }, [subscribePhotoFeed]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AnimatedPage><ParticipantView /></AnimatedPage>} />
        <Route path="/admin" element={<AdminGuard><AnimatedPage><AdminLayout /></AnimatedPage></AdminGuard>}>
          <Route index element={<AdminView />} />
          <Route path="budgets" element={<AdminBudgetsView />} />
          <Route path="admins" element={<AdminAdminsView />} />
          <Route path="participant-visibility" element={<AdminParticipantVisibilityView />} />
          <Route path="payment-status" element={<AdminPaymentStatusView />} />
          <Route path="participants" element={<AdminParticipantsView />} />
          <Route path="program" element={<AdminProgramView />} />
          <Route path="activities" element={<AdminActivitiesView />} />
          <Route path="signups" element={<AdminSignupsView />} />
          <Route path="minor-events" element={<AdminMinorEventsWorkspaceView />} />
          <Route path="hoodie" element={<AdminHoodieRegistrationsView />} />
          <Route path="export" element={<AdminExportView />} />
          <Route path="map" element={<AdminMapView />} />
          <Route path="notes" element={<AdminNotesView />} />
          <Route path="trip-prep" element={<AdminTripPrepView />} />
        </Route>
        <Route path="/noticeboard" element={<AnimatedPage><NoticeboardView /></AnimatedPage>} />
        <Route path="/groups" element={<AnimatedPage><GroupsView /></AnimatedPage>} />
        <Route path="/todays-plans" element={<AnimatedPage><TodaysPlansView /></AnimatedPage>} />
        <Route path="/packing-list" element={<AnimatedPage><PackingListView /></AnimatedPage>} />
        <Route path="/rules" element={<AnimatedPage><RulesView /></AnimatedPage>} />
        <Route path="/feedback" element={<AnimatedPage><FeedbackView /></AnimatedPage>} />
        <Route path="/photodrop" element={<AnimatedPage><PhotoDropView /></AnimatedPage>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
