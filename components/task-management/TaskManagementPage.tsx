
import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { Sprint } from '../../types';
import KanbanBoard from './KanbanBoard';
import Modal from '../ui/Modal';
import TaskForm from '../shared/TaskForm';

const TaskManagementPage: React.FC = () => {
    const { sprints, addSprint } = useData();
    const [selectedSprintId, setSelectedSprintId] = useState<string | null>(sprints[0]?.id || null);
    const [isSprintModalOpen, setSprintModalOpen] = useState(false);
    const [isCreateTaskModalOpen, setCreateTaskModalOpen] = useState(false);
    const [newSprintYear, setNewSprintYear] = useState(new Date().getFullYear());

    const sortedSprints = useMemo(() => {
        return [...sprints].sort((a, b) => b.name.localeCompare(a.name));
    }, [sprints]);
    
    if (selectedSprintId === null && sortedSprints.length > 0) {
        setSelectedSprintId(sortedSprints[0].id);
    }

    const handleCreateSprint = () => {
        const sprintNumber = sprints.filter(s => s.name.startsWith(String(newSprintYear))).length + 1;
        const sprintName = `${newSprintYear}-Sprint-${String(sprintNumber).padStart(2, '0')}`;
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(startDate.getDate() + 21); // 3 weeks

        const newSprint = addSprint({
            name: sprintName,
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0],
        });
        setSelectedSprintId(newSprint.id);
        setSprintModalOpen(false);
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                <h1 className="text-3xl font-bold text-text-primary">Task Management</h1>
                <div className="flex items-center gap-4">
                    <select
                        value={selectedSprintId || ''}
                        onChange={(e) => setSelectedSprintId(e.target.value)}
                        className="p-2 bg-white border border-[#DFE1E6] rounded-md text-[#172B4D] focus:outline-none focus:ring-2 focus:ring-[#0052CC]"
                    >
                        {sortedSprints.map((sprint: Sprint) => (
                            <option key={sprint.id} value={sprint.id}>{sprint.name}</option>
                        ))}
                         {sortedSprints.length === 0 && <option disabled>No Sprints Available</option>}
                    </select>
                    <button
                        onClick={() => setCreateTaskModalOpen(true)}
                        className="bg-accent-green hover:bg-opacity-90 text-white font-bold py-2 px-4 rounded-md transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
                        disabled={!selectedSprintId}
                    >
                        Create Task
                    </button>
                    <button
                        onClick={() => setSprintModalOpen(true)}
                        className="bg-accent-blue hover:bg-primary text-white font-bold py-2 px-4 rounded-md transition-colors"
                    >
                        Create Sprint
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
            
            <Modal isOpen={isSprintModalOpen} onClose={() => setSprintModalOpen(false)} title="Create New Sprint">
                <div className="space-y-4 bg-white p-4 rounded-md">
                    <label htmlFor="sprintYear" className="block text-sm font-medium" style={{color: '#000'}}>Sprint Year</label>
                    <input
                        id="sprintYear"
                        type="number"
                        value={newSprintYear}
                        onChange={(e) => setNewSprintYear(parseInt(e.target.value))}
                        className="w-full p-2 bg-white border border-[#DFE1E6] rounded-md text-black focus:outline-none focus:ring-2 focus:ring-[#0052CC]"
                    />
                    <p className="text-sm" style={{color: '#000'}}>
                        A new sprint will be created for the year {newSprintYear}. 
                        The name will be automatically generated (e.g., {newSprintYear}-Sprint-XX).
                        The duration will be set to 3 weeks from today.
                    </p>
                    <div className="flex justify-end gap-4 mt-6">
                        <button onClick={() => setSprintModalOpen(false)} className="bg-secondary hover:bg-opacity-80 text-white font-bold py-2 px-4 rounded-md">Cancel</button>
                        <button onClick={handleCreateSprint} className="bg-accent-blue hover:bg-primary text-white font-bold py-2 px-4 rounded-md">Create</button>
                    </div>
                </div>
            </Modal>

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
