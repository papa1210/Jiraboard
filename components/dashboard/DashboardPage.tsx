import React from 'react';
import { useData } from '../../context/DataContext';
import { Status } from '../../types';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

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
    const { tasks } = useData();

    const todoCount = tasks.filter(task => task.status === Status.ToDo).length;
    const inProgressCount = tasks.filter(task => task.status === Status.InProgress).length;
    const doneCount = tasks.filter(task => task.status === Status.Done).length;

    const chartData = [
        { name: 'To Do', value: todoCount },
        { name: 'In Progress', value: inProgressCount },
        { name: 'Done', value: doneCount },
    ];

    const COLORS = {
        'To Do': '#FFAB00', // accent-yellow
        'In Progress': '#0052CC', // accent-blue
        'Done': '#36B37E', // accent-green
    };

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6" style={{color: '#000'}}>Dashboard</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <StatCard title="To Do" value={todoCount} color="bg-accent-yellow" icon={<TodoIcon />} />
                <StatCard title="In Progress" value={inProgressCount} color="bg-accent-blue" icon={<InProgressIcon />} />
                <StatCard title="Done" value={doneCount} color="bg-accent-green" icon={<DoneIcon />} />
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm border border-[#DFE1E6] h-96">
                <h2 className="text-xl font-bold mb-4" style={{color: '#000'}}>Tasks Overview</h2>
                {tasks.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                outerRadius={120}
                                fill="#8884d8"
                                dataKey="value"
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            >
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS]} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#F4F5F7',
                                    borderColor: '#DFE1E6',
                                    color: '#172B4D'
                                }}
                            />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="flex items-center justify-center h-full">
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