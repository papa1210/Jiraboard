const API_BASE = import.meta.env.VITE_API_URL;

let authToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
};

const withAuthHeaders = (headers: HeadersInit = {}) => {
  return authToken ? { ...headers, Authorization: `Bearer ${authToken}` } : headers;
};

const request = async (path: string, options: RequestInit = {}) => {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: withAuthHeaders({
      "Content-Type": "application/json",
      ...(options.headers || {}),
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `API error ${res.status}`);
  }
  return res.json();
};

export const authApi = {
  login: (username: string, password: string) =>
    request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),
  register: (username: string, password: string) =>
    request("/auth/register", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),
  changePassword: (currentPassword: string, newPassword: string) =>
    request("/auth/change-password", {
      method: "POST",
      body: JSON.stringify({ currentPassword, newPassword }),
    }),
};

export const projectsApi = {
  list: () => request("/projects"),
  create: (data: { name: string; key: string; description?: string }) =>
    request("/projects", { method: "POST", body: JSON.stringify(data) }),
};

export const tasksApi = {
  list: (projectId?: number) =>
    request(projectId ? `/tasks?projectId=${projectId}` : "/tasks"),
  create: (data: {
    title: string;
    description?: string;
    projectId: number;
    assigneeId?: number | null;
    status?: string;
    priority?: string;
    dueDate?: string | null;
    sprintId?: number | null;
    startDate?: string | null;
    completeDate?: string | null;
    completionPercent?: number;
    comments?: string;
    assignedResourceIds?: string[];
    estimatedHours?: number;
    actualHours?: number;
  }) => request("/tasks", { method: "POST", body: JSON.stringify(data) }),
  update: (id: number, data: any) =>
    request(`/tasks/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  remove: (id: number) => request(`/tasks/${id}`, { method: "DELETE" }),
};

export const commentsApi = {
  list: (taskId: number) => request(`/tasks/${taskId}/comments`),
  add: (taskId: number, body: string) =>
    request(`/tasks/${taskId}/comments`, {
      method: "POST",
      body: JSON.stringify({ body }),
    }),
};

export const sprintsApi = {
  list: (projectId: number) => request(`/projects/${projectId}/sprints`),
  create: (projectId: number, data: { name: string; startDate?: string | null; endDate?: string | null }) =>
    request(`/projects/${projectId}/sprints`, { method: "POST", body: JSON.stringify(data) }),
  update: (id: number, data: { name?: string; startDate?: string | null; endDate?: string | null }) =>
    request(`/sprints/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  remove: (id: number) => request(`/sprints/${id}`, { method: "DELETE" }),
};

export const resourcesApi = {
  list: () => request("/resources"),
  create: (data: { username: string; role: 'SUPV' | 'ENG'; status?: string }) =>
    request("/resources", { method: "POST", body: JSON.stringify(data) }),
  update: (id: number, data: { role?: 'SUPV' | 'ENG'; status?: string }) =>
    request(`/resources/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  remove: (id: number) => request(`/resources/${id}`, { method: "DELETE" }),
};

export const permissionsApi = {
  get: () => request("/permissions"),
  update: (data: Record<string, any>) => request("/permissions", { method: "PUT", body: JSON.stringify(data) }),
};

export const reportsApi = {
  headcount: (month: string) => request(`/reports/headcount?month=${month}`),
};
