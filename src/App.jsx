import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import InterviewRoom from './pages/InterviewRoom';
import ResultPage from './pages/ResultPage';
import CodingTest from './pages/CodingTest';
import CodingResult from './pages/CodingResult';

function AppContent() {
  const location = useLocation();
  const hideNavbar = ['/coding-test', '/coding-results', '/interview', '/results'].some(path => location.pathname.toLowerCase().includes(path));

  return (
    <>
      {!hideNavbar && <Navbar />}
      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/interview" element={<InterviewRoom />} />
          <Route path="/results" element={<ResultPage />} />
          <Route path="/coding-test" element={<CodingTest />} />
          <Route path="/coding-results" element={<CodingResult />} />
        </Routes>
      </AnimatePresence>
    </>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
