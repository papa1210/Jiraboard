import React, { useEffect, useMemo, useState } from 'react';
import { useData } from '../../context/DataContext';
import { Task, Status, Priority } from '../../types';
import TaskForm from '../shared/TaskForm';
import Modal from '../ui/Modal';

const monthLabel = (year: number, month: number) => `${year} - Tháng ${String(month).padStart(2, '0')}`;

const BacklogPage: React.FC = () => {
    const { tasks, updateTask, deleteTask } = useData();
    const [searchTerm, setSearchTerm] = useState('');
    const [isCreateModalOpen, setCreateModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
    const [yearMonthForCreate, setYearMonthForCreate] = useState<{ year: number; month: number } | null>(null);

    const filteredTasks = useMemo(() => {
        const lower = searchTerm.toLowerCase().trim();
        const sorted = [...tasks].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        return sorted.filter(task =>
            task.taskId.toLowerCase().includes(lower) ||
            task.description.toLowerCase().includes(lower)
        );
    }, [tasks, searchTerm]);

    const groupedTasks = useMemo(() => {
        const buckets = new Map<string, { year: number; month: number; tasks: Task[] }>();
        filteredTasks.forEach(task => {
            const key = `${task.year}-${task.month}`;
            if (!buckets.has(key)) {
                buckets.set(key, { year: task.year, month: task.month, tasks: [] });
            }
            buckets.get(key)!.tasks.push(task);
        });
        // Ensure current month bucket exists even if empty
        const now = new Date();
        const currentKey = `${now.getFullYear()}-${now.getMonth() + 1}`;
        if (!buckets.has(currentKey)) {
            buckets.set(currentKey, { year: now.getFullYear(), month: now.getMonth() + 1, tasks: [] });
        }
        return Array.from(buckets.values()).sort((a, b) => {
            if (a.year === b.year) return b.month - a.month;
            return b.year - a.year;
        });
    }, [filteredTasks]);

    const totalTasks = filteredTasks.length;

    useEffect(() => {
        setCollapsedGroups(prev => {
            const allKeys = groupedTasks.map(g => `${g.year}-${g.month}`);
            const next = { ...prev };
            let changed = false;
            allKeys.forEach(key => {
                if (next[key] === undefined) {
                    next[key] = false;
                    changed = true;
                }
            });
            Object.keys(next).forEach(key => {
                if (!allKeys.includes(key)) {
                    delete next[key];
                    changed = true;
                }
            });
            return changed ? next : prev;
        });
    }, [groupedTasks]);

    const handleUpdateTask = (updatedTask: Task) => {
        updateTask(updatedTask.id, updatedTask);
        setEditingTask(null);
    };
    
    const handleDelete = (taskId: string) => {
        if (window.confirm('Are you sure you want to delete this task?')) {
            deleteTask(taskId);
        }
    };

    const toggleGroup = (groupId: string) => {
        setCollapsedGroups(prev => ({
            ...prev,
            [groupId]: !prev[groupId],
        }));
    };

    return (
        <div>
            <div className="flex flex-col gap-3 mb-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div>
                        <h1 className="text-3xl font-bold text-[#000]">Product Backlog</h1>
                        <p className="text-sm text-[#5E6C84]">Group by tháng/năm, tìm kiếm nhanh, mở/đóng từng nhóm.</p>
                    </div>
                </div>
            </div>

            <div className="mb-4">
                <input
                    type="text"
                    placeholder="Search by Task ID or description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full input-soft"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-white rounded-2xl border border-[var(--color-border)] shadow-[var(--shadow-soft)] p-4">
                    <p className="text-sm text-[var(--color-text-muted)]">Total tasks</p>
                    <p className="text-2xl font-bold text-[var(--color-text)]">{totalTasks}</p>
                </div>
                <div className="bg-white rounded-2xl border border-[var(--color-border)] shadow-[var(--shadow-soft)] p-4">
                    <p className="text-sm text-[var(--color-text-muted)]">Số nhóm tháng</p>
                    <p className="text-2xl font-bold text-[var(--color-text)]">{groupedTasks.length}</p>
                </div>
            </div>

            <div className="space-y-4">
                {groupedTasks.map(group => {
                    const key = `${group.year}-${group.month}`;
                    return (
                    <div key={key} className="bg-white rounded-2xl shadow-[var(--shadow-soft)] border border-[var(--color-border)] overflow-hidden">
                        <button
                            type="button"
                            onClick={() => toggleGroup(key)}
                            className="w-full flex items-center justify-between p-4 hover:bg-[#F4F5F7] transition-colors"
                        >
                            <div className="flex items-center gap-3 text-left">
                                <span className={`text-lg text-[#172B4D] transition-transform ${collapsedGroups[key] ? '-rotate-90' : 'rotate-90'}`} aria-hidden>{'>'}</span>
                                <div>
                                    <div className="text-lg font-semibold text-[#172B4D]">
                                        {monthLabel(group.year, group.month)}
                                    </div>
                                    <div className="text-sm text-[#5E6C84]">{group.tasks.length} {group.tasks.length === 1 ? 'task' : 'tasks'}</div>
                                </div>
                            </div>
                            <span className="text-sm font-medium text-[#0052CC]">{collapsedGroups[key] ? 'Expand' : 'Collapse'}</span>
                        </button>

                        {!collapsedGroups[key] && (
                            <div className="border-t border-[var(--color-border)]">
                                {group.tasks.length === 0 ? (
                                    <p className="text-center p-6 text-[#5E6C84] text-sm">Chưa có task trong tháng.</p>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full">
                                            <thead className="bg-[var(--color-primary-light)]">
                                                <tr>
                                                    <th className="p-4 text-left text-sm font-semibold text-[var(--color-text-muted)] tracking-wider">Task ID</th>
                                                    <th className="p-4 text-left text-sm font-semibold text-[var(--color-text-muted)] tracking-wider">Description</th>
                                                    <th className="p-4 text-left text-sm font-semibold text-[var(--color-text-muted)] tracking-wider">Status</th>
                                                    <th className="p-4 text-left text-sm font-semibold text-[var(--color-text-muted)] tracking-wider">Created At</th>
                                                    <th className="p-4 text-left text-sm font-semibold text-[var(--color-text-muted)] tracking-wider">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-[#DFE1E6]">
                                                {group.tasks.map(task => (
                                                    <tr key={task.id} className="hover:bg-[#F4F5F7]">
                                                        <td className="p-4 whitespace-nowrap text-[#172B4D] font-medium">
                                                            <div className="flex items-center gap-2">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setEditingTask(task)}
                                                                    className="text-left hover:text-[#0052CC] focus:outline-none focus:underline"
                                                                >
                                                                    {task.taskId}
                                                                </button>
                                                                {task.priority === Priority.Yes && <span title="Priority task" className="text-[#FF5630] font-semibold">!</span>}
                                                            </div>
                                                        </td>
                                                        <td className="p-4 text-[#172B4D] max-w-sm truncate">
                                                            <button
                                                                type="button"
                                                                onClick={() => setEditingTask(task)}
                                                                className="text-left w-full hover:text-[#0052CC] focus:outline-none focus:underline"
                                                            >
                                                                {task.description}
                                                            </button>
                                                        </td>
                                                        <td className="p-4 whitespace-nowrap">
                                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${task.status === Status.Done ? 'bg-[#36B37E]' : task.status === Status.InProgress ? 'bg-[#0052CC]' : 'bg-[#FFAB00]'} text-white`}>
                                                                {task.status}
                                                            </span>
                                                        </td>
                                                        <td className="p-4 whitespace-nowrap text-[#5E6C84]">{new Date(task.createdAt).toLocaleDateString()}</td>
                                                        <td className="p-4 whitespace-nowrap">
                                                            <button onClick={() => setEditingTask(task)} className="text-[#0052CC] hover:underline mr-4">Edit</button>
                                                            <button onClick={() => handleDelete(task.id)} className="text-accent-red hover:underline">Delete</button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                                <div className="border-t border-[var(--color-border)] bg-[#F8F9FB] px-4 py-3 flex justify-between items-center">
                                    <div className="text-sm text-[var(--color-text-muted)]">Add a task to {monthLabel(group.year, group.month)}.</div>
                                    <button
                                        type="button"
                                        onClick={() => { setYearMonthForCreate({ year: group.year, month: group.month }); setCreateModalOpen(true); }}
                                        className="flex items-center gap-2 text-[var(--color-primary)] font-semibold hover:underline"
                                    >
                                        <span className="text-xl leading-none">+</span>
                                        <span>Create Task</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )})}
            </div>
            
            <Modal isOpen={isCreateModalOpen} onClose={() => setCreateModalOpen(false)} title="Create New Task">
                <TaskForm 
                    onTaskCreated={() => { setCreateModalOpen(false); setYearMonthForCreate(null); }}
                    initialData={{ 
                        sprintId: null, 
                        year: yearMonthForCreate?.year, 
                        month: yearMonthForCreate?.month,
                        startDate: yearMonthForCreate ? new Date(yearMonthForCreate.year, (yearMonthForCreate.month - 1), 1).toISOString().split('T')[0] : undefined,
                    }}
                />
            </Modal>
            
            {editingTask && (
                 <Modal isOpen={!!editingTask} onClose={() => setEditingTask(null)} title={`Edit Task ${editingTask.taskId}`} size="4xl" closeOnBackdrop={false}>
                    <TaskForm 
                        onTaskUpdated={handleUpdateTask}
                        initialData={editingTask}
                    />
                </Modal>
            )}
        </div>
    );
};

export default BacklogPage;
