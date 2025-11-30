
import React, { createContext, useState, useEffect, useContext, ReactNode, useCallback } from 'react';
import { Task, Sprint, Status, AppData, Priority, Resource, DutyStatus } from '../types';
import { authApi, projectsApi, tasksApi, sprintsApi, resourcesApi, setAuthToken } from '../api';

interface DataContextType {
  tasks: Task[];
  sprints: Sprint[];
  resources: Resource[];
  projects: { id: number; name: string; key: string }[];
  currentProjectId: number | null;
  setCurrentProjectId: (id: number | null) => void;
  userEmail: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  currentUserRole: 'SUPV' | 'ENG' | null;
  login: (username: string, password: string) => Promise<void>;
  createUser: (username: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  logout: () => void;
  refreshData: () => Promise<void>;
  addTask: (taskData: Omit<Task, 'id' | 'createdAt' | 'startDate' | 'status' | 'comments' | 'completionPercent' | 'completeDate' | 'assignedResourceIds'> & { sprintId: string | null, completionPercent?: number, priority?: Priority, assignedResourceIds?: string[] }) => Promise<void>;
  updateTask: (taskId: string, updatedData: Partial<Task>) => Promise<void>;
  deleteTask: (taskId:string) => Promise<void>;
  addSprint: (sprintData: Omit<Sprint, 'id'>) => Sprint;
  deleteSprint: (sprintId: string) => void;
  getTasksForSprint: (sprintId: string | null) => Task[];
  getBacklogTasks: () => Task[];
  addResource: (resourceData: Omit<Resource, 'id' | 'status'> & { status?: DutyStatus }) => Promise<Resource>;
  updateResource: (resourceId: string, updatedData: Partial<Resource>) => Promise<void>;
  deleteResource: (resourceId: string) => Promise<void>;
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

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [resources, setResources] = useState<Resource[]>(() => {
    return [];
  });
  const [projects, setProjects] = useState<{ id: number; name: string; key: string }[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<number | null>(null);
  const [token, setTokenState] = useState<string | null>(() => window.localStorage.getItem('token'));
  const [userEmail, setUserEmail] = useState<string | null>(() => window.localStorage.getItem('userEmail'));
  const [isAdmin, setIsAdmin] = useState<boolean>(() => window.localStorage.getItem('isAdmin') === 'true');
  const [currentUserRole, setCurrentUserRole] = useState<'SUPV' | 'ENG' | null>(() => {
    const stored = window.localStorage.getItem('userRole');
    return stored === 'SUPV' || stored === 'ENG' ? stored : null;
  });

  useEffect(() => {
    setAuthToken(token || null);
  }, [token]);

  const mapStatusFromApi = useCallback((status: string): Status => {
    switch (status) {
      case 'IN_PROGRESS':
        return Status.InProgress;
      case 'REVIEW':
        return Status.InProgress;
      case 'DONE':
        return Status.Done;
      case 'BLOCKED':
        return Status.InProgress;
      default:
        return Status.ToDo;
    }
  }, []);

  const mapStatusToApi = useCallback((status: Status): string => {
    switch (status) {
      case Status.InProgress:
        return 'IN_PROGRESS';
      case Status.Done:
        return 'DONE';
      default:
        return 'TODO';
    }
  }, []);

  const mapTaskFromApi = useCallback((apiTask: any): Task => {
    const created = apiTask.createdAt ? new Date(apiTask.createdAt).toISOString() : new Date().toISOString();
    const isDone = apiTask.status === 'DONE';
    return {
      id: String(apiTask.id),
      taskId: apiTask.title || `TASK-${apiTask.id}`,
      description: apiTask.description || '',
      status: mapStatusFromApi(apiTask.status),
      priority: apiTask.priority ? Priority.Yes : Priority.No,
      createdAt: created,
      sprintId: apiTask.sprintId ? String(apiTask.sprintId) : null,
      startDate: apiTask.startDate ? new Date(apiTask.startDate).toISOString().split('T')[0] : created.split('T')[0],
      comments: apiTask.notes || '',
      completionPercent: typeof apiTask.completionPercent === 'number' ? apiTask.completionPercent : (isDone ? 100 : 0),
      completeDate: apiTask.completeDate ? new Date(apiTask.completeDate).toISOString().split('T')[0] : (isDone ? (apiTask.updatedAt ? new Date(apiTask.updatedAt).toISOString().split('T')[0] : null) : null),
      assignedResourceIds: Array.isArray(apiTask.assignedResourceIds) ? apiTask.assignedResourceIds.map(String) : [],
    };
  }, [mapStatusFromApi]);

  const refreshData = useCallback(async () => {
    if (!token) return;
    try {
      let proj = await projectsApi.list();
      if (!Array.isArray(proj)) proj = [];

      // Ensure a default Backlog project exists so sprint creation always has a project target.
      if (proj.length === 0) {
        const keyBase = (userEmail || 'BACKLOG').toUpperCase().replace(/[^A-Z0-9]/g, '') || 'BACKLOG';
        const key = `${keyBase.slice(0, 8)}-BACKLOG`;
        try {
          const created = await projectsApi.create({ name: 'Backlog', key, description: 'Default backlog project' });
          proj = [created];
        } catch (err) {
          console.error('Failed to create default Backlog project', err);
          // Retry with a unique suffix to avoid key collisions.
          const fallbackKey = `${keyBase.slice(0, 5)}-BL-${Date.now().toString().slice(-4)}`;
          try {
            const created = await projectsApi.create({ name: 'Backlog', key: fallbackKey, description: 'Default backlog project' });
            proj = [created];
          } catch (fallbackErr) {
            console.error('Failed to create fallback Backlog project', fallbackErr);
          }
        }
      }

      setProjects(proj);
      const selectedProjectId = currentProjectId ?? proj[0]?.id ?? null;
      if (!currentProjectId && proj[0]) {
        setCurrentProjectId(proj[0].id);
      }

      const [taskList, sprintList, resourceList] = await Promise.all([
        tasksApi.list(selectedProjectId || undefined),
        selectedProjectId ? sprintsApi.list(selectedProjectId) : Promise.resolve([]),
        resourcesApi.list(),
      ]);
      setTasks(Array.isArray(taskList) ? taskList.map(mapTaskFromApi) : []);
      setSprints(Array.isArray(sprintList) ? sprintList.map((s: any) => ({
        id: String(s.id),
        name: s.name,
        startDate: s.startDate ? new Date(s.startDate).toISOString().split('T')[0] : '',
        endDate: s.endDate ? new Date(s.endDate).toISOString().split('T')[0] : '',
      })) : []);
      const nonAdminResources = Array.isArray(resourceList)
        ? resourceList.filter((r: any) => !r.isAdmin) // hide admin from resource pool/counts
        : [];
      setResources(nonAdminResources.map((r: any) => ({
        id: String(r.id),
        name: r.username,
        role: r.role === 'SUPV' ? 'SUPV' : 'ENG',
        status: r.status === 'OFF_DUTY' ? DutyStatus.OffDuty : DutyStatus.OnDuty,
        site: r.site === 'MT1' ? 'MT1' : 'PQP_HT',
      })));
    } catch (error) {
      console.error('Error loading data from API', error);
    }
  }, [token, currentProjectId, mapTaskFromApi, userEmail]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const login = useCallback(async (username: string, password: string) => {
    const res = await authApi.login(username, password);
    setTokenState(res.token);
    setUserEmail(res.user?.username || username);
    setIsAdmin(Boolean(res.user?.isAdmin));
    const roleValue = res.user?.role === 'SUPV' ? 'SUPV' : 'ENG';
    setCurrentUserRole(roleValue);
    window.localStorage.setItem('token', res.token);
    window.localStorage.setItem('userEmail', res.user?.username || username);
    window.localStorage.setItem('isAdmin', String(Boolean(res.user?.isAdmin)));
    window.localStorage.setItem('userRole', roleValue);
    setAuthToken(res.token);
    await refreshData();
  }, [refreshData]);

  const createUser = useCallback(async (username: string) => {
    await fetch(`${import.meta.env.VITE_API_URL}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ username }),
    }).then(async res => {
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Create user failed');
      }
    });
  }, [token]);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    await authApi.changePassword(currentPassword, newPassword);
  }, []);

  const logout = useCallback(() => {
    setTokenState(null);
    setUserEmail(null);
    setIsAdmin(false);
    setCurrentUserRole(null);
    setTasks([]);
    setProjects([]);
    setCurrentProjectId(null);
    window.localStorage.removeItem('token');
    window.localStorage.removeItem('userEmail');
    window.localStorage.removeItem('isAdmin');
    window.localStorage.removeItem('userRole');
    setAuthToken(null);
  }, []);

  const addTask = useCallback(
    async (taskData: Omit<Task, 'id' | 'createdAt' | 'startDate' | 'status' | 'comments' | 'completionPercent' | 'completeDate' | 'assignedResourceIds'> & { sprintId: string | null, completionPercent?: number, priority?: Priority, assignedResourceIds?: string[] }) => {
      if (!currentProjectId) {
        throw new Error('No project selected');
      }
    const newTask = await tasksApi.create({
      title: taskData.taskId,
      description: taskData.description,
      projectId: currentProjectId,
      sprintId: taskData.sprintId ? Number(taskData.sprintId) : null,
      status: mapStatusToApi(Status.ToDo),
      priority: taskData.priority === Priority.Yes ? 'HIGH' : 'MEDIUM',
      startDate: taskData.startDate || null,
      completeDate: taskData.completeDate || null,
      completionPercent: taskData.completionPercent ?? 0,
      comments: taskData.comments || '',
      assignedResourceIds: taskData.assignedResourceIds ?? [],
    });
    const mapped = mapTaskFromApi(newTask);
    const merged: Task = {
      ...mapped,
      sprintId: taskData.sprintId ?? mapped.sprintId,
      completionPercent: taskData.completionPercent ?? mapped.completionPercent ?? 0,
      completeDate: taskData.completeDate ?? mapped.completeDate ?? null,
      startDate: taskData.startDate ?? mapped.startDate,
      comments: taskData.comments ?? mapped.comments ?? '',
      assignedResourceIds: taskData.assignedResourceIds ?? mapped.assignedResourceIds ?? [],
      priority: taskData.priority ?? mapped.priority,
    };
    setTasks(prev => [merged, ...prev]);
  },
  [currentProjectId, mapStatusToApi, mapTaskFromApi]
  );

  const updateTask = useCallback(async (taskId: string, updatedData: Partial<Task>) => {
    const apiPayload: any = {};
    if (updatedData.taskId) apiPayload.title = updatedData.taskId;
    if (updatedData.description !== undefined) apiPayload.description = updatedData.description;
    if (updatedData.status !== undefined) apiPayload.status = mapStatusToApi(updatedData.status);
    if (updatedData.priority !== undefined) apiPayload.priority = updatedData.priority === Priority.Yes ? 'HIGH' : 'MEDIUM';
    if (updatedData.sprintId !== undefined) apiPayload.sprintId = updatedData.sprintId ? Number(updatedData.sprintId) : null;
    if (updatedData.startDate !== undefined) apiPayload.startDate = updatedData.startDate || null;
    if (updatedData.completeDate !== undefined) apiPayload.completeDate = updatedData.completeDate || null;
    if (updatedData.completionPercent !== undefined) apiPayload.completionPercent = updatedData.completionPercent;
    if (updatedData.comments !== undefined) apiPayload.comments = updatedData.comments;
    if (updatedData.assignedResourceIds !== undefined) apiPayload.assignedResourceIds = updatedData.assignedResourceIds;
    const updated = await tasksApi.update(Number(taskId), apiPayload);
    setTasks(prev =>
      prev.map(task => {
        if (task.id !== taskId) return task;
        const mapped = mapTaskFromApi(updated);
        return {
          ...task,
          ...mapped,
          sprintId: updatedData.sprintId ?? mapped.sprintId ?? task.sprintId ?? null,
          comments: updatedData.comments ?? task.comments ?? '',
          completionPercent: updatedData.completionPercent ?? task.completionPercent ?? mapped.completionPercent ?? 0,
          completeDate: updatedData.completeDate ?? task.completeDate ?? mapped.completeDate ?? null,
          startDate: updatedData.startDate ?? task.startDate ?? mapped.startDate,
          assignedResourceIds: updatedData.assignedResourceIds ?? task.assignedResourceIds ?? mapped.assignedResourceIds ?? [],
          priority: updatedData.priority ?? mapped.priority ?? task.priority,
          status: updatedData.status ?? mapped.status ?? task.status,
        };
      })
    );
  }, [mapStatusToApi, mapTaskFromApi]);

  const deleteTask = useCallback(async (taskId: string) => {
    await tasksApi.remove(Number(taskId));
    setTasks(prev => prev.filter(task => task.id !== taskId));
  }, []);

  const addResource = useCallback(async (resourceData: Omit<Resource, 'id' | 'status'> & { status?: DutyStatus }) => {
    const payload = {
      username: resourceData.name.trim(),
      role: resourceData.role === 'SUPV' ? 'SUPV' : 'ENG',
      status: resourceData.status === DutyStatus.OffDuty ? 'OFF_DUTY' : 'ON_DUTY',
      site: resourceData.site === 'MT1' ? 'MT1' : 'PQP_HT',
    };
    const created = await resourcesApi.create(payload);
    const newResource: Resource = {
      id: String((created as any).id),
      name: (created as any).username || (created as any).name || resourceData.name,
      role: (created as any).role === 'SUPV' ? 'SUPV' : 'ENG',
      status: (created as any).status === 'OFF_DUTY' ? DutyStatus.OffDuty : DutyStatus.OnDuty,
      site: (created as any).site === 'MT1' ? 'MT1' : (resourceData.site || 'PQP_HT'),
    };
    setResources(prev => [...prev, newResource]);
    return newResource;
  }, []);

  const updateResource = useCallback(async (resourceId: string, updatedData: Partial<Resource>) => {
    const payload: any = {};
    if (updatedData.role !== undefined) payload.role = updatedData.role === 'SUPV' ? 'SUPV' : 'ENG';
    if (updatedData.status !== undefined) payload.status = updatedData.status === DutyStatus.OffDuty ? 'OFF_DUTY' : 'ON_DUTY';
    if (updatedData.site !== undefined) payload.site = updatedData.site === 'MT1' ? 'MT1' : 'PQP_HT';
    const numericId = Number(resourceId);
    if (!Number.isNaN(numericId)) {
      await resourcesApi.update(numericId, payload);
    }
    setResources(prev => prev.map(resource => {
      if (resource.id !== resourceId) return resource;
      const nextStatus = updatedData.status ?? resource.status;
      return {
        ...resource,
        ...updatedData,
        name: updatedData.name !== undefined ? updatedData.name.trim() : resource.name,
        role: updatedData.role !== undefined ? updatedData.role.trim() : resource.role,
        status: nextStatus,
        site: updatedData.site ?? resource.site,
      };
    }));
    if (updatedData.status === DutyStatus.OffDuty) {
      setTasks(prev => prev.map(task => {
        if (!task.assignedResourceIds?.includes(resourceId)) return task;
        return { ...task, assignedResourceIds: task.assignedResourceIds.filter(id => id !== resourceId) };
      }));
    }
  }, []);

  const deleteResource = useCallback(async (resourceId: string) => {
    setResources(prev => prev.filter(resource => resource.id !== resourceId));
    setTasks(prev => prev.map(task => ({
      ...task,
      assignedResourceIds: task.assignedResourceIds.filter(id => id !== resourceId),
    })));
    const numericId = Number(resourceId);
    if (!Number.isNaN(numericId)) {
      await resourcesApi.remove(numericId);
    }
  }, []);

  const addSprint = useCallback((sprintData: Omit<Sprint, 'id'>) => {
    if (!currentProjectId) {
      throw new Error('No project selected');
    }
    const payload = {
      name: sprintData.name,
      startDate: sprintData.startDate || null,
      endDate: sprintData.endDate || null,
    };
    // Fire and forget; the caller should handle errors if needed
    sprintsApi.create(currentProjectId, payload).then((created: any) => {
      const newSprint: Sprint = {
        id: String(created.id),
        name: created.name,
        startDate: created.startDate ? new Date(created.startDate).toISOString().split('T')[0] : '',
        endDate: created.endDate ? new Date(created.endDate).toISOString().split('T')[0] : '',
      };
      setSprints(prev => [...prev, newSprint].sort((a,b) => a.name.localeCompare(b.name)));
    }).catch(err => console.error('Failed to create sprint', err));
    return { id: `temp-${Date.now()}`, ...sprintData };
  }, [currentProjectId]);

  const deleteSprint = useCallback((sprintId: string) => {
    setSprints(prev => prev.filter(s => s.id !== sprintId));
    setTasks(prev => prev.map(task => task.sprintId === sprintId ? { ...task, sprintId: null } : task));
    const numericId = Number(sprintId);
    if (!Number.isNaN(numericId)) {
      sprintsApi.remove(numericId).catch(err => console.error('Failed to delete sprint', err));
    }
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

  const isAuthenticated = Boolean(token);

  return (
    <DataContext.Provider
      value={{
        tasks,
        sprints,
        resources,
        projects,
        currentProjectId,
        setCurrentProjectId,
        userEmail,
        isAuthenticated,
        isAdmin,
        currentUserRole,
        login,
        logout,
        createUser,
        changePassword,
        refreshData,
        addTask,
        updateTask,
        deleteTask,
        addSprint,
        deleteSprint,
        getTasksForSprint,
        getBacklogTasks,
        addResource,
        updateResource,
        deleteResource,
        importData,
        exportData,
      }}
    >
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
