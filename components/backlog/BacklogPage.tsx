import React, { useEffect, useMemo, useState } from 'react';
import { useData } from '../../context/DataContext';
import { Task, Status, Priority, Sprint } from '../../types';
import TaskForm from '../shared/TaskForm';
import Modal from '../ui/Modal';

const BACKLOG_ID = 'backlog';

const formatSprintDuration = (sprint: Sprint) => {
    if (sprint.startDate && sprint.endDate) {
        return `${sprint.startDate} - ${sprint.endDate}`;
    }
    return 'No dates';
};

const BacklogPage: React.FC = () => {
    const { tasks, sprints, updateTask, deleteTask } = useData();
    const [searchTerm, setSearchTerm] = useState('');
    const [isCreateModalOpen, setCreateModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

    const filteredTasks = useMemo(() => {
        const lower = searchTerm.toLowerCase().trim();
        const sorted = [...tasks].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        return sorted.filter(task =>
            task.taskId.toLowerCase().includes(lower) ||
            task.description.toLowerCase().includes(lower)
        );
    }, [tasks, searchTerm]);

    const sprintMap = useMemo(() => {
        return sprints.reduce((acc, sprint) => {
            acc[sprint.id] = sprint.name;
            return acc;
        }, {} as Record<string, string>);
    }, [sprints]);

    const groupedTasks = useMemo(() => {
        const groups = [
            ...sprints.map(sprint => ({
                id: sprint.id,
                title: sprint.name,
                duration: formatSprintDuration(sprint),
            })),
            { id: BACKLOG_ID, title: 'Backlog', duration: '' },
        ];

        return groups.map(group => ({
            ...group,
            tasks: filteredTasks.filter(task => (task.sprintId ?? BACKLOG_ID) === group.id),
        }));
    }, [filteredTasks, sprints]);

    useEffect(() => {
        setCollapsedGroups(prev => {
            const allIds = [...sprints.map(s => s.id), BACKLOG_ID];
            const next = { ...prev };
            let changed = false;

            allIds.forEach(id => {
                if (next[id] === undefined) {
                    next[id] = false;
                    changed = true;
                }
            });

            Object.keys(next).forEach(id => {
                if (!allIds.includes(id)) {
                    delete next[id];
                    changed = true;
                }
            });

            return changed ? next : prev;
        });
    }, [sprints]);

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

    const hasResults = filteredTasks.length > 0;

    return (
        <div>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-[#000]">Product Backlog</h1>
                    <p className="text-sm text-[#5E6C84]">Group by sprint, search quickly, and expand or collapse each sprint.</p>
                </div>
                <button
                    onClick={() => setCreateModalOpen(true)}
                    className="bg-[#0052CC] hover:bg-[#0747A6] text-white font-bold py-2 px-4 rounded-md transition-colors"
                >
                    Create Task
                </button>
            </div>

            <div className="mb-4">
                <input
                    type="text"
                    placeholder="Search by Task ID or description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full p-2 bg-white border border-[#DFE1E6] rounded-md text-[#172B4D] focus:outline-none focus:ring-2 focus:ring-[#0052CC]"
                />
            </div>

            <div className="space-y-4">
                {hasResults ? groupedTasks.map(group => (
                    <div key={group.id} className="bg-white rounded-lg shadow-sm border border-[#DFE1E6] overflow-hidden">
                        <button
                            type="button"
                            onClick={() => toggleGroup(group.id)}
                            className="w-full flex items-center justify-between p-4 hover:bg-[#F4F5F7] transition-colors"
                        >
                            <div className="flex items-center gap-3 text-left">
                                <span className={`text-lg text-[#172B4D] transition-transform ${collapsedGroups[group.id] ? '-rotate-90' : 'rotate-90'}`} aria-hidden>{'>'}</span>
                                <div>
                                    <div className="text-lg font-semibold text-[#172B4D]">
                                        {group.duration ? `${group.title} (${group.duration})` : group.title}
                                    </div>
                                    <div className="text-sm text-[#5E6C84]">{group.tasks.length} {group.tasks.length === 1 ? 'task' : 'tasks'}</div>
                                </div>
                            </div>
                            <span className="text-sm font-medium text-[#0052CC]">{collapsedGroups[group.id] ? 'Expand' : 'Collapse'}</span>
                        </button>

                        {!collapsedGroups[group.id] && (
                            <div className="border-t border-[#DFE1E6]">
                                {group.tasks.length === 0 ? (
                                    <p className="text-center p-6 text-[#5E6C84] text-sm">No tasks in this sprint.</p>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full">
                                            <thead className="bg-[#DEEBFF]">
                                                <tr>
                                                    <th className="p-4 text-left text-sm font-semibold text-[#5E6C84] tracking-wider">Task ID</th>
                                                    <th className="p-4 text-left text-sm font-semibold text-[#5E6C84] tracking-wider">Description</th>
                                                    <th className="p-4 text-left text-sm font-semibold text-[#5E6C84] tracking-wider">Status</th>
                                                    <th className="p-4 text-left text-sm font-semibold text-[#5E6C84] tracking-wider">Created At</th>
                                                    <th className="p-4 text-left text-sm font-semibold text-[#5E6C84] tracking-wider">Sprint</th>
                                                    <th className="p-4 text-left text-sm font-semibold text-[#5E6C84] tracking-wider">Actions</th>
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
                                                        <td className="p-4 whitespace-nowrap text-[#5E6C84]">{task.sprintId ? sprintMap[task.sprintId] : 'Backlog'}</td>
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
                            </div>
                        )}
                    </div>
                )) : (
                    <p className="text-center p-8 text-[#5E6C84]">No tasks found.</p>
                )}
            </div>
            
            <Modal isOpen={isCreateModalOpen} onClose={() => setCreateModalOpen(false)} title="Create New Task">
                <TaskForm 
                    sprints={sprints}
                    onTaskCreated={() => setCreateModalOpen(false)}
                    initialData={{ sprintId: null }}
                />
            </Modal>
            
            {editingTask && (
                 <Modal isOpen={!!editingTask} onClose={() => setEditingTask(null)} title={`Edit Task ${editingTask.taskId}`} size="4xl">
                    <TaskForm 
                        sprints={sprints}
                        onTaskUpdated={handleUpdateTask}
                        initialData={editingTask}
                    />
                </Modal>
            )}
        </div>
    );
};

export default BacklogPage;
