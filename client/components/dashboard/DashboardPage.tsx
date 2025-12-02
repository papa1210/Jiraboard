import React, { useMemo, useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { Status } from '../../types';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Legend, ReferenceDot } from 'recharts';
import { reportsApi } from '../../api';

// FIX: Changed the type of the icon prop from JSX.Element to React.ReactElement.
const StatCard = ({ title, value, color, icon }: { title: string, value: number, color: string, icon: React.ReactElement }) => (
    <div className="bg-white rounded-2xl p-4 flex items-center border border-[var(--color-border)] shadow-[var(--shadow-soft)]">
        <div
            className="p-3 rounded-xl mr-3 flex items-center justify-center"
            style={{ backgroundColor: `${color}26`, color }}
        >
            {icon}
        </div>
        <div>
            <p className="text-sm text-[var(--color-text-muted)] font-medium">{title}</p>
            <p className="text-3xl font-bold text-[var(--color-text)]">{value}</p>
        </div>
    </div>
);


const DashboardPage: React.FC = () => {
    const { tasks } = useData();
    const now = new Date();
    const getInitialSelection = () => {
        try {
            const raw = window.localStorage.getItem('dashboard-month-selection');
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed.year && parsed.month) {
                    return { year: Number(parsed.year), month: Number(parsed.month) };
                }
            }
        } catch (err) {
            console.warn('Failed to read dashboard month selection', err);
        }
        return { year: now.getFullYear(), month: now.getMonth() + 1 };
    };
    const initial = getInitialSelection();
    const [selectedYear, setSelectedYear] = useState<number>(initial.year);
    const [selectedMonth, setSelectedMonth] = useState<number>(initial.month);
    const [actualReport, setActualReport] = useState<{ labels: string[]; completedByDay: number[] }>({ labels: [], completedByDay: [] });
    const [scopeReport, setScopeReport] = useState<{ labels: string[]; scopeByDay: number[]; changes: { day: string; value: number; delta: number }[] }>({ labels: [], scopeByDay: [], changes: [] });

    useEffect(() => {
        const monthParam = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
        reportsApi.actualHours(monthParam)
            .then((data) => setActualReport({ labels: data.labels || [], completedByDay: data.completedByDay || [] }))
            .catch(() => setActualReport({ labels: [], completedByDay: [] }));
        reportsApi.scope(monthParam)
            .then((data) => setScopeReport({ labels: data.labels || [], scopeByDay: data.scopeByDay || [], changes: data.changes || [] }))
            .catch(() => setScopeReport({ labels: [], scopeByDay: [], changes: [] }));
    }, [selectedYear, selectedMonth, tasks]);

    const visibleTasks = useMemo(() => {
        return tasks.filter(task => task.year === selectedYear && task.month === selectedMonth);
    }, [selectedYear, selectedMonth, tasks]);

    const availableYears = useMemo(() => {
        const years = new Set<number>();
        tasks.forEach(t => years.add(t.year));
        for (let i = -1; i <= 4; i++) {
            years.add(now.getFullYear() + i);
        }
        return Array.from(years).sort((a, b) => b - a);
    }, [tasks, now]);

    const persistSelection = (year: number, month: number) => {
        try {
            window.localStorage.setItem('dashboard-month-selection', JSON.stringify({ year, month }));
        } catch (err) {
            console.warn('Failed to persist dashboard month selection', err);
        }
    };

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
    const periodLabel = `${selectedYear} - Tháng ${String(selectedMonth).padStart(2, '0')}`;

    const startDate = useMemo(() => new Date(selectedYear, selectedMonth - 1, 1), [selectedYear, selectedMonth]);
    const endDate = useMemo(() => new Date(selectedYear, selectedMonth, 0), [selectedYear, selectedMonth]);

    const burndownData = useMemo(() => {
        const dayCount = endDate.getDate();
        const days = Array.from({ length: dayCount }, (_, i) => i + 1);

        const scopedTasks = tasks.filter(t => t.year === selectedYear && t.month === selectedMonth);

        const fallbackTotal = scopedTasks.reduce((sum, t) => {
            const pts = typeof t.estimatedHours === 'number' && t.estimatedHours > 0 ? t.estimatedHours : 1;
            return sum + pts;
        }, 0);
        const scopeSeries = Array.from({ length: dayCount }, () => fallbackTotal);

        // Completed hours by day from actual-hours report (daily logs)
        const completedByDay: number[] = days.map((_, idx) => actualReport.completedByDay[idx] ?? 0);

        const cumulativeCompleted: number[] = [];
        completedByDay.reduce((acc, curr, idx) => {
            const next = acc + curr;
            cumulativeCompleted[idx] = next;
            return next;
        }, 0);

        const idealPerDay = scopeSeries[0] / Math.max(dayCount, 1);

        return days.map((day, idx) => {
            const dateLabel = `${String(selectedMonth).padStart(2, '0')}/${String(day).padStart(2, '0')}`;
            const scope = scopeSeries[idx] ?? scopeSeries[0] ?? 0;
            const remaining = Math.max(0, scope - (cumulativeCompleted[idx] || 0));
            const idealRemaining = Math.max(0, (scopeSeries[0] ?? 0) - idealPerDay * (idx + 1));
            const completed = cumulativeCompleted[idx] || 0;
            return {
                day: dateLabel,
                remaining,
                idealRemaining,
                completed,
                scope,
            };
        });
    }, [tasks, selectedYear, selectedMonth, endDate, actualReport, scopeReport]);

    return (
        <div>
            <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                <h1 className="text-3xl font-bold text-[var(--color-text)]">Dashboard</h1>
                <div className="flex items-center gap-2">
                    <label htmlFor="year-filter" className="text-sm font-medium text-[var(--color-text-muted)]">Year</label>
                    <select
                        id="year-filter"
                        value={selectedYear}
                        onChange={(e) => {
                            const nextYear = Number(e.target.value);
                            setSelectedYear(nextYear);
                            persistSelection(nextYear, selectedMonth);
                        }}
                        className="p-2 bg-[#F9FAFB] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                    >
                        {availableYears.map(year => (
                            <option key={year} value={year}>{year}</option>
                        ))}
                    </select>
                    <label htmlFor="month-filter" className="text-sm font-medium text-[var(--color-text-muted)]">Month</label>
                    <select
                        id="month-filter"
                        value={selectedMonth}
                        onChange={(e) => {
                            const nextMonth = Number(e.target.value);
                            setSelectedMonth(nextMonth);
                            persistSelection(selectedYear, nextMonth);
                        }}
                        className="p-2 bg-[#F9FAFB] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                    >
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                            <option key={m} value={m}>{`Tháng ${String(m).padStart(2, '0')}`}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-2xl p-4 border border-[var(--color-border)] shadow-[var(--shadow-soft)] flex flex-col justify-between">
                    <div>
                        <p className="text-sm text-[var(--color-text-muted)] font-medium">Current view</p>
                        <p className="text-xl font-semibold text-[var(--color-text)]">{periodLabel}</p>
                    </div>
                    <div className="mt-4 flex items-center gap-6">
                        <div className="text-right">
                            <p className="text-sm text-[var(--color-text-muted)] font-medium">Total tasks</p>
                            <p className="text-2xl font-bold text-[var(--color-text)]">{visibleTasks.length}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-[var(--color-text-muted)] font-medium">Done %</p>
                            <p className="text-2xl font-bold text-[var(--color-text)]">{donePercent}%</p>
                        </div>
                    </div>
                </div>
                <StatCard title="To Do" value={todoCount} color="#F59E0B" icon={<TodoIcon />} />
                <StatCard title="In Progress" value={inProgressCount} color="#0D66D0" icon={<InProgressIcon />} />
                <StatCard title="Done" value={doneCount} color="#36B37E" icon={<DoneIcon />} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl p-6 border border-[var(--color-border)] shadow-[var(--shadow-soft)]">
                    <h2 className="text-xl font-bold mb-4 text-[var(--color-text)]">Tasks Overview</h2>
                    {visibleTasks.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                            <div className="h-64 relative">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={chartData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={90}
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
                                                backgroundColor: '#111827',
                                                borderColor: '#1f2937',
                                                color: '#fff'
                                            }}
                                            labelStyle={{ color: '#fff' }}
                                            itemStyle={{ color: '#fff' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <p className="text-3xl font-bold text-[var(--color-text)]">{donePercent}%</p>
                                    <p className="text-sm text-[var(--color-text-muted)]">Done</p>
                                </div>
                            </div>
                            <div className="space-y-3">
                                {chartData.map(item => (
                                    <div key={item.name} className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2">
                                            <span className="inline-block w-3 h-3 rounded-sm" style={{ backgroundColor: item.color }} />
                                            <span className="text-[var(--color-text)] font-medium">{item.name}</span>
                                        </div>
                                        <span className="text-[var(--color-primary)] font-semibold">{item.value}</span>
                                    </div>
                                ))}
                                <div className="border-t border-[var(--color-border)] pt-2 flex items-center justify-between text-sm font-semibold">
                                    <span className="text-[var(--color-text)]">Total</span>
                                    <span className="text-[var(--color-primary)]">{totalTasks}</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-64">
                            <p className="text-[var(--color-text-muted)]">No tasks available to display chart.</p>
                        </div>
                    )}
                </div>

                <div className="bg-white rounded-2xl p-6 border border-[var(--color-border)] shadow-[var(--shadow-soft)]">
                    <h3 className="text-lg font-semibold text-[var(--color-text)] mb-2">Burndown (Remaining)</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={burndownData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                                <YAxis tick={{ fontSize: 11 }} />
                                <Tooltip />
                                <Legend />
                                <Line type="monotone" dataKey="remaining" stroke="#0D66D0" strokeWidth={2} dot={false} name="Remaining" />
                                <Line type="monotone" dataKey="idealRemaining" stroke="#94A3B8" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Ideal" />
                                {scopeReport.changes.map((c, idx) => (
                                    <ReferenceDot key={idx} x={c.day} y={c.value} r={3} fill="#a855f7" stroke="none" />
                                ))}
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="mt-4">
                        <h3 className="text-lg font-semibold text-[var(--color-text)] mb-2">Burnup (Completed vs Scope)</h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={burndownData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                                    <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                                    <YAxis tick={{ fontSize: 11 }} />
                                    <Tooltip />
                                    <Legend />
                                    <Line type="monotone" dataKey="completed" stroke="#22C55E" strokeWidth={2} dot={false} name="Completed" />
                                    <Line type="monotone" dataKey="scope" stroke="#F97316" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Scope" />
                                    {scopeReport.changes.map((c, idx) => (
                                        <ReferenceDot key={idx} x={c.day} y={c.value} r={3} fill="#a855f7" stroke="none" />
                                    ))}
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const TodoIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5h9M9 9h9M9 13h9M5 7h.01M5 11h.01M5 15h.01" />
    </svg>
);
const InProgressIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6l4 2" />
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth={2} />
    </svg>
);
const DoneIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth={2} />
    </svg>
);


export default DashboardPage;
