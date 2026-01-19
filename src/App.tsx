import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ParticipantView } from './views/ParticipantView';
import { AdminView } from './views/AdminView';
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
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
