import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { Task, Status, Priority } from '../../types';
import TaskForm from '../shared/TaskForm';
import Modal from '../ui/Modal';

const BacklogPage: React.FC = () => {
    const { tasks, sprints, updateTask, deleteTask } = useData();
    const [searchTerm, setSearchTerm] = useState('');
    const [isCreateModalOpen, setCreateModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);

    const filteredTasks = useMemo(() => {
        const lower = searchTerm.toLowerCase();
        const sorted = [...tasks].sort((a, b) => {
            if (a.sprintId === b.sprintId) {
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            }
            if (a.sprintId === null) return 1;
            if (b.sprintId === null) return -1;
            return a.sprintId.localeCompare(b.sprintId);
        });
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

    const handleUpdateTask = (updatedTask: Task) => {
        updateTask(updatedTask.id, updatedTask);
        setEditingTask(null);
    }
    
    const handleDelete = (taskId: string) => {
        if(window.confirm('Are you sure you want to delete this task?')) {
            deleteTask(taskId);
        }
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold" style={{color: '#000'}}>All Tasks</h1>
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

            <div className="bg-white rounded-lg shadow-sm border border-[#DFE1E6] overflow-hidden">
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
                        {filteredTasks.map(task => (
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
                                        {task.priority === Priority.Yes && <span title="Priority" className="text-[#FF5630]">★</span>}
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
                                <td className="p-4 whitespace-nowrap"><span className={`px-2 py-1 text-xs font-semibold rounded-full ${task.status === Status.Done ? 'bg-[#36B37E]' : task.status === Status.InProgress ? 'bg-[#0052CC]' : 'bg-[#FFAB00]'} text-white`}>{task.status}</span></td>
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
                {filteredTasks.length === 0 && (
                     <p className="text-center p-8 text-text-secondary">No tasks found.</p>
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
