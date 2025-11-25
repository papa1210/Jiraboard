import React from 'react';
import { Task } from '../../types';

interface TaskCardProps {
    task: Task;
    onClick: () => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onClick }) => {

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
        e.dataTransfer.setData('taskId', task.id);
        e.currentTarget.style.opacity = '0.4';
        e.currentTarget.style.transform = 'rotate(2deg)';
        e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.3)';
    };

    const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
        e.currentTarget.style.opacity = '1';
        e.currentTarget.style.transform = '';
        e.currentTarget.style.boxShadow = '';
    };

    return (
        <div
            draggable
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onClick={onClick}
            className="bg-white rounded-md p-4 shadow-sm cursor-pointer hover:bg-[#DEEBFF] transition-all duration-200 transform hover:-translate-y-1 border border-[#DFE1E6]"
        >
            <p className="font-semibold text-[#172B4D] mb-2">{task.taskId}</p>
            <p className="text-sm text-[#5E6C84] line-clamp-2">{task.description}</p>
            <div className="mt-3 text-xs text-[#5E6C84]">
                <p>Start Date: {task.startDate ? new Date(task.startDate).toLocaleDateString() : 'Not set'}</p>
            </div>
        </div>
    );
};

export default TaskCard;