
import React, { useState } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import DashboardPage from './components/dashboard/DashboardPage';
import BacklogPage from './components/backlog/BacklogPage';
import TaskManagementPage from './components/task-management/TaskManagementPage';
import ResourceManagementPage from './components/resources/ResourceManagementPage';
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
      <div className="w-full max-w-sm">
        <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6 border border-[#DFE1E6]">
          <h1 className="text-xl font-bold mb-4 text-[#172B4D]">Sign in</h1>
          <label className="block text-sm text-[#172B4D] mb-2">
            Username
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 w-full border border-[#DFE1E6] rounded p-2 focus:outline-none focus:ring-2 focus:ring-[#0052CC]"
              required
            />
          </label>
          <label className="block text-sm text-[#172B4D] mb-4">
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full border border-[#DFE1E6] rounded p-2 focus:outline-none focus:ring-2 focus:ring-[#0052CC]"
              required
            />
          </label>
          {error && <p className="text-red-600 text-sm mb-2">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#0052CC] hover:bg-[#0747A6] text-white font-semibold py-2 px-4 rounded disabled:opacity-60"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
};

const AppContent: React.FC = () => {
  const { isAuthenticated } = useData();

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return (
    <HashRouter>
      <div className="flex h-screen bg-[#F4F5F7] text-[#172B4D]">
        <Sidebar />
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/backlog" element={<BacklogPage />} />
            <Route path="/board" element={<TaskManagementPage />} />
            <Route path="/resources" element={<ResourceManagementPage />} />
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
