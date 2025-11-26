import React, { useRef } from 'react';
import { NavLink } from 'react-router-dom';
import { useData } from '../../context/DataContext';

const Sidebar: React.FC = () => {
    const { importData, exportData } = useData();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleExport = () => {
        const data = exportData();
        const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`;
        const link = document.createElement('a');
        link.href = jsonString;
        link.download = `jira-clone-backup-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result;
                if (typeof text !== 'string') throw new Error("File content is not a string");
                const data = JSON.parse(text);
                if (window.confirm('Are you sure you want to import this data? This will overwrite existing data.')) {
                    importData(data);
                    alert('Data imported successfully!');
                }
            } catch (error) {
                console.error('Failed to import data:', error);
                alert('Failed to import data. Please check the file format.');
            }
        };
        reader.readAsText(file);
    };


    const NavItem = ({ to, icon, label }: { to: string; icon: React.ReactElement; label: string }) => (
        <NavLink
            to={to}
            className={({ isActive }) =>
                `flex items-center p-3 my-1 rounded-lg transition-colors ${isActive ? 'bg-[#0052CC] text-white' : 'text-[#B3BAC5] hover:bg-[#0747A6] hover:text-white'
                }`
            }
        >
            {icon}
            <span className="ml-4 font-medium">{label}</span>
        </NavLink>
    );

    return (
        <aside className="w-64 bg-[#0747A6] flex-shrink-0 p-4 flex flex-col justify-between">
            <div>
                <div className="flex items-center mb-8">
                    <svg className="w-8 h-8 text-[#0052CC]" viewBox="0 0 24 24" fill="currentColor"><path d="M12.001 2.001a10 10 0 100 20 10 10 0 000-20zm0 18a8 8 0 110-16 8 8 0 010 16zM12 7a.75.75 0 00-.75.75v3.5h-2.5a.75.75 0 000 1.5h3.25V7.75A.75.75 0 0012 7zM16.25 12a.75.75 0 00-1.5 0v3.5h-2.5a.75.75 0 000 1.5h3.25a.75.75 0 00.75-.75V12z"/></svg>
                    <h1 className="text-xl font-bold ml-2 text-white">Task Manager</h1>
                </div>
                <nav>
                    <NavItem to="/" icon={<HomeIcon />} label="Dashboard" />
                    <NavItem to="/backlog" icon={<ListIcon />} label="Backlog" />
                    <NavItem to="/board" icon={<BoardIcon />} label="Board" />
                    <NavItem to="/resources" icon={<TeamIcon />} label="Resources" />
                </nav>
            </div>
            <div>
                <button onClick={handleImportClick} className="w-full flex items-center p-3 my-1 rounded-lg text-[#B3BAC5] hover:bg-[#0052CC] hover:text-white">
                    <ImportIcon /> <span className="ml-4">Import Data</span>
                </button>
                <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleFileChange} />
                <button onClick={handleExport} className="w-full flex items-center p-3 my-1 rounded-lg text-[#B3BAC5] hover:bg-[#0052CC] hover:text-white">
                    <ExportIcon /> <span className="ml-4">Export Data</span>
                </button>
            </div>
        </aside>
    );
};

const HomeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>;
const ListIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>;
const BoardIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" /></svg>;
const TeamIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-1a4 4 0 00-5-4m0 5v-1a4 4 0 00-3-3.87M17 20H7m0 0H2v-1a4 4 0 015-4m10-4a3 3 0 10-6 0 3 3 0 006 0zm-10 0a3 3 0 10-6 0 3 3 0 006 0z" /></svg>;
const ImportIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>;
const ExportIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>;

export default Sidebar;
