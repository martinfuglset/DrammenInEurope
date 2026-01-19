import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ParticipantView } from './views/ParticipantView';
import { AdminView } from './views/AdminView';

export default function App() {
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
