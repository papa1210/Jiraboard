import React from 'react';
import { Task, Priority } from '../../types';

interface TaskCardProps {
    task: Task;
    onClick: () => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onClick }) => {
    const assignedCount = task.assignedResourceIds?.length ?? 0;

    const renderResourceIndicator = () => {
        if (!assignedCount) return null;
        return (
            <div className="flex items-center gap-1 text-[#5E6C84]" title="Assigned resources">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                    <path d="M16 11c1.657 0 3-1.79 3-4s-1.343-4-3-4-3 1.79-3 4 1.343 4 3 4Zm-8 0c1.657 0 3-1.79 3-4S9.657 3 8 3 5 4.79 5 7s1.343 4 3 4Zm0 2c-2.21 0-6 1.114-6 3.333V20h12v-3.667C14 14.114 10.21 13 8 13Zm8 0c-.29 0-.607.017-.944.045 1.16.795 1.944 1.96 1.944 3.621V20h6v-3.333C23 14.114 19.21 13 16 13Z" />
                </svg>
                <span className="text-xs font-semibold">{assignedCount}</span>
            </div>
        );
    };

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
            <div className="flex items-start gap-2 mb-2">
                <p className="font-semibold text-[#172B4D] flex-1">{task.taskId}</p>
                <div className="flex items-center gap-2">
                    {renderResourceIndicator()}
                    {task.priority === Priority.Yes && (
                        <span title="Priority" className="text-[#FF5630]">
                            !
                        </span>
                    )}
                </div>
            </div>
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
