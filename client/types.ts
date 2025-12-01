
export enum Status {
  ToDo = 'To Do',
  InProgress = 'In Progress',
  Done = 'Done',
}

export enum Priority {
  Yes = 'Yes',
  No = 'No',
}

export enum DutyStatus {
  OnDuty = 'On Duty',
  OffDuty = 'Off Duty',
}

export interface Resource {
  id: string;
  name: string;
  role: 'SUPV' | 'ENG';
  status: DutyStatus;
  site: 'PQP_HT' | 'MT1';
}

export interface Task {
  id: string;
  taskId: string;
  description: string;
  status: Status;
  priority: Priority;
  createdAt: string;
  sprintId: string | null;
  year: number;
  month: number; // 1-12
  startDate: string;
  comments: string;
  completionPercent: number;
  completeDate: string | null;
  assignedResourceIds: string[];
  estimatedHours: number;
  actualHours: number;
}

export interface Sprint {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
}

export interface AppData {
  tasks: Task[];
  sprints: Sprint[];
  resources?: Resource[];
}
