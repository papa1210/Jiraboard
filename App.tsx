
import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import DashboardPage from './components/dashboard/DashboardPage';
import BacklogPage from './components/backlog/BacklogPage';
import TaskManagementPage from './components/task-management/TaskManagementPage';
import ResourceManagementPage from './components/resources/ResourceManagementPage';
import { DataProvider } from './context/DataContext';

const App: React.FC = () => {
  return (
    <DataProvider>
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
    </DataProvider>
  );
};

export default App;
