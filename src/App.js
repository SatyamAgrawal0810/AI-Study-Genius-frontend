import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Public
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';

// Protected
import Dashboard from './pages/Dashboard';
import SyllabusPage from './pages/SyllabusPage';
import TopicPage from './pages/TopicPage';
import PaperPage from './pages/PaperPage';
import MCQPage from './pages/MCQPage';
import TutorPage from './pages/TutorPage';
import FlashcardsPage from './pages/FlashcardsPage';
import PlannerPage from './pages/PlannerPage';
import DoubtPage from './pages/DoubtPage';
import MindMapPage from './pages/MindMapPage';
import InterviewPage from './pages/InterviewPage';
import AnalyticsPage from './pages/AnalyticsPage';
import LeaderboardPage from './pages/LeaderboardPage';
import StudyGroupsPage from './pages/StudyGroupsPage';
import QuizBattlePage from './pages/QuizBattlePage';
import ProfilePage from './pages/ProfilePage';

// Admin
import AdminPanel from './pages/AdminPanel';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (!user.is_admin) return <Navigate to="/dashboard" replace />;
  return children;
}

function App() {
  return (
    <Router>
      <Routes>
        {/* Public */}
        <Route path="/"       element={<Landing />} />
        <Route path="/login"  element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Protected */}
        <Route path="/dashboard"   element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/profile"     element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/syllabus"    element={<ProtectedRoute><SyllabusPage /></ProtectedRoute>} />
        <Route path="/topic"       element={<ProtectedRoute><TopicPage /></ProtectedRoute>} />
        <Route path="/paper"       element={<ProtectedRoute><PaperPage /></ProtectedRoute>} />
        <Route path="/mcq"         element={<ProtectedRoute><MCQPage /></ProtectedRoute>} />
        <Route path="/tutor"       element={<ProtectedRoute><TutorPage /></ProtectedRoute>} />
        <Route path="/flashcards"  element={<ProtectedRoute><FlashcardsPage /></ProtectedRoute>} />
        <Route path="/planner"     element={<ProtectedRoute><PlannerPage /></ProtectedRoute>} />
        <Route path="/doubt"       element={<ProtectedRoute><DoubtPage /></ProtectedRoute>} />
        <Route path="/mindmap"     element={<ProtectedRoute><MindMapPage /></ProtectedRoute>} />
        <Route path="/interview"   element={<ProtectedRoute><InterviewPage /></ProtectedRoute>} />
        <Route path="/analytics"   element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} />
        <Route path="/leaderboard" element={<ProtectedRoute><LeaderboardPage /></ProtectedRoute>} />
        <Route path="/groups"      element={<ProtectedRoute><StudyGroupsPage /></ProtectedRoute>} />
        <Route path="/battle"      element={<ProtectedRoute><QuizBattlePage /></ProtectedRoute>} />

        {/* Admin */}
        <Route path="/admin" element={<AdminRoute><AdminPanel /></AdminRoute>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;