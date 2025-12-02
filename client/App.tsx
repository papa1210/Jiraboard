
import React, { useState } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import DashboardPage from './components/dashboard/DashboardPage';
import BacklogPage from './components/backlog/BacklogPage';
import TaskManagementPage from './components/task-management/TaskManagementPage';
import ResourceManagementPage from './components/resources/ResourceManagementPage';
import UserAccountsPage from './components/accounts/UserAccountsPage';
import ReportPage from './components/report/ReportPage';
import MonthlyReportPage from './components/report/MonthlyReportPage';
import DailyReportPage from './components/report/DailyReportPage';
import { DataProvider, useData } from './context/DataContext';

const LoginScreen: React.FC = () => {
  const { login } = useData();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(username, password);
    } catch (err: any) {
      setError(err?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F4F5F7] p-4">
      <div className="w-full max-w-5xl bg-white shadow-lg rounded-3xl overflow-hidden border border-[#E5E7EB] grid grid-cols-1 md:grid-cols-2">
        <div className="p-10 bg-gradient-to-br from-[#1E7BEF] via-[#0D66D0] to-[#0747A6] text-white flex flex-col justify-between">
          <div className="space-y-4">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/20 text-white font-bold text-lg">
              TM
            </div>
            <div>
              <h1 className="text-4xl font-extrabold leading-tight">Simplify management with our dashboard.</h1>
              <p className="mt-4 text-base text-white/90">
                Streamline product backlog, sprints, and tasks with a clean admin experience.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 mt-10">
            <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center text-2xl font-bold">🗂️</div>
            <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center text-2xl font-bold">✅</div>
            <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center text-2xl font-bold">📊</div>
          </div>
        </div>

        <div className="p-10 flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-[#0D66D0] text-white font-bold flex items-center justify-center">TM</div>
            <div>
              <h2 className="text-2xl font-semibold text-[#172B4D]">Welcome Back</h2>
              <p className="text-sm text-[#6B7280]">Please login to your account</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#172B4D] mb-2">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#0D66D0] focus:border-[#0D66D0]"
                placeholder="Enter your username"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#172B4D] mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#0D66D0] focus:border-[#0D66D0]"
                placeholder="Enter your password"
                required
              />
            </div>
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#0D66D0] hover:bg-[#0747A6] text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-60"
            >
              {loading ? 'Signing in...' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

const AppContent: React.FC = () => {
  const { isAuthenticated, userEmail } = useData();

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return (
    <HashRouter>
      <div className="flex h-screen bg-[var(--color-surface-muted)] text-[var(--color-text)]">
        <Sidebar />
        <main className="flex-1 p-4 md:p-8 overflow-y-auto bg-[var(--color-surface-muted)]">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/backlog" element={<BacklogPage />} />
            <Route path="/board" element={<TaskManagementPage />} />
            <Route path="/resources" element={<ResourceManagementPage />} />
            <Route path="/reports" element={<ReportPage />} />
            <Route path="/reports/monthly" element={<MonthlyReportPage />} />
            <Route path="/reports/daily" element={<DailyReportPage />} />
            <Route path="/accounts" element={<UserAccountsPage />} />
          </Routes>
        </main>
      </div>
    </HashRouter>
  );
};

const App: React.FC = () => {
  return (
    <DataProvider>
      <AppContent />
    </DataProvider>
  );
};

export default App;
