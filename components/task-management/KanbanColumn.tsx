import React, { useState } from 'react';
import { Status, Task } from '../../types';
import TaskCard from './TaskCard';

interface KanbanColumnProps {
    status: Status;
    tasks: Task[];
    onDrop: (taskId: string, newStatus: Status) => void;
    onTaskClick: (task: Task) => void;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({ status, tasks, onDrop, onTaskClick }) => {
    const [isOver, setIsOver] = useState(false);

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsOver(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        setIsOver(false);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        const taskId = e.dataTransfer.getData('taskId');
        onDrop(taskId, status);
        setIsOver(false);
    };

    const statusColors = {
        [Status.ToDo]: 'border-t-[#FFAB00]',
        [Status.InProgress]: 'border-t-[#0052CC]',
        [Status.Done]: 'border-t-[#36B37E]',
    };

    return (
        <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`flex flex-col bg-[#F4F5F7] rounded-lg shadow-md transition-all duration-200 border-2 border-dashed ${isOver ? 'bg-[#DEEBFF] border-[#0052CC]' : 'border-transparent'}`}
        >
            <div className={`p-4 border-t-4 ${statusColors[status]} rounded-t-lg bg-white`}>
                <h3 className="font-bold text-lg text-[#172B4D]">{status} <span className="text-sm font-normal text-[#5E6C84]">{tasks.length}</span></h3>
            </div>
            <div className="p-4 flex-1 overflow-y-auto space-y-4">
                {tasks.map(task => (
                    <TaskCard key={task.id} task={task} onClick={() => onTaskClick(task)} />
                ))}
                {tasks.length === 0 && (
                    <div className="text-center py-10 text-[#5E6C84] text-sm">
                        <p>Drop tasks here</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default KanbanColumn;