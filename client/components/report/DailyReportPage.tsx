import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { reportsApi } from '../../api';
import { Status, Task } from '../../types';

type SnapshotTask = {
  id: number;
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
        <TaskTable tasks={snapshot.reportTasks} resourceNameById={resourceNameById} />
      </div>

      <div className="rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-sm">
        <h3 className="text-base font-semibold text-[var(--color-text)] mb-2">Activities Looking Ahead (Next day task)</h3>
        <TaskTable tasks={snapshot.nextdayTasks} resourceNameById={resourceNameById} showPlannedDash />
      </div>
    </div>
  );
};

const TaskTable = ({ tasks, resourceNameById, showPlannedDash = false }: { tasks: SnapshotTask[]; resourceNameById: Record<string, string>; showPlannedDash?: boolean }) => {
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
          </tr>
        </thead>
        <tbody>
          {tasks.length === 0 && (
            <tr><td colSpan={6} className="px-3 py-3 text-center text-[var(--color-text-muted)]">No data</td></tr>
          )}
          {tasks.map((t, idx) => (
            <tr key={`${t.id}-${idx}`} className="border-t border-[var(--color-border)] align-top">
              <td className="px-3 py-2">{idx + 1}</td>
              <td className="px-3 py-2 font-medium text-[var(--color-text)] whitespace-nowrap">{t.title || t.id}</td>
              <td className="px-3 py-2 text-[var(--color-text-muted)]">{t.description || '—'}</td>
              <td className="px-3 py-2">{showPlannedDash ? '—' : `${t.completionPercent ?? 0}%`}</td>
              <td className="px-3 py-2">{t.priority || 'MEDIUM'}</td>
              <td className="px-3 py-2 text-[var(--color-text-muted)]">
                {Array.isArray(t.assignedResourceIds) && t.assignedResourceIds.length > 0
                  ? t.assignedResourceIds
                      .map((id) => resourceNameById[id] || id)
                      .join(', ')
                  : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DailyReportPage;
