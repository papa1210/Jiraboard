import React, { useMemo, useState } from 'react';
import { useData } from '../../context/DataContext';
import { Task } from '../../types';
import KanbanBoard from './KanbanBoard';
import Modal from '../ui/Modal';
import TaskForm from '../shared/TaskForm';

const TaskManagementPage: React.FC = () => {
    const { tasks } = useData();
    const now = new Date();
    const getInitialSelection = () => {
        try {
            const raw = window.localStorage.getItem('board-month-selection');
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed.year && parsed.month) {
                    return {
                        year: Number(parsed.year),
                        month: Number(parsed.month),
                    };
                }
            }
        } catch (err) {
            console.warn('Failed to read board month selection', err);
        }
        return { year: now.getFullYear(), month: now.getMonth() + 1 };
    };
    const initial = getInitialSelection();
    const [selectedYear, setSelectedYear] = useState<number>(initial.year);
    const [selectedMonth, setSelectedMonth] = useState<number>(initial.month);
    const [isCreateTaskModalOpen, setCreateTaskModalOpen] = useState(false);

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
            window.localStorage.setItem('board-month-selection', JSON.stringify({ year, month }));
        } catch (err) {
            console.warn('Failed to persist board month selection', err);
        }
    };

    const formatDate = (value: string | null | undefined) => {
        if (!value) return '';
        return new Date(value).toLocaleDateString();
    };

    const buildReportHtml = (month: number, year: number, monthTasks: Task[]) => {
        const generatedOn = new Date().toLocaleString();
        const rows = monthTasks.map(task => `
            <tr>
                <td>${task.taskId}</td>
                <td>${formatDate(task.startDate)}</td>
                <td>${formatDate(task.completeDate)}</td>
                <td>${task.status}</td>
                <td>${task.comments ? task.comments.replace(/\\n/g, ' ') : ''}</td>
            </tr>
        `).join('');

        return `<!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8" />
          <style>
            table { border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; }
            th, td { border: 1px solid #d0d0d0; padding: 8px; text-align: left; }
            th { background: #f0f0f0; }
            caption { text-align: left; font-weight: bold; margin-bottom: 8px; }
          </style>
        </head>
        <body>
          <table>
            <caption>Month Report</caption>
            <tr><th>Generated On</th><td>${generatedOn}</td></tr>
            <tr><th>Month</th><td>${year} - ${String(month).padStart(2,'0')}</td></tr>
          </table>
          <br />
          <table>
            <tr>
              <th>Task ID</th>
              <th>Start Date</th>
              <th>Complete Date</th>
              <th>Status</th>
              <th>Notes</th>
            </tr>
            ${rows || '<tr><td colspan="5">No tasks in this month</td></tr>'}
          </table>
        </body>
        </html>`;
    };

    const handleExportReport = () => {
        const monthTasks = tasks.filter(t => t.year === selectedYear && t.month === selectedMonth);
        const html = buildReportHtml(selectedMonth, selectedYear, monthTasks);
        const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const label = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
        link.href = url;
        link.download = `${label}-report.xls`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                <h1 className="text-3xl font-bold text-black">Task Management</h1>
                <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                        <span className="text-xs text-[var(--color-text-muted)]">Year</span>
                        <select
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
                    </div>
                        <select
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
                    <button
                        onClick={() => setCreateTaskModalOpen(true)}
                        className="btn-primary"
                    >
                        Create Task
                    </button>
                    <button
                        onClick={handleExportReport}
                        className="btn-ghost"
                    >
                        Export Report
                    </button>
                </div>
            </div>
            
            <KanbanBoard year={selectedYear} month={selectedMonth} />
            
            <Modal isOpen={isCreateTaskModalOpen} onClose={() => setCreateTaskModalOpen(false)} title="Create New Task">
                <TaskForm 
                    onTaskCreated={() => setCreateTaskModalOpen(false)}
                    initialData={{ 
                        sprintId: null,
                        year: selectedYear,
                        month: selectedMonth,
                        startDate: new Date(selectedYear, selectedMonth - 1, 1).toISOString().split('T')[0],
                    }}
                />
            </Modal>
        </div>
    );
};

export default TaskManagementPage;
