import React from 'react';
import { Task } from '../../types';
import Modal from '../ui/Modal';
import TaskForm from '../shared/TaskForm';

interface TaskModalProps {
  task: Task;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (task: Task) => void;
}

const TaskModal: React.FC<TaskModalProps> = ({ task, isOpen, onClose, onUpdate }) => {
  const handleTaskUpdate = (updatedTask: Task) => {
    onUpdate(updatedTask);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Edit Task: ${task.taskId}`} size="4xl" closeOnBackdrop={false}>
      <TaskForm 
        initialData={task} 
        onTaskUpdated={handleTaskUpdate}
      />
    </Modal>
  );
};

export default TaskModal;
