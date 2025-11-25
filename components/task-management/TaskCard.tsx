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
            <div className="mt-3 text-xs text-[#5E6C84] flex items-center justify-between gap-4">
                <p>Start Date: {task.startDate ? new Date(task.startDate).toLocaleDateString() : 'Not set'}</p>
                <p className="ml-auto text-right">Complete Date: {task.completeDate ? new Date(task.completeDate).toLocaleDateString() : 'Not set'}</p>
            </div>
            <div className="mt-3">
                <div className="flex justify-between text-xs text-[#5E6C84] mb-1">
                    <span>Progress</span>
                    <span>{Math.round(task.completionPercent ?? 0)}%</span>
                </div>
                <div className="w-full bg-[#F4F5F7] rounded-full h-2 border border-[#DFE1E6]">
                    <div
                        className="h-2 rounded-full bg-[#0052CC] transition-all duration-200"
                        style={{ width: `${Math.min(100, Math.max(0, task.completionPercent ?? 0))}%` }}
                    />
                </div>
            </div>
        </div>
    );
};

export default TaskCard;
