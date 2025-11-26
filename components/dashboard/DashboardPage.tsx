import React, { useMemo, useState } from 'react';
import { useData } from '../../context/DataContext';
import { Status } from '../../types';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

// FIX: Changed the type of the icon prop from JSX.Element to React.ReactElement.
const StatCard = ({ title, value, color, icon }: { title: string, value: number, color: string, icon: React.ReactElement }) => (
    <div className="bg-white rounded-lg p-6 flex items-center shadow-sm border border-[#DFE1E6]">
        <div className={`p-3 rounded-full mr-4 ${color} bg-[#DEEBFF]`}>
            {icon}
        </div>
        <div>
            <p className="text-sm text-[#5E6C84] font-medium">{title}</p>
            <p className="text-3xl font-bold text-[#172B4D]">{value}</p>
        </div>
    </div>
);


const DashboardPage: React.FC = () => {
    const { tasks, sprints } = useData();
    const [selectedSprintId, setSelectedSprintId] = useState<string>('all');

    const sortedSprints = useMemo(
        () => [...sprints].sort((a, b) => a.name.localeCompare(b.name)),
        [sprints]
    );

    const selectedSprint = useMemo(
        () => (selectedSprintId === 'all' ? null : sprints.find(sprint => sprint.id === selectedSprintId)),
        [selectedSprintId, sprints]
    );

    const visibleTasks = useMemo(() => {
        if (selectedSprintId === 'all') return tasks;
        return tasks.filter(task => task.sprintId === selectedSprintId);
    }, [selectedSprintId, tasks]);

    const todoCount = visibleTasks.filter(task => task.status === Status.ToDo).length;
    const inProgressCount = visibleTasks.filter(task => task.status === Status.InProgress).length;
    const doneCount = visibleTasks.filter(task => task.status === Status.Done).length;

    const chartData = [
        { name: 'Done', value: doneCount, color: '#36B37E' },
        { name: 'In Progress', value: inProgressCount, color: '#0052CC' },
        { name: 'To Do', value: todoCount, color: '#FFAB00' }, // accent yellow to match To Do
    ];

    const totalTasks = chartData.reduce((sum, item) => sum + item.value, 0);
    const donePercent = totalTasks === 0 ? 0 : Math.round((doneCount / totalTasks) * 100);
    const sprintPeriodLabel = selectedSprint?.startDate && selectedSprint?.endDate
        ? `${selectedSprint.startDate} to ${selectedSprint.endDate}`
        : 'All dates';

    return (
        <div>
            <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                <h1 className="text-3xl font-bold" style={{color: '#000'}}>Dashboard</h1>
                <div className="flex items-center gap-2">
                    <label htmlFor="sprint-filter" className="text-sm font-medium text-[#5E6C84]">Sprint</label>
                    <select
                        id="sprint-filter"
                        value={selectedSprintId}
                        onChange={(e) => setSelectedSprintId(e.target.value)}
                        className="p-2 bg-white border border-[#DFE1E6] rounded-md text-[#172B4D] focus:outline-none focus:ring-2 focus:ring-[#0052CC]"
                    >
                        <option value="all">All sprints</option>
                        {sortedSprints.map(sprint => (
                            <option key={sprint.id} value={sprint.id}>{sprint.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="bg-white rounded-lg p-4 mb-6 shadow-sm border border-[#DFE1E6] flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <p className="text-sm text-[#5E6C84] font-medium">Current view</p>
                    <p className="text-xl font-semibold text-[#172B4D]">{selectedSprint ? selectedSprint.name : 'All sprints'}</p>
                    <p className="text-xs text-[#5E6C84]">Period: {selectedSprint ? sprintPeriodLabel : 'Every sprint plus backlog'}</p>
                </div>
                <div className="flex items-center gap-8">
                    <div className="text-right">
                        <p className="text-sm text-[#5E6C84] font-medium">Total tasks</p>
                        <p className="text-2xl font-bold text-[#172B4D]">{visibleTasks.length}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-[#5E6C84] font-medium">Done %</p>
                        <p className="text-2xl font-bold text-[#172B4D]">{donePercent}%</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <StatCard title="To Do" value={todoCount} color="bg-accent-yellow" icon={<TodoIcon />} />
                <StatCard title="In Progress" value={inProgressCount} color="bg-accent-blue" icon={<InProgressIcon />} />
                <StatCard title="Done" value={doneCount} color="bg-accent-green" icon={<DoneIcon />} />
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm border border-[#DFE1E6]">
                <h2 className="text-xl font-bold mb-4" style={{color: '#000'}}>Tasks Overview</h2>
                {visibleTasks.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                        <div className="h-80 relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={chartData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={70}
                                        outerRadius={120}
                                        paddingAngle={3}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#1B1B1D',
                                            borderColor: '#3A3A3F',
                                            color: '#fff'
                                        }}
                                        labelStyle={{ color: '#fff' }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <p className="text-4xl font-bold text-[#172B4D]">{donePercent}%</p>
                                <p className="text-sm text-[#5E6C84]">Done</p>
                            </div>
                        </div>
                        <div className="space-y-3">
                            {chartData.map(item => (
                                <div key={item.name} className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2">
                                        <span className="inline-block w-3 h-3 rounded-sm" style={{ backgroundColor: item.color }} />
                                        <span className="text-[#172B4D] font-medium">{item.name}</span>
                                    </div>
                                    <span className="text-[#0052CC] font-semibold">{item.value}</span>
                                </div>
                            ))}
                            <div className="border-t border-[#DFE1E6] pt-2 flex items-center justify-between text-sm font-semibold">
                                <span className="text-[#172B4D]">Total</span>
                                <span className="text-[#0052CC]">{totalTasks}</span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-80">
                        <p className="text-text-secondary">No tasks available to display chart.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const TodoIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6" /></svg>;
const InProgressIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const DoneIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;


export default DashboardPage;
