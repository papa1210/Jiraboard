# Copilot Instructions for AI Agents

## Project Overview
This is a Vite-based React TypeScript app that implements a Jira-like task manager with Kanban board, backlog, and sprint management. Data is persisted in browser localStorage. The app is structured for modularity and extensibility, with clear separation of concerns.

## Architecture & Data Flow
- **State Management:**
  - All task and sprint data is managed via React Context (`context/DataContext.tsx`).
  - Data is persisted to localStorage and loaded on app start. Migration logic ensures backward compatibility for new fields.
  - Use the `useData` hook for all CRUD operations on tasks and sprints.
- **Core Types:**
  - Defined in `types.ts` (`Task`, `Sprint`, `Status`, `AppData`).
  - Tasks have fields: `id`, `taskId`, `description`, `status`, `createdAt`, `sprintId`, `startDate`, `comments`.
- **Kanban Board:**
  - Implemented in `components/task-management/KanbanBoard.tsx`.
  - Columns are defined by `KANBAN_COLUMNS` in `constants.ts` and mapped to `Status` enum.
  - Drag-and-drop and status updates are handled via context methods.
- **Task Modal & Form:**
  - Editing/creating tasks uses `TaskModal.tsx` and `TaskForm.tsx`.
  - Task creation only requires `taskId`, `description`, and (optionally) `sprintId`.
  - Editing exposes all fields, including comments and status.

## Developer Workflows
- **Local Development:**
  - Install dependencies: `npm install`
  - Set `GEMINI_API_KEY` in `.env.local` (see `vite.config.ts` for usage)
  - Start dev server: `npm run dev` (default port 3000)
- **Build & Preview:**
  - Build: `npm run build`
  - Preview: `npm run preview`
- **No formal test suite or backend integration is present.**

## Conventions & Patterns
- **File Structure:**
  - Components are grouped by feature in `components/` (e.g., `task-management/`, `backlog/`, `dashboard/`).
  - Shared UI and forms are in `components/shared/` and `components/ui/`.
- **TypeScript:**
  - Uses strict typing and enums for status values.
  - Path alias `@/` maps to project root (see `tsconfig.json`).
- **Data Migration:**
  - When reading tasks from localStorage, missing fields (e.g., `comments`) are auto-filled for compatibility.
- **Environment Variables:**
  - `GEMINI_API_KEY` is injected via Vite config and available as `process.env.GEMINI_API_KEY`.

## Integration Points
- **External Libraries:**
  - React, React DOM, React Router DOM, Recharts (for charts, if used)
  - Vite for build/dev
- **No backend/API calls; all data is local.**

## Example Patterns
- To add a new task:
  ```tsx
  const { addTask } = useData();
  addTask({ taskId: 'T-123', description: 'New task', sprintId: null });
  ```
- To update a task status:
  ```tsx
  const { updateTask } = useData();
  updateTask(taskId, { status: Status.Done });
  ```

## Key Files
- `context/DataContext.tsx` — Data/state management
- `types.ts` — Core types
- `components/task-management/` — Kanban board and task UI
- `constants.ts` — Kanban columns/status
- `vite.config.ts` — Environment variable setup

---
**If any conventions or workflows are unclear, please ask for clarification or provide feedback to improve these instructions.**
