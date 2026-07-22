import { Routes, Route } from 'react-router-dom';
import AmbientBackground from './components/layout/AmbientBackground';
import CustomCursor from './components/layout/CustomCursor';
import MarketingPage from './pages/MarketingPage';
import Dashboard from './pages/Dashboard';
import AdminStudio from './pages/AdminStudio';

export default function App() {
  return (
    <>
      <AmbientBackground />
      <CustomCursor />
      <Routes>
        <Route path="/" element={<MarketingPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/admin/studio" element={<AdminStudio />} />
      </Routes>
    </>
  );
}
