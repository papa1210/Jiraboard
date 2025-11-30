
import React, { useState, useMemo, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { Sprint, Status, Task } from '../../types';
import KanbanBoard from './KanbanBoard';
import Modal from '../ui/Modal';
import TaskForm from '../shared/TaskForm';

const TaskManagementPage: React.FC = () => {
    const { sprints, getTasksForSprint } = useData();
    const [selectedSprintId, setSelectedSprintId] = useState<string | null>(sprints[0]?.id || null);
    const [isCreateTaskModalOpen, setCreateTaskModalOpen] = useState(false);

    const sortedSprints = useMemo(() => {
        return [...sprints].sort((a, b) => b.name.localeCompare(a.name));
    }, [sprints]);
    
    if (selectedSprintId === null && sortedSprints.length > 0) {
        setSelectedSprintId(sortedSprints[0].id);
    }

    useEffect(() => {
        if (selectedSprintId && !sprints.some(s => s.id === selectedSprintId)) {
            setSelectedSprintId(sprints[0]?.id || null);
        }
    }, [selectedSprintId, sprints]);

    const formatDate = (value: string | null | undefined) => {
        if (!value) return '';
        return new Date(value).toLocaleDateString();
    };

    const buildReportHtml = (sprint: Sprint, tasks: Task[]) => {
        const generatedOn = new Date().toLocaleString();
        const rows = tasks.map(task => `
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
            <caption>Sprint Report</caption>
            <tr><th>Generated On</th><td>${generatedOn}</td></tr>
            <tr><th>Sprint Name</th><td>${sprint.name}</td></tr>
            <tr><th>Sprint Period</th><td>${formatDate(sprint.startDate)} - ${formatDate(sprint.endDate)}</td></tr>
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
            ${rows || '<tr><td colspan="5">No tasks in this sprint</td></tr>'}
          </table>
        </body>
        </html>`;
    };

    const handleExportReport = () => {
        if (!selectedSprintId) return;
        const sprint = sprints.find(s => s.id === selectedSprintId);
        if (!sprint) return;
        const sprintTasks = getTasksForSprint(selectedSprintId);
        const html = buildReportHtml(sprint, sprintTasks);
        const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const sprintLabel = sprint.name.replace(/\\s+/g, '-');
        link.href = url;
        link.download = `${sprintLabel}-report.xls`;
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
                    <select
                        value={selectedSprintId || ''}
                        onChange={(e) => setSelectedSprintId(e.target.value)}
                        className="p-2 bg-[#F9FAFB] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                    >
                        {sortedSprints.map((sprint: Sprint) => (
                            <option key={sprint.id} value={sprint.id}>{sprint.name}</option>
                        ))}
                         {sortedSprints.length === 0 && <option disabled>No Sprints Available</option>}
                    </select>
                    <button
                        onClick={() => setCreateTaskModalOpen(true)}
                        className="btn-primary"
                        disabled={!selectedSprintId}
                    >
                        Create Task
                    </button>
                    <button
                        onClick={handleExportReport}
                        className="btn-ghost"
                        disabled={!selectedSprintId}
                    >
                        Sprint Report
                    </button>
                </div>
            </div>
            
            {selectedSprintId ? (
                 <KanbanBoard sprintId={selectedSprintId} />
            ) : (
                <div className="flex-1 flex items-center justify-center bg-surface rounded-lg">
                    <div className="text-center">
                        <h2 className="text-2xl font-semibold text-text-primary">No Sprint Selected</h2>
                        <p className="text-text-secondary mt-2">Please create a new sprint or select an existing one to view the board.</p>
                    </div>
                </div>
            )}
            
            <Modal isOpen={isCreateTaskModalOpen} onClose={() => setCreateTaskModalOpen(false)} title="Create New Task">
                <TaskForm 
                    sprints={sprints}
                    onTaskCreated={() => setCreateTaskModalOpen(false)}
                    initialData={{ sprintId: selectedSprintId }}
                />
            </Modal>
        </div>
    );
};

export default TaskManagementPage;
