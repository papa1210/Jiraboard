
export enum Status {
  ToDo = 'To Do',
  InProgress = 'In Progress',
  Done = 'Done',
}

export interface Task {
  id: string;
  taskId: string;
  description: string;
  status: Status;
  createdAt: string;
  sprintId: string | null;
  startDate: string;
  comments: string;
  completionPercent: number;
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
}
