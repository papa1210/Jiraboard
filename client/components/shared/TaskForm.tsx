import React, { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { Task, Status, Priority, DutyStatus } from '../../types';

interface TaskFormProps {
    initialData: Partial<Task>;
    onTaskCreated?: () => void;
    onTaskUpdated?: (task: Task) => void;
}

const yearsOptions = (baseYear: number) => {
    const range = [];
    for (let i = baseYear - 1; i <= baseYear + 4; i++) {
        range.push(i);
    }
    return range;
};

const TaskForm: React.FC<TaskFormProps> = ({ initialData, onTaskCreated, onTaskUpdated }) => {
    const { addTask, resources } = useData();
    const currentYear = new Date().getFullYear();
    const [formData, setFormData] = useState<Partial<Task>>({
        taskId: '',
        description: '',
        sprintId: null,
        year: currentYear,
        month: new Date().getMonth() + 1,
        status: Status.ToDo,
        priority: Priority.No,
        startDate: new Date().toISOString().split('T')[0],
        comments: '',
        completionPercent: 0,
        completeDate: null,
        assignedResourceIds: [],
        estimatedHours: 0,
        actualHours: 0,
        ...initialData
    });
    
    useEffect(() => {
        setFormData({
            taskId: '',
            description: '',
            sprintId: null,
            year: currentYear,
            month: new Date().getMonth() + 1,
            status: Status.ToDo,
            priority: Priority.No,
            startDate: new Date().toISOString().split('T')[0],
            comments: '',
            completionPercent: 0,
            completeDate: null,
            assignedResourceIds: [],
            estimatedHours: 0,
            actualHours: 0,
            ...initialData
        });
    }, [initialData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (name === 'completionPercent') {
            const numericValue = Math.max(0, Math.min(100, Number(value)));
            setFormData(prev => ({ ...prev, [name]: numericValue }));
        } else if (name === 'month' || name === 'year') {
            const numericValue = Math.max(0, Number(value));
            setFormData(prev => ({ ...prev, [name]: numericValue }));
        } else if (name === 'estimatedHours' || name === 'actualHours') {
            const numericValue = Math.max(0, Number(value));
            setFormData(prev => ({ ...prev, [name]: numericValue }));
        } else if (name === 'completeDate') {
            setFormData(prev => ({ ...prev, [name]: value || null }));
        } else if (name === 'priority') {
            setFormData(prev => ({ ...prev, [name]: value as Priority }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleResourceToggle = (resourceId: string) => {
        setFormData(prev => {
            const current = prev.assignedResourceIds || [];
            const exists = current.includes(resourceId);
            const next = exists ? current.filter(id => id !== resourceId) : [...current, resourceId];
            return { ...prev, assignedResourceIds: next };
        });
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
            const createYear = formData.year || currentYear;
            const createMonth = formData.month || (new Date().getMonth() + 1);
            const startDate = formData.startDate || new Date(createYear, createMonth - 1, 1).toISOString().split('T')[0];
            addTask({
                taskId: formData.taskId!,
                description: formData.description!,
                sprintId: null,
                year: createYear,
                month: createMonth,
                startDate,
                completionPercent: formData.completionPercent ?? 0,
                priority: formData.priority ?? Priority.No,
                assignedResourceIds: formData.assignedResourceIds ?? [],
                estimatedHours: formData.estimatedHours ?? 0,
                actualHours: formData.actualHours ?? 0,
            });
            onTaskCreated?.();
        }
    };
    
    const isEditing = !!initialData.id;
    const onDutyResources = resources.filter(r => r.status === DutyStatus.OnDuty);

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
                            <label className="block text-sm font-medium" style={{color: '#000'}}>Month / Year</label>
                            <div className="flex gap-2">
                                <select
                                    name="month"
                                    value={formData.month || new Date().getMonth() + 1}
                                    onChange={handleChange}
                                    className="w-1/2 mt-1 p-2 bg-white border border-[#DFE1E6] rounded-md text-black focus:outline-none focus:ring-2 focus:ring-[#0052CC]"
                                >
                                    {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                                        <option key={m} value={m}>{`Tháng ${m.toString().padStart(2, '0')}`}</option>
                                    ))}
                                </select>
                                <select
                                    name="year"
                                    value={formData.year || new Date().getFullYear()}
                                    onChange={handleChange}
                                    className="w-1/2 mt-1 p-2 bg-white border border-[#DFE1E6] rounded-md text-black focus:outline-none focus:ring-2 focus:ring-[#0052CC]"
                                >
                                    {yearsOptions(new Date().getFullYear()).map(y => (
                                        <option key={y} value={y}>{y}</option>
                                    ))}
                                </select>
                            </div>
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
                            <label className="block text-sm font-medium" style={{color: '#000'}}>Priority</label>
                            <select
                                name="priority"
                                value={formData.priority || Priority.No}
                                onChange={handleChange}
                                className="w-full mt-1 p-2 bg-white border border-[#DFE1E6] rounded-md text-black focus:outline-none focus:ring-2 focus:ring-[#0052CC]"
                            >
                                <option value={Priority.No}>No</option>
                                <option value={Priority.Yes}>Yes</option>
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
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-medium" style={{color: '#000'}}>Estimated Hours</label>
                                <input
                                    type="number"
                                    name="estimatedHours"
                                    min={0}
                                    step="0.1"
                                    value={formData.estimatedHours ?? 0}
                                    onChange={handleChange}
                                    className="w-full mt-1 p-2 bg-white border border-[#DFE1E6] rounded-md text-black focus:outline-none focus:ring-2 focus:ring-[#0052CC]"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium" style={{color: '#000'}}>Actual Hours</label>
                                <input
                                    type="number"
                                    name="actualHours"
                                    min={0}
                                    step="0.1"
                                    value={formData.actualHours ?? 0}
                                    onChange={handleChange}
                                    className="w-full mt-1 p-2 bg-white border border-[#DFE1E6] rounded-md text-black focus:outline-none focus:ring-2 focus:ring-[#0052CC]"
                                />
                            </div>
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
                        <div>
                            <label className="block text-sm font-medium" style={{color: '#000'}}>Complete Date</label>
                            <input
                                type="date"
                                name="completeDate"
                                value={formData.completeDate || ''}
                                onChange={handleChange}
                                className="w-full mt-1 p-2 bg-white border border-[#DFE1E6] rounded-md text-black focus:outline-none focus:ring-2 focus:ring-[#0052CC]"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium" style={{color: '#000'}}>Assign Resources (On Duty)</label>
                            <div className="mt-2 max-h-48 overflow-y-auto space-y-2 p-2 bg-white border border-[#DFE1E6] rounded-md">
                                {onDutyResources.length === 0 && (
                                    <p className="text-sm text-[#5E6C84]">No on-duty resources available.</p>
                                )}
                                {onDutyResources.map(resource => {
                                    const checked = (formData.assignedResourceIds || []).includes(resource.id);
                                    return (
                                        <label key={resource.id} className="flex items-center gap-2 text-sm text-[#172B4D]">
                                            <input
                                                type="checkbox"
                                                checked={checked}
                                                onChange={() => handleResourceToggle(resource.id)}
                                            />
                                            <span>{resource.name} - {resource.role}</span>
                                        </label>
                                    );
                                })}
                            </div>
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
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium" style={{color: '#000'}}>Estimated Hours</label>
                            <input
                                type="number"
                                name="estimatedHours"
                                min={0}
                                step="0.1"
                                value={formData.estimatedHours ?? 0}
                                onChange={handleChange}
                                className="w-full mt-1 p-2 bg-white border border-[#DFE1E6] rounded-md text-black focus:outline-none focus:ring-2 focus:ring-[#0052CC]"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium" style={{color: '#000'}}>Actual Hours</label>
                            <input
                                type="number"
                                name="actualHours"
                                min={0}
                                step="0.1"
                                value={formData.actualHours ?? 0}
                                onChange={handleChange}
                                className="w-full mt-1 p-2 bg-white border border-[#DFE1E6] rounded-md text-black focus:outline-none focus:ring-2 focus:ring-[#0052CC]"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium" style={{color: '#000'}}>Priority</label>
                        <select
                            name="priority"
                            value={formData.priority || Priority.No}
                            onChange={handleChange}
                            className="w-full mt-1 p-2 bg-white border border-[#DFE1E6] rounded-md text-black focus:outline-none focus:ring-2 focus:ring-[#0052CC]"
                        >
                            <option value={Priority.No}>No</option>
                            <option value={Priority.Yes}>Yes</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium" style={{color: '#000'}}>Month / Year</label>
                        <div className="flex gap-2">
                            <select
                                name="month"
                                value={formData.month || new Date().getMonth() + 1}
                                onChange={handleChange}
                                className="w-1/2 mt-1 p-2 bg-white border border-[#DFE1E6] rounded-md text-black focus:outline-none focus:ring-2 focus:ring-[#0052CC]"
                            >
                                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                                    <option key={m} value={m}>{`Tháng ${m.toString().padStart(2, '0')}`}</option>
                                ))}
                            </select>
                            <select
                                name="year"
                                value={formData.year || new Date().getFullYear()}
                                onChange={handleChange}
                                className="w-1/2 mt-1 p-2 bg-white border border-[#DFE1E6] rounded-md text-black focus:outline-none focus:ring-2 focus:ring-[#0052CC]"
                            >
                                {yearsOptions(new Date().getFullYear()).map(y => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium" style={{color: '#000'}}>Complete Date</label>
                        <input
                            type="date"
                            name="completeDate"
                            value={formData.completeDate || ''}
                            onChange={handleChange}
                            className="w-full mt-1 p-2 bg-white border border-[#DFE1E6] rounded-md text-black focus:outline-none focus:ring-2 focus:ring-[#0052CC]"
                        />
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
