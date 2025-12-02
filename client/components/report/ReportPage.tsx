import React from 'react';
import { Link } from 'react-router-dom';

const ReportPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-[var(--color-text-muted)]">Reports</p>
          <h1 className="text-2xl font-bold text-[var(--color-text)]">Reporting & Exports</h1>
          <p className="text-sm text-[var(--color-text-muted)]">
            Report workspace is reserved. Dashboard work is prioritized; reporting features will be activated later.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Link
          to="/reports/monthly"
          className="rounded-2xl border border-[var(--color-border)] bg-white p-6 shadow-sm block hover:border-[var(--color-primary)] hover:shadow transition"
        >
          <h3 className="text-lg font-semibold text-[var(--color-text)]">Báo cáo theo tháng</h3>
          <p className="text-sm text-[var(--color-text-muted)] mt-2">
            Tổng hợp hiệu suất và tiến độ theo từng tháng. Chọn tháng và xuất file.
          </p>
        </Link>
        <div className="rounded-2xl border border-[var(--color-border)] bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-[var(--color-text)]">Báo cáo theo tuần trong tháng</h3>
          <p className="text-sm text-[var(--color-text-muted)] mt-2">
            Theo dõi burnup/burndown và backlog health theo tuần. Chức năng chi tiết sẽ được bật sau.
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--color-border)] bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-[var(--color-text)]">Báo cáo cá nhân (ngày bắt đầu - ngày kết thúc)</h3>
          <p className="text-sm text-[var(--color-text-muted)] mt-2">
            Xuất tiến độ cá nhân theo khoảng ngày cho tài khoản đang đăng nhập. Sẽ gắn filter thời gian và xuất file khi triển khai.
          </p>
        </div>
        <Link
          to="/reports/daily"
          className="rounded-2xl border border-[var(--color-border)] bg-white p-6 shadow-sm block hover:border-[var(--color-primary)] hover:shadow transition"
        >
          <h3 className="text-lg font-semibold text-[var(--color-text)]">Báo cáo ngày</h3>
          <p className="text-sm text-[var(--color-text-muted)] mt-2">
            Ghi nhận tiến độ hôm nay và kế hoạch ngày mai (Today vs Looking ahead). Sẽ bổ sung cutoff 17h và export sau.
          </p>
        </Link>
      </div>
    </div>
  );
};

export default ReportPage;
