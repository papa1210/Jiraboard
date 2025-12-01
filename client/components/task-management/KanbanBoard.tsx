
import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { KANBAN_COLUMNS } from '../../constants';
import { Status, Task, Priority } from '../../types';
import KanbanColumn from './KanbanColumn';
import TaskModal from './TaskModal';

interface KanbanBoardProps {
    year: number;
    month: number;
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({ year, month }) => {
    const { getTasksForMonth, updateTask } = useData();
    const [editingTask, setEditingTask] = useState<Task | null>(null);

    const tasks = getTasksForMonth(year, month);

    const sortTasks = (list: Task[]) => {
        return [...list].sort((a, b) => {
            if (a.priority === b.priority) return 0;
            return a.priority === Priority.Yes ? -1 : 1;
        });
    };

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
                    tasks={sortTasks(tasks.filter(t => t.status === status))}
                    onDrop={handleDrop}
                    onTaskClick={handleTaskClick}
                />
            ))}
            {editingTask && (
                <TaskModal
                    task={editingTask}
                    isOpen={!!editingTask}
                    onClose={() => setEditingTask(null)}
                    onUpdate={(updatedTask) => updateTask(updatedTask.id, updatedTask)}
                />
            )}
        </div>
    );
};

export default KanbanBoard;
