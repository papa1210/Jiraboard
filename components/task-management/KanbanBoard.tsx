
import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { KANBAN_COLUMNS } from '../../constants';
import { Status, Task } from '../../types';
import KanbanColumn from './KanbanColumn';
import TaskModal from './TaskModal';

interface KanbanBoardProps {
    sprintId: string;
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({ sprintId }) => {
    const { getTasksForSprint, updateTask, sprints } = useData();
    const [editingTask, setEditingTask] = useState<Task | null>(null);

    const tasks = getTasksForSprint(sprintId);

    const handleDrop = (taskId: string, newStatus: Status) => {
        if (newStatus === Status.Done) {
            updateTask(taskId, { status: Status.Done, completionPercent: 100 });
        } else {
            updateTask(taskId, { status: newStatus, completeDate: null });
        }
    };

    const handleTaskClick = (task: Task) => {
        setEditingTask(task);
    };

    return (
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6">
            {KANBAN_COLUMNS.map(status => (
                <KanbanColumn
                    key={status}
                    status={status}
                    tasks={tasks.filter(t => t.status === status)}
                    onDrop={handleDrop}
                    onTaskClick={handleTaskClick}
                />
            ))}
            {editingTask && (
                <TaskModal
                    task={editingTask}
                    isOpen={!!editingTask}
                    onClose={() => setEditingTask(null)}
                    sprints={sprints}
                    onUpdate={(updatedTask) => updateTask(updatedTask.id, updatedTask)}
                />
            )}
        </div>
    );
};

export default KanbanBoard;
