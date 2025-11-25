
export enum Status {
  ToDo = 'To Do',
  InProgress = 'In Progress',
  Done = 'Done',
}

export enum Priority {
  Yes = 'Yes',
  No = 'No',
}

export interface Task {
  id: string;
  taskId: string;
  description: string;
  status: Status;
  priority: Priority;
  createdAt: string;
  sprintId: string | null;
  startDate: string;
  comments: string;
  completionPercent: number;
  completeDate: string | null;
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
