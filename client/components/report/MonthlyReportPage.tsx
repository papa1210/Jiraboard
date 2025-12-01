import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ResponsiveContainer, LineChart as ReLineChart, Line as ReLine, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { useData } from '../../context/DataContext';
import { Priority, Status } from '../../types';
import { reportsApi } from '../../api';

const formatMonthInput = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  return `${year}-${month}`;
};

const normalizeMonth = (value: string | null | undefined) => {
  if (!value) return formatMonthInput(new Date());
  const match = /^(\d{4})-(\d{2})$/.exec(value);
  if (!match) return formatMonthInput(new Date());
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (month < 1 || month > 12 || year < 1970 || year > 2100) return formatMonthInput(new Date());
  return `${match[1]}-${match[2]}`;
};

const MonthlyReportPage: React.FC = () => {
  const navigate = useNavigate();
  const [month, setMonth] = useState<string>(() => {
    try {
      const stored = window.localStorage.getItem('monthly-report-month');
      return normalizeMonth(stored || undefined);
    } catch (err) {
      console.warn('Failed to read month selection', err);
      return formatMonthInput(new Date());
    }
  });
  const { getTasksForMonth } = useData();
  const [headcount, setHeadcount] = useState<{ labels: string[]; sites: { site: string; series: number[] }[] }>({ labels: [], sites: [] });
  const [loadingHeadcount, setLoadingHeadcount] = useState(false);

  useEffect(() => {
    const fetchHeadcount = async () => {
      setLoadingHeadcount(true);
      try {
        const data = await reportsApi.headcount(month);
        setHeadcount({ labels: data.labels || [], sites: Array.isArray(data.sites) ? data.sites : [] });
      } catch (err) {
        console.error('Failed to load headcount', err);
        setHeadcount({ labels: [], sites: [] });
      } finally {
        setLoadingHeadcount(false);
      }
    };
    fetchHeadcount();
  }, [month]);

  useEffect(() => {
    try {
      const normalized = normalizeMonth(month);
      setMonth(normalized);
      window.localStorage.setItem('monthly-report-month', normalized);
    } catch (err) {
      console.warn('Failed to persist month selection', err);
    }
  }, [month]);

  const title = useMemo(() => {
    if (!month) return 'Monthly report';
    const [y, m] = month.split('-');
    return `Monthly report ${m}/${y}`;
  }, [month]);

  const parsed = useMemo(() => {
    const [y, m] = normalizeMonth(month).split('-').map(Number);
    if (!y || !m) {
      const d = new Date();
      return { year: d.getFullYear(), month: d.getMonth() + 1 };
    }
    return { year: y, month: m };
  }, [month]);

  const monthlyTasks = useMemo(() => getTasksForMonth(parsed.year, parsed.month), [getTasksForMonth, parsed]);

  const daysInMonth = useMemo(() => {
    const { year, month: m } = parsed;
    return new Date(year, m, 0).getDate();
  }, [parsed]);

  // Burndown/Burnup calculation copied from dashboard
  const chartData = useMemo(() => {
    const dayCount = daysInMonth || 0;
    if (dayCount === 0) return [];

    const days = Array.from({ length: dayCount }, (_, i) => i + 1);
    const monthLabel = String(parsed.month).padStart(2, '0');

    const scopePoints = monthlyTasks.reduce((sum, t) => {
      const pts = typeof t.estimatedHours === 'number' && t.estimatedHours > 0 ? t.estimatedHours : 1;
      return sum + pts;
    }, 0);

    const completedByDay = Array.from({ length: dayCount }, () => 0);
    monthlyTasks.forEach(t => {
      const workDateStr = t.completeDate || t.startDate || t.createdAt;
      const workDate = workDateStr ? new Date(workDateStr) : null;
      if (!workDate || Number.isNaN(workDate.getTime())) return;
      if (workDate.getFullYear() !== parsed.year || workDate.getMonth() + 1 !== parsed.month) return;
      const day = workDate.getDate();
      if (day < 1 || day > dayCount) return;
      const actual = typeof t.actualHours === 'number' && t.actualHours > 0 ? t.actualHours : 0;
      completedByDay[day - 1] += actual;
    });

    const cumulativeCompleted: number[] = [];
    completedByDay.reduce((acc, curr, idx) => {
      const next = acc + curr;
      cumulativeCompleted[idx] = next;
      return next;
    }, 0);

    const idealPerDay = scopePoints / Math.max(dayCount, 1);

    return days.map((day, idx) => {
      const dayLabel = `${monthLabel}/${String(day).padStart(2, '0')}`;
      const completed = Math.min(cumulativeCompleted[idx] || 0, scopePoints);
      const remaining = Math.max(scopePoints - completed, 0);
      const idealRemaining = Math.max(scopePoints - idealPerDay * (idx + 1), 0);
      return {
        day: dayLabel,
        remaining,
        idealRemaining,
        completed,
        scope: scopePoints,
      };
    });
  }, [monthlyTasks, parsed, daysInMonth]);

  const headcountCharts = useMemo(() => {
    return headcount.sites.map(site => {
      const data = headcount.labels.map((label: string, idx: number) => {
        const series = Array.isArray(site.series) ? site.series : [];
        const count = series[idx] ?? 0;
        const dayLabel = label.includes('-') ? label.slice(5) : label;
        return { day: dayLabel, count };
      });
      return { site: site.site, data };
    });
  }, [headcount]);

  const summary = useMemo(() => {
    const total = monthlyTasks.length;
    const done = monthlyTasks.filter(t => t.status === Status.Done).length;
    const inProgress = monthlyTasks.filter(t => t.status === Status.InProgress).length;
    const todo = monthlyTasks.filter(t => t.status === Status.ToDo).length;
    const priorityYes = monthlyTasks.filter(t => t.priority === Priority.Yes).length;
    const donePct = total > 0 ? Math.round((done / total) * 100) : 0;
    return { total, done, inProgress, todo, priorityYes, donePct };
  }, [monthlyTasks]);

  const statusSegments = useMemo(() => {
    const segments = [
      { label: 'To Do', value: summary.todo, color: '#94a3b8' },
      { label: 'In Progress', value: summary.inProgress, color: '#f59e0b' },
      { label: 'Done', value: summary.done, color: '#22c55e' },
    ];
    const total = segments.reduce((acc, s) => acc + s.value, 0) || 1;
    let acc = 0;
    const stops = segments.map(seg => {
      const start = (acc / total) * 100;
      acc += seg.value;
      const end = (acc / total) * 100;
      return `${seg.color} ${start}% ${end}%`;
    });
    return { segments, gradient: stops.join(', ') };
  }, [summary]);

  const handleBack = () => navigate('/reports');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <button
            onClick={handleBack}
            className="text-sm text-[var(--color-primary)] hover:text-[var(--color-primary-hover)]"
          >
            ← Back to Reports
          </button>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">Monthly report</p>
          <h1 className="text-2xl font-bold text-[var(--color-text)]">{title}</h1>
          <p className="text-sm text-[var(--color-text-muted)]">
            Burndown/Burnup per month, headcount variation, and progress preview. Export will be enabled later.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="rounded-lg border border-[var(--color-border)] bg-white px-3 py-2 text-[var(--color-text)]"
          />
          <button className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-white font-semibold hover:bg-[var(--color-primary-hover)] transition-colors">
            Export
          </button>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <PlaceholderCard title="Total tasks" value={String(summary.total)} />
            <PlaceholderCard title="Done %" value={`${summary.donePct}%`} />
            <PlaceholderCard title="In progress" value={String(summary.inProgress)} />
            <PlaceholderCard title="Priority (Yes)" value={String(summary.priorityYes)} />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <ChartCard title="Status ratio" subtitle="To Do / In Progress / Done">
              <StatusDonut summary={summary} statusSegments={statusSegments.segments} />
            </ChartCard>
            <ChartCard title="Headcount variation" subtitle="ON duty at 23:59 each day">
              {headcountCharts.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-sm text-[var(--color-text-muted)]">
                  {loadingHeadcount ? 'Loading...' : 'No headcount data'}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {headcountCharts.map(({ site, data }) => (
                    <div key={site} className="h-32">
                      <ResponsiveContainer width="100%" height="100%">
                        <ReLineChart data={data}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                          <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                          <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                          <Tooltip />
                          <Legend />
                          <ReLine type="monotone" dataKey="count" stroke="#8b5cf6" strokeWidth={2} dot={false} name={`Headcount ${site}`} />
                        </ReLineChart>
                      </ResponsiveContainer>
                    </div>
                  ))}
                </div>
              )}
            </ChartCard>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <ChartCard title="Burndown Chart (Remaining)" subtitle="Ideal vs Remaining">
              {chartData.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-sm text-[var(--color-text-muted)]">No data this month.</div>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <ReLineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                      <Tooltip />
                      <Legend />
                      <ReLine type="monotone" dataKey="idealRemaining" stroke="#94A3B8" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Ideal" />
                      <ReLine type="monotone" dataKey="remaining" stroke="#0D66D0" strokeWidth={2} dot={false} name="Remaining" />
                    </ReLineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </ChartCard>

            <ChartCard title="Burnup Chart (Completed vs Scope)" subtitle="Completed Work vs Total Scope">
              {chartData.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-sm text-[var(--color-text-muted)]">No data this month.</div>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <ReLineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                      <Tooltip />
                      <Legend />
                      <ReLine type="monotone" dataKey="completed" stroke="#22C55E" strokeWidth={2} dot={false} name="Completed" />
                      <ReLine type="monotone" dataKey="scope" stroke="#F97316" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Scope" />
                    </ReLineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </ChartCard>
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--color-border)] bg-white p-6 shadow-sm h-full">
          <h3 className="text-base font-semibold text-[var(--color-text)] mb-4">Preview data</h3>
          <div className="overflow-auto border border-[var(--color-border)] rounded-xl max-h-[70vh]">
            <table className="min-w-full text-sm">
              <thead className="bg-[var(--color-surface-muted)] text-[var(--color-text-muted)] sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold">Task</th>
                  <th className="px-3 py-2 text-left font-semibold">Status</th>
                  <th className="px-3 py-2 text-left font-semibold">% complete</th>
                </tr>
              </thead>
              <tbody>
                {monthlyTasks.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-3 py-4 text-center text-[var(--color-text-muted)]">
                      No data this month.
                    </td>
                  </tr>
                )}
                {monthlyTasks.map(task => (
                  <tr key={task.id} className="border-t border-[var(--color-border)]">
                    <td className="px-3 py-3 text-[var(--color-text)] font-medium">{task.taskId}</td>
                    <td className="px-3 py-3">
                      <StatusBadge status={task.status} />
                    </td>
                    <td className="px-3 py-3">
                      <ProgressBar value={task.completionPercent ?? 0} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

const PlaceholderCard = ({ title, value }: { title: string; value: string }) => (
  <div className="rounded-2xl border border-[var(--color-border)] bg-white p-5 shadow-sm">
    <p className="text-sm text-[var(--color-text-muted)]">{title}</p>
    <p className="text-2xl font-bold text-[var(--color-text)] mt-2">{value}</p>
  </div>
);

const StatusBadge = ({ status }: { status: Status }) => {
  const map = {
    [Status.ToDo]: { text: 'To Do', color: 'bg-gray-100 text-gray-700' },
    [Status.InProgress]: { text: 'In Progress', color: 'bg-yellow-100 text-yellow-700' },
    [Status.Done]: { text: 'Done', color: 'bg-green-100 text-green-700' },
  } as const;
  const item = map[status] || map[Status.ToDo];
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${item.color}`}>
      {item.text}
    </span>
  );
};

const ProgressBar = ({ value }: { value: number }) => {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  const color =
    pct >= 100 ? '#22c55e' :
    pct >= 70 ? '#3b82f6' :
    pct >= 30 ? '#f59e0b' :
    '#fca5a5';
  return (
    <div className="w-full">
      <div className="h-2 rounded-full bg-[var(--color-border)] overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{ width: `${pct}%`, backgroundColor: color }}
          aria-label={`Completion ${pct}%`}
        />
      </div>
      <div className="text-xs text-[var(--color-text-muted)] mt-1">{pct}%</div>
    </div>
  );
};

const ChartCard = ({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) => (
  <div className="rounded-2xl border border-[var(--color-border)] bg-white p-6 shadow-sm">
    <div className="mb-3">
      <h3 className="text-base font-semibold text-[var(--color-text)]">{title}</h3>
      {subtitle && <p className="text-sm text-[var(--color-text-muted)]">{subtitle}</p>}
    </div>
    {children}
  </div>
);

const StatusDonut = ({ summary, statusSegments }: { summary: { donePct: number }; statusSegments: { label: string; color: string; value: number }[] }) => (
  <div className="flex flex-col items-center justify-center gap-4">
    <div className="relative w-40 h-40 flex items-center justify-center">
      <div
        className="w-full h-full rounded-full"
        style={{ background: `conic-gradient(${statusSegments.map(s => s.color + ' ' + (s.value || 0)).join(',')})` }}
      />
      <div className="absolute w-20 h-20 rounded-full bg-white border border-[var(--color-border)] flex items-center justify-center text-sm font-semibold text-[var(--color-text)]">
        {summary.donePct}%
      </div>
    </div>
    <div className="flex flex-col gap-2 text-sm text-[var(--color-text)]">
      {statusSegments.map(seg => (
        <div key={seg.label} className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: seg.color }} />
          <span>{seg.label}</span>
        </div>
      ))}
    </div>
  </div>
);

const MiniLineChart = ({
  labels,
  series,
  area = false,
}: {
  labels: string[];
  series: Array<{ data: number[]; color: string; label?: string; dashed?: boolean }>;
  area?: boolean;
}) => {
  if (!labels.length || series.every(s => !s.data.length)) {
    return (
      <div className="h-40 border border-dashed border-[var(--color-border)] rounded-lg flex items-center justify-center text-xs text-[var(--color-text-muted)]">
        No data this month
      </div>
    );
  }

  const width = 100;
  const height = 48;
  const max = Math.max(...series.flatMap(s => s.data), 1);
  const yTicks = [max, Math.round(max * 0.66), Math.round(max * 0.33), 0];
  const pointsFor = (data: number[]) => {
    if (data.length === 1) return `0,${height} ${width},${height}`;
    return data.map((v, idx) => {
      const x = (idx / Math.max(data.length - 1, 1)) * width;
      const y = height - (v / max) * height;
      return `${x},${y}`;
    }).join(' ');
  };

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-40 overflow-visible">
        {yTicks.map((tick, i) => {
          const y = height - (tick / max) * height;
          return (
            <line
              key={`grid-${i}`}
              x1={0}
              y1={y}
              x2={width}
              y2={y}
              stroke="#e5e7eb"
              strokeDasharray="3 3"
              strokeWidth={0.5}
            />
          );
        })}
        <line x1={0} y1={height} x2={width} y2={height} stroke="#9ca3af" strokeWidth={0.75} />
        <line x1={0} y1={0} x2={0} y2={height} stroke="#9ca3af" strokeWidth={0.75} />

        {area &&
          series.slice(0, 1).map((s, idx) => (
            <polyline
              key={`area-${idx}`}
              fill={`${s.color}33`}
              stroke="none"
              points={`${pointsFor(s.data)} ${width},${height} 0,${height}`}
            />
          ))}
        {series.map((s, idx) => (
          <polyline
            key={idx}
            fill="none"
            stroke={s.color}
            strokeWidth={1.5}
            strokeDasharray={s.dashed ? '4 3' : '0'}
            points={pointsFor(s.data)}
          />
        ))}
      </svg>
      <div className="mt-1 flex justify-between text-[10px] text-[var(--color-text-muted)]">
        <span>{labels[0]}</span>
        <span>{labels[Math.floor(labels.length / 2)] || ''}</span>
        <span>{labels[labels.length - 1]}</span>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-[var(--color-text-muted)]">
        {series.map((s, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color, opacity: s.dashed ? 0.5 : 1 }} />
            <span>{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MonthlyReportPage;
