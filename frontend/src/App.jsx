import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "./components/layout/MainLayout";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Attendance from "./pages/Attendance";
import KnowledgeBase from "./pages/KnowledgeBase";
import UptimeMonitor from "./components/UptimeMonitor";
import AttendanceTracker from "./components/AttendanceTracker";

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  if (!token) return <Navigate to="/login" replace />;
  return <MainLayout>{children}</MainLayout>;
};

const PublicRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  if (token) return <Navigate to="/" replace />;
  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

        <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />

        <Route path="/uptime" element={
          <ProtectedRoute>
            <div className="space-y-4">
              <div>
                <h1 className="text-lg font-semibold text-[var(--text-main)]">Uptime Monitoring</h1>
                <p className="text-sm text-[var(--text-muted)] mt-0.5">Track service health and response times</p>
              </div>
              <UptimeMonitor />
            </div>
          </ProtectedRoute>
        } />

        <Route path="/attendance-stats" element={
          <ProtectedRoute>
            <div className="space-y-4">
              <div>
                <h1 className="text-lg font-semibold text-[var(--text-main)]">Attendance</h1>
                <p className="text-sm text-[var(--text-muted)] mt-0.5">Manage trackers and view analytics</p>
              </div>
              <AttendanceTracker />
            </div>
          </ProtectedRoute>
        } />

        <Route path="/knowledge" element={
          <ProtectedRoute>
            <KnowledgeBase />
          </ProtectedRoute>
        } />

        <Route path="/attendance" element={<Attendance />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;