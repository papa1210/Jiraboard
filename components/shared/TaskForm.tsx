import React, { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { Task, Sprint, Status } from '../../types';

interface TaskFormProps {
    initialData: Partial<Task>;
    sprints: Sprint[];
    onTaskCreated?: () => void;
    onTaskUpdated?: (task: Task) => void;
}

const TaskForm: React.FC<TaskFormProps> = ({ initialData, sprints, onTaskCreated, onTaskUpdated }) => {
    const { addTask } = useData();
    const [formData, setFormData] = useState<Partial<Task>>({
        taskId: '',
        description: '',
        sprintId: null,
        status: Status.ToDo,
        startDate: new Date().toISOString().split('T')[0],
        comments: '',
        completionPercent: 0,
        ...initialData
    });
    
    useEffect(() => {
        setFormData({
            taskId: '',
            description: '',
            sprintId: null,
            status: Status.ToDo,
            startDate: new Date().toISOString().split('T')[0],
            comments: '',
            completionPercent: 0,
            ...initialData
        });
    }, [initialData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (name === 'completionPercent') {
            const numericValue = Math.max(0, Math.min(100, Number(value)));
            setFormData(prev => ({ ...prev, [name]: numericValue }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.taskId || !formData.description) {
            alert('Task ID and Description are required.');
            return;
        }

        if (initialData.id) { // Editing existing task
            onTaskUpdated?.(formData as Task);
        } else { // Creating new task
            addTask({
                taskId: formData.taskId!,
                description: formData.description!,
                sprintId: formData.sprintId || null,
                completionPercent: formData.completionPercent ?? 0,
            });
            onTaskCreated?.();
        }
    };
    
    const isEditing = !!initialData.id;

    return (
        <form onSubmit={handleSubmit}>
             {isEditing ? (
                 <div className="flex flex-col md:flex-row gap-6">
                    {/* Left Column */}
                    <div className="flex-grow md:w-2/3 space-y-4">
                        <div>
                            <label className="block text-sm font-medium" style={{color: '#000'}}>Task ID</label>
                            <input
                                type="text"
                                name="taskId"
                                value={formData.taskId}
                                onChange={handleChange}
                                className="w-full mt-1 p-2 bg-white border border-[#DFE1E6] rounded-md text-black focus:outline-none focus:ring-2 focus:ring-[#0052CC]"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium" style={{color: '#000'}}>Description</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows={8}
                                className="w-full mt-1 p-2 bg-white border border-[#DFE1E6] rounded-md text-black focus:outline-none focus:ring-2 focus:ring-[#0052CC]"
                                required
                            />
                        </div>
                         <div>
                            <label className="block text-sm font-medium" style={{color: '#000'}}>Comments</label>
                            <textarea
                                name="comments"
                                value={formData.comments || ''}
                                onChange={handleChange}
                                rows={12}
                                className="w-full mt-1 p-2 bg-white border border-[#DFE1E6] rounded-md text-black focus:outline-none focus:ring-2 focus:ring-[#0052CC]"
                                placeholder="Add notes about the work process..."
                            />
                        </div>
                    </div>
                     {/* Right Column */}
                    <div className="md:w-1/3 space-y-4">
                        <div>
                            <label className="block text-sm font-medium" style={{color: '#000'}}>Sprint</label>
                            <select
                                name="sprintId"
                                value={formData.sprintId || ''}
                                onChange={handleChange}
                                className="w-full mt-1 p-2 bg-white border border-[#DFE1E6] rounded-md text-black focus:outline-none focus:ring-2 focus:ring-[#0052CC]"
                            >
                                <option value="">Backlog</option>
                                {sprints.map(sprint => (
                                    <option key={sprint.id} value={sprint.id}>{sprint.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium" style={{color: '#000'}}>Status</label>
                            <select
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                                className="w-full mt-1 p-2 bg-white border border-[#DFE1E6] rounded-md text-black focus:outline-none focus:ring-2 focus:ring-[#0052CC]"
                            >
                                {Object.values(Status).map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium" style={{color: '#000'}}>Completion %</label>
                            <input
                                type="number"
                                name="completionPercent"
                                min={0}
                                max={100}
                                value={formData.completionPercent ?? 0}
                                onChange={handleChange}
                                className="w-full mt-1 p-2 bg-white border border-[#DFE1E6] rounded-md text-black focus:outline-none focus:ring-2 focus:ring-[#0052CC]"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium" style={{color: '#000'}}>Start Date</label>
                            <input
                                type="date"
                                name="startDate"
                                value={formData.startDate}
                                onChange={handleChange}
                                className="w-full mt-1 p-2 bg-white border border-[#DFE1E6] rounded-md text-black focus:outline-none focus:ring-2 focus:ring-[#0052CC]"
                            />
                        </div>
                    </div>
                 </div>
            ) : (
                <div className="space-y-4 bg-white p-4 rounded-md">
                     <div>
                        <label className="block text-sm font-medium" style={{color: '#000'}}>Task ID</label>
                        <input
                            type="text"
                            name="taskId"
                            value={formData.taskId}
                            onChange={handleChange}
                            className="w-full mt-1 p-2 bg-white border border-[#DFE1E6] rounded-md text-black focus:outline-none focus:ring-2 focus:ring-[#0052CC]"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium" style={{color: '#000'}}>Description</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows={4}
                            className="w-full mt-1 p-2 bg-white border border-[#DFE1E6] rounded-md text-black focus:outline-none focus:ring-2 focus:ring-[#0052CC]"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium" style={{color: '#000'}}>Completion %</label>
                        <input
                            type="number"
                            name="completionPercent"
                            min={0}
                            max={100}
                            value={formData.completionPercent ?? 0}
                            onChange={handleChange}
                            className="w-full mt-1 p-2 bg-white border border-[#DFE1E6] rounded-md text-black focus:outline-none focus:ring-2 focus:ring-[#0052CC]"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium" style={{color: '#000'}}>Sprint</label>
                        <select
                            name="sprintId"
                            value={formData.sprintId || ''}
                            onChange={handleChange}
                            className="w-full mt-1 p-2 bg-white border border-[#DFE1E6] rounded-md text-black focus:outline-none focus:ring-2 focus:ring-[#0052CC]"
                        >
                            <option value="">Backlog</option>
                            {sprints.map(sprint => (
                                <option key={sprint.id} value={sprint.id}>{sprint.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            )}
           
            <div className="flex justify-end pt-6">
                <button
                    type="submit"
                    className="bg-accent-blue hover:bg-primary text-white font-bold py-2 px-4 rounded-md"
                >
                    {isEditing ? 'Save Changes' : 'Create Task'}
                </button>
            </div>
        </form>
    );
};

export default TaskForm;
