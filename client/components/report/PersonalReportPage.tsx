import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import ExcelJS from 'exceljs';
import { useData } from '../../context/DataContext';

type FilterRange = { start: string; end: string };

const formatDate = (iso?: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().split('T')[0];
};

const defaultRange = (): FilterRange => {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 7);
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  };
};

const STORAGE_KEY = 'personal-report-range';

const PersonalReportPage: React.FC = () => {
  const { tasks, currentUserId, userEmail } = useData();
  const [range, setRange] = useState<FilterRange>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.start && parsed.end) return parsed as FilterRange;
      } catch (err) {
        console.error('Failed to parse stored range', err);
      }
    }
    return defaultRange();
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(range));
  }, [range]);

  const filteredTasks = useMemo(() => {
    if (!currentUserId) return [];
    const startDate = new Date(range.start);
    const endDate = new Date(range.end);
    // inclusive end
    endDate.setHours(23, 59, 59, 999);

    return tasks
      .filter((t) => Array.isArray(t.assignedResourceIds) && t.assignedResourceIds.includes(String(currentUserId)))
      .filter((t) => {
        const candidate = formatDate(t.startDate) || formatDate(t.createdAt);
        if (!candidate) return false;
        const d = new Date(candidate);
        return d >= startDate && d <= endDate;
      });
  }, [tasks, currentUserId, range]);

  const exportToExcel = async () => {
    if (!currentUserId) {
      alert('Chưa xác định được tài khoản đăng nhập.');
      return;
    }
    if (filteredTasks.length === 0) {
      alert('Không có dữ liệu để xuất.');
      return;
    }

    const headerTitle = `Handover report of ${userEmail || 'current user'} from ${range.start} to ${range.end}`;
    const rows = filteredTasks.map((t, idx) => ({
      STT: idx + 1,
      TaskID: t.taskId || t.id,
      'Task Description': t.description || '',
      'Task status': t.status,
      '% Completion': `${t.completionPercent ?? 0}%`,
      Comment: t.comments || '',
      'Start date': formatDate(t.startDate) || '',
      'Completion date': formatDate(t.completeDate) || '',
    }));

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Handover', { views: [{ state: 'frozen', ySplit: 3 }] });

    ws.mergeCells('A1', 'H1');
    const titleCell = ws.getCell('A1');
    titleCell.value = headerTitle;
    titleCell.font = { bold: true, size: 14 };

    ws.addRow([]);
    ws.addRow(['STT', 'TaskID', 'Task Description', 'Task status', '% Completion', 'Comment', 'Start date', 'Completion date']);
    ws.getRow(3).font = { bold: true };
    ws.getRow(3).alignment = { vertical: 'middle', horizontal: 'center' };

    rows.forEach((r) => {
      ws.addRow([r.STT, r.TaskID, r['Task Description'], r['Task status'], r['% Completion'], r.Comment, r['Start date'], r['Completion date']]);
    });

    ws.columns = [
      { key: 'stt', width: 5 },
      { key: 'taskId', width: 15 },
      { key: 'desc', width: 40 },
      { key: 'status', width: 15 },
      { key: 'percent', width: 12 },
      { key: 'comment', width: 25 },
      { key: 'start', width: 14 },
      { key: 'complete', width: 16 },
    ];

    ws.getRow(3).border = {
      bottom: { style: 'thin', color: { argb: 'FFB0B0B0' } },
    };
    ws.eachRow((row, rowNumber) => {
      if (rowNumber <= 2) return;
      row.alignment = { vertical: 'middle', wrapText: true };
      row.border = {
        bottom: { style: 'hair', color: { argb: 'FFE5E7EB' } },
      };
    });

    const buf = await wb.xlsx.writeBuffer();
    const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `handover-${userEmail || 'user'}-${range.start}-${range.end}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-sm text-[var(--color-text-muted)]">Reports</p>
          <h1 className="text-2xl font-bold text-[var(--color-text)]">Báo cáo cá nhân (handover)</h1>
          <p className="text-sm text-[var(--color-text-muted)]">
            Chỉ lấy các task bạn được assign. Chọn khoảng ngày, xem preview và xuất Excel.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Link
            to="/reports"
            className="rounded-lg border border-[var(--color-border)] bg-white px-4 py-2 text-[var(--color-text)] hover:border-[var(--color-primary)] transition-colors"
          >
            Back to Reports
          </Link>
          <div className="flex items-center gap-2">
            <label className="text-sm text-[var(--color-text-muted)]">From</label>
            <input
              type="date"
              value={range.start}
              onChange={(e) => setRange((prev) => ({ ...prev, start: e.target.value }))}
              className="rounded-lg border border-[var(--color-border)] bg-white px-3 py-2 text-[var(--color-text)]"
            />
            <label className="text-sm text-[var(--color-text-muted)]">To</label>
            <input
              type="date"
              value={range.end}
              onChange={(e) => setRange((prev) => ({ ...prev, end: e.target.value }))}
              className="rounded-lg border border-[var(--color-border)] bg-white px-3 py-2 text-[var(--color-text)]"
            />
          </div>
          <button
            onClick={exportToExcel}
            className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-white font-semibold hover:bg-[var(--color-primary-hover)] transition-colors"
          >
            Export Excel
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div>
            <h3 className="text-base font-semibold text-[var(--color-text)]">Preview data</h3>
            <p className="text-sm text-[var(--color-text-muted)]">
              Handover report of {userEmail || 'current user'} from {range.start} to {range.end}
            </p>
          </div>
          <div className="text-sm text-[var(--color-text-muted)]">Total: {filteredTasks.length}</div>
        </div>
        <div className="overflow-auto max-h-[70vh]">
          <table className="min-w-full text-sm">
            <thead className="bg-[var(--color-surface-muted)] text-[var(--color-text-muted)] sticky top-0">
              <tr>
                <th className="px-3 py-2 text-left font-semibold">#</th>
                <th className="px-3 py-2 text-left font-semibold">TaskID</th>
                <th className="px-3 py-2 text-left font-semibold">Task Description</th>
                <th className="px-3 py-2 text-left font-semibold">Task status</th>
                <th className="px-3 py-2 text-left font-semibold">% Completion</th>
                <th className="px-3 py-2 text-left font-semibold">Comment</th>
                <th className="px-3 py-2 text-left font-semibold">Start date</th>
                <th className="px-3 py-2 text-left font-semibold">Completion date</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-3 py-3 text-center text-[var(--color-text-muted)]">
                    No data in this range.
                  </td>
                </tr>
              )}
              {filteredTasks.map((t, idx) => (
                <tr key={t.id} className="border-t border-[var(--color-border)] align-top">
                  <td className="px-3 py-2">{idx + 1}</td>
                  <td className="px-3 py-2 font-medium text-[var(--color-text)] whitespace-nowrap">{t.taskId || t.id}</td>
                  <td className="px-3 py-2 text-[var(--color-text-muted)]">{t.description || '—'}</td>
                  <td className="px-3 py-2">{t.status}</td>
                  <td className="px-3 py-2">{t.completionPercent ?? 0}%</td>
                  <td className="px-3 py-2 text-[var(--color-text-muted)]">{t.comments || '—'}</td>
                  <td className="px-3 py-2">{formatDate(t.startDate) || '—'}</td>
                  <td className="px-3 py-2">{formatDate(t.completeDate) || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PersonalReportPage;
