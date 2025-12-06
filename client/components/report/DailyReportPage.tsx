import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { reportsApi } from '../../api';
import { Status, Task } from '../../types';

type SnapshotTask = {
  id: number | string;
  title: string;
  description: string;
  completionPercent: number | null;
  priority: string;
  assignedResourceIds: string[];
};

const DailyReportPage: React.FC = () => {
  const todayStr = new Date().toISOString().split('T')[0];
  const { resources, isAuthenticated } = useData();
  const STORAGE_KEY = 'daily-report-date';
  const [date, setDate] = useState<string>(todayStr);
  const [loading, setLoading] = useState(false);
  const [snapshot, setSnapshot] = useState<{ date: string; reportTasks: SnapshotTask[]; nextdayTasks: SnapshotTask[]; generatedAt?: string | null; generatedById?: number | null }>({
    date: todayStr,
    reportTasks: [],
    nextdayTasks: [],
    generatedAt: null,
    generatedById: null,
  });
  const [newTaskId, setNewTaskId] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [lookupState, setLookupState] = useState<{ loading: boolean; found: boolean | null }>({ loading: false, found: null });
  const [savingTask, setSavingTask] = useState(false);

  const fetchSnapshot = async (target: string) => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const data = await reportsApi.dailyGet(target);
      setSnapshot({
        date: data.date,
        reportTasks: Array.isArray(data.reportTasks) ? data.reportTasks : [],
        nextdayTasks: Array.isArray(data.nextdayTasks) ? data.nextdayTasks : [],
        generatedAt: data.createdAt || null,
        generatedById: data.generatedById || null,
      });
    } catch (err) {
      console.error('Failed to load daily report', err);
      setSnapshot({ date: target, reportTasks: [], nextdayTasks: [], generatedAt: null, generatedById: null });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && /^\d{4}-\d{2}-\d{2}$/.test(saved)) {
      setDate(saved);
    }
  }, []);

  useEffect(() => {
    if (!date) return;
    localStorage.setItem(STORAGE_KEY, date);
    fetchSnapshot(date);
  }, [date, isAuthenticated]);

  const resourceNameById = useMemo(() => {
    const map: Record<string, string> = {};
    resources.forEach((r) => {
      map[r.id] = r.name;
    });
    return map;
  }, [resources]);

  const isToday = date === todayStr;

  const handleGenerate = async () => {
    if (!isToday) return;
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const data = await reportsApi.dailyGenerate(date);
      setSnapshot({
        date: data.date,
        reportTasks: Array.isArray(data.reportTasks) ? data.reportTasks : [],
        nextdayTasks: Array.isArray(data.nextdayTasks) ? data.nextdayTasks : [],
        generatedAt: data.createdAt || null,
        generatedById: data.generatedById || null,
      });
    } catch (err) {
      console.error('Generate daily report failed', err);
      alert('Generate failed, please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onDutyPersonnel = useMemo(() => {
    return resources.filter(r => r.status === 'On Duty' || r.status === 'OnDuty' || r.status === 'On Duty');
  }, [resources]);

  const handleLookup = useMemo(() => {
    let timer: number | undefined;
    return (value: string) => {
      const trimmed = value.trim();
      if (timer) window.clearTimeout(timer);
      if (!trimmed) {
        setLookupState({ loading: false, found: null });
        setNewTaskDescription('');
        return;
      }
      timer = window.setTimeout(async () => {
        setLookupState({ loading: true, found: null });
        try {
          const res = await reportsApi.dailyLookupTask(trimmed);
          if (res?.found && res.task) {
            setNewTaskDescription(res.task.description || '');
            setLookupState({ loading: false, found: true });
          } else {
            setNewTaskDescription('');
            setLookupState({ loading: false, found: false });
          }
        } catch (err) {
          console.error('Lookup task failed', err);
          setLookupState({ loading: false, found: null });
        }
      }, 300);
    };
  }, []);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskId.trim() || !date || !isAuthenticated) return;
    setSavingTask(true);
    try {
      const res = await reportsApi.dailyAddTask({ date, taskKey: newTaskId.trim(), description: newTaskDescription.trim() || undefined });
      const snap = res.snapshot || res;
      setSnapshot({
        date: snap.date,
        reportTasks: Array.isArray(snap.reportTasks) ? snap.reportTasks : [],
        nextdayTasks: Array.isArray(snap.nextdayTasks) ? snap.nextdayTasks : [],
        generatedAt: snap.createdAt || null,
        generatedById: snap.generatedById || null,
      });
      setNewTaskId('');
      setNewTaskDescription('');
      setLookupState({ loading: false, found: null });
    } catch (err) {
      console.error('Add task to daily report failed', err);
      alert('Add task failed. Please try again.');
    } finally {
      setSavingTask(false);
    }
  };

  const handleRemoveTask = async (taskId: number | string) => {
    if (!date || !isAuthenticated) return;
    setSavingTask(true);
    try {
      const res = await reportsApi.dailyRemoveTask({ date, taskId });
      const snap = res.snapshot || res;
      setSnapshot({
        date: snap.date,
        reportTasks: Array.isArray(snap.reportTasks) ? snap.reportTasks : [],
        nextdayTasks: Array.isArray(snap.nextdayTasks) ? snap.nextdayTasks : [],
        generatedAt: snap.createdAt || null,
        generatedById: snap.generatedById || null,
      });
    } catch (err) {
      console.error('Remove task from daily report failed', err);
      alert('Remove task failed. Please try again.');
    } finally {
      setSavingTask(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-sm text-[var(--color-text-muted)]">Daily Report</p>
          <h1 className="text-2xl font-bold text-[var(--color-text)]">Báo cáo ngày</h1>
          <p className="text-sm text-[var(--color-text-muted)]">
            Preview daily report và generate snapshot (Report task / Next day task). Export Excel sẽ bổ sung sau.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Link
            to="/reports"
            className="rounded-lg border border-[var(--color-border)] bg-white px-4 py-2 text-[var(--color-text)] hover:border-[var(--color-primary)] transition-colors"
          >
            Back to Reports
          </Link>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-lg border border-[var(--color-border)] bg-white px-3 py-2 text-[var(--color-text)]"
          />
          <button
            onClick={handleGenerate}
            disabled={loading || !isToday}
            className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-white font-semibold hover:bg-[var(--color-primary-hover)] transition-colors disabled:opacity-60"
          >
            {loading ? 'Processing...' : 'Generate Daily Report'}
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-sm">
          <h3 className="text-lg font-semibold text-[var(--color-text)]">Personnel (On duty)</h3>
          <div className="overflow-auto max-h-64">
            <table className="min-w-full text-sm">
              <thead className="bg-[var(--color-surface-muted)] text-[var(--color-text-muted)] sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold">#</th>
                  <th className="px-3 py-2 text-left font-semibold">Name</th>
                  <th className="px-3 py-2 text-left font-semibold">Title</th>
                  <th className="px-3 py-2 text-left font-semibold">Assignment</th>
                </tr>
              </thead>
              <tbody>
                {onDutyPersonnel.length === 0 && (
                  <tr><td colSpan={4} className="px-3 py-3 text-center text-[var(--color-text-muted)]">No on-duty personnel.</td></tr>
                )}
                {onDutyPersonnel.map((p, idx) => (
                  <tr key={p.id} className="border-t border-[var(--color-border)]">
                    <td className="px-3 py-2">{idx + 1}</td>
                    <td className="px-3 py-2">{p.name}</td>
                    <td className="px-3 py-2">{p.role}</td>
                    <td className="px-3 py-2">{p.site}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-sm">
          <h3 className="text-lg font-semibold text-[var(--color-text)]">Snapshot</h3>
          <p className="text-sm text-[var(--color-text-muted)]">Ngày: {snapshot.date || date}</p>
          <p className="text-sm text-[var(--color-text-muted)]">Generated at: {snapshot.generatedAt ? new Date(snapshot.generatedAt).toLocaleString() : '—'}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-sm">
        <h3 className="text-base font-semibold text-[var(--color-text)] mb-2">Activities Last 24 Hours (Report task)</h3>
        <form onSubmit={handleAddTask} className="mb-3 flex flex-col gap-2 md:flex-row md:items-end">
          <div className="flex-1">
            <label className="block text-sm text-[var(--color-text-muted)] mb-1">Task ID</label>
            <input
              type="text"
              value={newTaskId}
              onChange={(e) => {
                setNewTaskId(e.target.value);
                handleLookup(e.target.value);
              }}
              className="w-full rounded-lg border border-[var(--color-border)] bg-white px-3 py-2 text-[var(--color-text)]"
              placeholder="e.g. P13463365"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm text-[var(--color-text-muted)] mb-1">Task Description</label>
            <input
              type="text"
              value={newTaskDescription}
              onChange={(e) => setNewTaskDescription(e.target.value)}
              className="w-full rounded-lg border border-[var(--color-border)] bg-white px-3 py-2 text-[var(--color-text)]"
              placeholder="Auto-filled if task exists"
            />
          </div>
          <button
            type="submit"
            disabled={savingTask || !newTaskId.trim()}
            className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-white font-semibold hover:bg-[var(--color-primary-hover)] transition-colors disabled:opacity-60"
          >
            {savingTask ? 'Saving...' : 'Add task'}
          </button>
        </form>
        <TaskTable tasks={snapshot.reportTasks} resourceNameById={resourceNameById} onRemove={handleRemoveTask} />
      </div>

      <div className="rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-sm">
        <h3 className="text-base font-semibold text-[var(--color-text)] mb-2">Activities Looking Ahead (Next day task)</h3>
        <TaskTable tasks={snapshot.nextdayTasks} resourceNameById={resourceNameById} showPlannedDash />
      </div>
    </div>
  );
};

const TaskTable = ({
  tasks,
  resourceNameById,
  showPlannedDash = false,
  onRemove,
}: {
  tasks: SnapshotTask[];
  resourceNameById: Record<string, string>;
  showPlannedDash?: boolean;
  onRemove?: (taskId: number | string) => void;
}) => {
  return (
    <div className="overflow-auto max-h-[70vh]">
      <table className="min-w-full text-sm">
        <thead className="bg-[var(--color-surface-muted)] text-[var(--color-text-muted)] sticky top-0">
          <tr>
            <th className="px-3 py-2 text-left font-semibold">#</th>
            <th className="px-3 py-2 text-left font-semibold">Task</th>
            <th className="px-3 py-2 text-left font-semibold">Description</th>
            <th className="px-3 py-2 text-left font-semibold">% complete</th>
            <th className="px-3 py-2 text-left font-semibold">Priority</th>
            <th className="px-3 py-2 text-left font-semibold">Assignees</th>
            {onRemove && <th className="px-3 py-2 text-left font-semibold">Action</th>}
          </tr>
        </thead>
        <tbody>
          {tasks.length === 0 && (
            <tr><td colSpan={onRemove ? 7 : 6} className="px-3 py-3 text-center text-[var(--color-text-muted)]">No data</td></tr>
          )}
          {tasks.map((t, idx) => (
            <tr key={`${t.id}-${idx}`} className="border-t border-[var(--color-border)] align-top">
              <td className="px-3 py-2">{idx + 1}</td>
              <td className="px-3 py-2 font-medium text-[var(--color-text)] whitespace-nowrap">{t.title || t.id}</td>
              <td className="px-3 py-2 text-[var(--color-text-muted)]">{t.description || 'N/A'}</td>
              <td className="px-3 py-2">{showPlannedDash ? 'N/A' : `${t.completionPercent ?? 0}%`}</td>
              <td className="px-3 py-2">{t.priority || 'MEDIUM'}</td>
              <td className="px-3 py-2 text-[var(--color-text-muted)]">
                {Array.isArray(t.assignedResourceIds) && t.assignedResourceIds.length > 0
                  ? t.assignedResourceIds
                      .map((id) => resourceNameById[id] || id)
                      .join(', ')
                  : 'N/A'}
              </td>
              {onRemove && (
                <td className="px-3 py-2">
                  <button
                    onClick={() => onRemove(t.id)}
                    className="text-[var(--color-primary)] hover:underline"
                  >
                    Remove
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DailyReportPage;
