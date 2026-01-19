import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ParticipantView } from './views/ParticipantView';
import { AdminView } from './views/AdminView';
import { NoticeboardView } from './views/NoticeboardView';
import { GroupsView } from './views/GroupsView';
import { TodaysPlansView } from './views/TodaysPlansView';
import { PackingListView } from './views/PackingListView';
import { RulesView } from './views/RulesView';
import { FeedbackView } from './views/FeedbackView';
import { PhotoDropView } from './views/PhotoDropView';
import { useStore } from './store';

export default function App() {
  const fetchData = useStore(state => state.fetchData);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ParticipantView />} />
        <Route path="/admin" element={<AdminView />} />
        <Route path="/noticeboard" element={<NoticeboardView />} />
        <Route path="/groups" element={<GroupsView />} />
        <Route path="/todays-plans" element={<TodaysPlansView />} />
        <Route path="/packing-list" element={<PackingListView />} />
        <Route path="/rules" element={<RulesView />} />
        <Route path="/feedback" element={<FeedbackView />} />
        <Route path="/photodrop" element={<PhotoDropView />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
