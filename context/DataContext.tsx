
import React, { createContext, useState, useEffect, useContext, ReactNode, useCallback } from 'react';
import { Task, Sprint, Status, AppData } from '../types';

interface DataContextType {
  tasks: Task[];
  sprints: Sprint[];
  addTask: (taskData: Omit<Task, 'id' | 'createdAt' | 'startDate' | 'status' | 'comments' | 'completionPercent' | 'completeDate'> & { sprintId: string | null, completionPercent?: number }) => void;
  updateTask: (taskId: string, updatedData: Partial<Task>) => void;
  deleteTask: (taskId:string) => void;
  addSprint: (sprintData: Omit<Sprint, 'id'>) => Sprint;
  getTasksForSprint: (sprintId: string | null) => Task[];
  getBacklogTasks: () => Task[];
  importData: (data: AppData) => void;
  exportData: () => AppData;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const getInitialState = <T,>(key: string, fallback: T): T => {
  try {
    const item = window.localStorage.getItem(key);
    if (!item) return fallback;
    
    const parsed = JSON.parse(item);

    // Simple migration for tasks to add comments/completionPercent field if missing
    if (key === 'tasks' && Array.isArray(parsed)) {
        return parsed.map((task: any) => ({
            ...task,
            comments: task.comments || '',
            completionPercent: typeof task.completionPercent === 'number' 
              ? Math.min(100, Math.max(0, task.completionPercent)) 
              : 0,
            completeDate: task.completeDate ?? null,
        })) as T;
    }
    return parsed;
  } catch (error) {
    console.error(`Error reading from localStorage key "${key}":`, error);
    return fallback;
  }
};

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<Task[]>(() => getInitialState<Task[]>('tasks', []));
  const [sprints, setSprints] = useState<Sprint[]>(() => getInitialState<Sprint[]>('sprints', []));

  useEffect(() => {
    try {
      window.localStorage.setItem('tasks', JSON.stringify(tasks));
    } catch (error) {
      console.error('Error writing tasks to localStorage:', error);
    }
  }, [tasks]);

  useEffect(() => {
    try {
      window.localStorage.setItem('sprints', JSON.stringify(sprints));
    } catch (error) {
      console.error('Error writing sprints to localStorage:', error);
    }
  }, [sprints]);

  const addTask = useCallback((taskData: Omit<Task, 'id' | 'createdAt' | 'startDate' | 'status' | 'comments' | 'completionPercent' | 'completeDate'> & { sprintId: string | null, completionPercent?: number }) => {
    const now = new Date().toISOString();
    const completionPercent = Math.min(100, Math.max(0, taskData.completionPercent ?? 0));
    const completionDate = completionPercent >= 100 ? now.split('T')[0] : null;
    const newTask: Task = {
      id: `task-${Date.now()}`,
      createdAt: now,
      startDate: now.split('T')[0],
      status: completionPercent >= 100 ? Status.Done : Status.ToDo,
      comments: '',
      completionPercent,
      completeDate: completionDate,
      ...taskData,
    };
    setTasks(prev => [...prev, newTask]);
  }, []);

  const updateTask = useCallback((taskId: string, updatedData: Partial<Task>) => {
    setTasks(prev => prev.map(task => {
      if (task.id !== taskId) return task;
      const completionPercent = updatedData.completionPercent !== undefined
        ? Math.min(100, Math.max(0, updatedData.completionPercent))
        : task.completionPercent;
      const statusProvided = updatedData.status !== undefined;
      const nextStatus = statusProvided
        ? (updatedData.status as Status)
        : (completionPercent >= 100 ? Status.Done : task.status);
      const isNowDone = nextStatus === Status.Done;
      const completeDate = isNowDone
        ? (updatedData.completeDate ?? task.completeDate ?? new Date().toISOString().split('T')[0])
        : (updatedData.completeDate ?? null);
      return { ...task, ...updatedData, completionPercent, status: nextStatus, completeDate };
    }));
  }, []);

  const deleteTask = useCallback((taskId: string) => {
    setTasks(prev => prev.filter(task => task.id !== taskId));
  }, []);

  const addSprint = useCallback((sprintData: Omit<Sprint, 'id'>) => {
    const newSprint: Sprint = {
      id: `sprint-${Date.now()}`,
      ...sprintData,
    };
    setSprints(prev => [...prev, newSprint].sort((a,b) => a.name.localeCompare(b.name)));
    return newSprint;
  }, []);

  const getTasksForSprint = useCallback((sprintId: string | null) => {
    if (!sprintId) return [];
    return tasks.filter(task => task.sprintId === sprintId);
  }, [tasks]);

  const getBacklogTasks = useCallback(() => {
    return tasks.filter(task => !task.sprintId);
  }, [tasks]);

  const importData = useCallback((data: AppData) => {
    if (data.tasks && Array.isArray(data.tasks) && data.sprints && Array.isArray(data.sprints)) {
      setTasks(data.tasks);
      setSprints(data.sprints);
    } else {
      throw new Error("Invalid data format");
    }
  }, []);

  const exportData = useCallback((): AppData => {
    return { tasks, sprints };
  }, [tasks, sprints]);

  return (
    <DataContext.Provider value={{ tasks, sprints, addTask, updateTask, deleteTask, addSprint, getTasksForSprint, getBacklogTasks, importData, exportData }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = (): DataContextType => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
