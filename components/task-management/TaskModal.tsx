import React, { useState, useEffect } from 'react';
import { Task, Sprint } from '../../types';
import Modal from '../ui/Modal';
import TaskForm from '../shared/TaskForm';

interface TaskModalProps {
  task: Task;
  sprints: Sprint[];
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (task: Task) => void;
}

const TaskModal: React.FC<TaskModalProps> = ({ task, sprints, isOpen, onClose, onUpdate }) => {
  const handleTaskUpdate = (updatedTask: Task) => {
    onUpdate(updatedTask);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Edit Task: ${task.taskId}`} size="4xl">
      <TaskForm 
        initialData={task} 
        sprints={sprints} 
        onTaskUpdated={handleTaskUpdate}
      />
    </Modal>
  );
};

export default TaskModal;