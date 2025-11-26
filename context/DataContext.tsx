
import React, { createContext, useState, useEffect, useContext, ReactNode, useCallback } from 'react';
import { Task, Sprint, Status, AppData, Priority, Resource, DutyStatus } from '../types';

interface DataContextType {
  tasks: Task[];
  sprints: Sprint[];
  resources: Resource[];
  addTask: (taskData: Omit<Task, 'id' | 'createdAt' | 'startDate' | 'status' | 'comments' | 'completionPercent' | 'completeDate' | 'assignedResourceIds'> & { sprintId: string | null, completionPercent?: number, priority?: Priority, assignedResourceIds?: string[] }) => void;
  updateTask: (taskId: string, updatedData: Partial<Task>) => void;
  deleteTask: (taskId:string) => void;
  addSprint: (sprintData: Omit<Sprint, 'id'>) => Sprint;
  deleteSprint: (sprintId: string) => void;
  getTasksForSprint: (sprintId: string | null) => Task[];
  getBacklogTasks: () => Task[];
  addResource: (resourceData: Omit<Resource, 'id' | 'status'> & { status?: DutyStatus }) => Resource;
  updateResource: (resourceId: string, updatedData: Partial<Resource>) => void;
  deleteResource: (resourceId: string) => void;
  importData: (data: AppData) => void;
  exportData: () => AppData;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const sanitizeResources = (raw: any[]): Resource[] => {
  return raw
    .map((resource, index) => {
      const name = typeof resource?.name === 'string' ? resource.name : '';
      const role = typeof resource?.role === 'string' ? resource.role : '';
      const id = typeof resource?.id === 'string' ? resource.id : `resource-${Date.now()}-${index}`;
      const status = resource?.status === DutyStatus.OffDuty ? DutyStatus.OffDuty : DutyStatus.OnDuty;
      return { id, name, role, status };
    })
    .filter(resource => resource.name && resource.role);
};

const getInitialState = <T,>(key: string, fallback: T): T => {
  try {
    const item = window.localStorage.getItem(key);
    if (!item) return fallback;
    
    const parsed = JSON.parse(item);

    // Simple migration for tasks to add comments/completionPercent/priority field if missing
    if (key === 'tasks' && Array.isArray(parsed)) {
        return parsed.map((task: any) => ({
            ...task,
            comments: task.comments || '',
            completionPercent: typeof task.completionPercent === 'number' 
              ? Math.min(100, Math.max(0, task.completionPercent)) 
              : 0,
            completeDate: task.completeDate ?? null,
            priority: task.priority === Priority.Yes ? Priority.Yes : Priority.No,
            assignedResourceIds: Array.isArray(task.assignedResourceIds) ? task.assignedResourceIds : [],
        })) as T;
    }
    if (key === 'resources' && Array.isArray(parsed)) {
        return sanitizeResources(parsed) as T;
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
  const [resources, setResources] = useState<Resource[]>(() => getInitialState<Resource[]>('resources', []));

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

  useEffect(() => {
    try {
      window.localStorage.setItem('resources', JSON.stringify(resources));
    } catch (error) {
      console.error('Error writing resources to localStorage:', error);
    }
  }, [resources]);

  const addTask = useCallback((taskData: Omit<Task, 'id' | 'createdAt' | 'startDate' | 'status' | 'comments' | 'completionPercent' | 'completeDate' | 'assignedResourceIds'> & { sprintId: string | null, completionPercent?: number, priority?: Priority, assignedResourceIds?: string[] }) => {
    const now = new Date().toISOString();
    const completionPercent = Math.min(100, Math.max(0, taskData.completionPercent ?? 0));
    const completionDate = completionPercent >= 100 ? now.split('T')[0] : null;
    const safeAssigned = Array.isArray(taskData.assignedResourceIds) ? taskData.assignedResourceIds : [];
    const newTask: Task = {
      id: `task-${Date.now()}`,
      createdAt: now,
      startDate: now.split('T')[0],
      status: completionPercent >= 100 ? Status.Done : Status.ToDo,
      comments: '',
      completionPercent,
      completeDate: completionDate,
      priority: taskData.priority ?? Priority.No,
      assignedResourceIds: safeAssigned,
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
      const nextPriority = updatedData.priority ?? task.priority ?? Priority.No;
      const assignedResourceIds = Array.isArray(updatedData.assignedResourceIds)
        ? updatedData.assignedResourceIds
        : (task.assignedResourceIds ?? []);
      return { ...task, ...updatedData, completionPercent, status: nextStatus, completeDate, priority: nextPriority, assignedResourceIds };
    }));
  }, []);

  const deleteTask = useCallback((taskId: string) => {
    setTasks(prev => prev.filter(task => task.id !== taskId));
  }, []);

  const addResource = useCallback((resourceData: Omit<Resource, 'id' | 'status'> & { status?: DutyStatus }) => {
    const newResource: Resource = {
      id: `resource-${Date.now()}`,
      name: resourceData.name.trim(),
      role: resourceData.role.trim(),
      status: resourceData.status ?? DutyStatus.OnDuty,
    };
    setResources(prev => [...prev, newResource]);
    return newResource;
  }, []);

  const updateResource = useCallback((resourceId: string, updatedData: Partial<Resource>) => {
    setResources(prev => prev.map(resource => {
      if (resource.id !== resourceId) return resource;
      const nextStatus = updatedData.status ?? resource.status;
      return {
        ...resource,
        ...updatedData,
        name: updatedData.name !== undefined ? updatedData.name.trim() : resource.name,
        role: updatedData.role !== undefined ? updatedData.role.trim() : resource.role,
        status: nextStatus,
      };
    }));
    if (updatedData.status === DutyStatus.OffDuty) {
      setTasks(prev => prev.map(task => {
        if (!task.assignedResourceIds?.includes(resourceId)) return task;
        return { ...task, assignedResourceIds: task.assignedResourceIds.filter(id => id !== resourceId) };
      }));
    }
  }, []);

  const deleteResource = useCallback((resourceId: string) => {
    setResources(prev => prev.filter(resource => resource.id !== resourceId));
  }, []);

  const addSprint = useCallback((sprintData: Omit<Sprint, 'id'>) => {
    const newSprint: Sprint = {
      id: `sprint-${Date.now()}`,
      ...sprintData,
    };
    setSprints(prev => [...prev, newSprint].sort((a,b) => a.name.localeCompare(b.name)));
    return newSprint;
  }, []);

  const deleteSprint = useCallback((sprintId: string) => {
    setSprints(prev => prev.filter(s => s.id !== sprintId));
    setTasks(prev => prev.map(task => task.sprintId === sprintId ? { ...task, sprintId: null } : task));
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
      if (data.resources && Array.isArray(data.resources)) {
        setResources(sanitizeResources(data.resources));
      } else {
        setResources([]);
      }
    } else {
      throw new Error("Invalid data format");
    }
  }, []);

  const exportData = useCallback((): AppData => {
    return { tasks, sprints, resources };
  }, [tasks, sprints, resources]);

  return (
    <DataContext.Provider value={{ tasks, sprints, resources, addTask, updateTask, deleteTask, addSprint, deleteSprint, getTasksForSprint, getBacklogTasks, addResource, updateResource, deleteResource, importData, exportData }}>
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
