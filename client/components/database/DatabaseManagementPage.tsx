import React from 'react';

const DatabaseManagementPage: React.FC = () => {
    return (
        <div className="space-y-6">
            <div className="bg-white border border-[var(--color-border)] rounded-2xl p-6 shadow-[var(--shadow-soft)] space-y-2">
                <p className="text-sm font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Database</p>
                <h1 className="text-3xl font-bold text-[var(--color-text)]">Database management</h1>
                <p className="text-[var(--color-text-muted)]">
                    Khu vực quản lý database sẽ được bổ sung sau. Các thao tác import/export sẽ được chuyển vào đây khi hoàn thiện.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <PlaceholderCard title="Backup & restore" />
                <PlaceholderCard title="Data validation" />
                <PlaceholderCard title="Audit & retention" />
            </div>

            <div className="bg-white border border-[var(--color-border)] rounded-2xl p-6 shadow-[var(--shadow-soft)]">
                <h2 className="text-xl font-semibold text-[var(--color-text)] mb-2">Coming soon</h2>
                <p className="text-[var(--color-text-muted)]">
                    Màn hình này chỉ là placeholder để điều hướng. Vui lòng quay lại sau khi tính năng Database management được triển khai.
                </p>
            </div>
        </div>
    );
};

const PlaceholderCard = ({ title }: { title: string }) => (
    <div className="bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl p-4 flex items-center justify-between">
        <div>
            <p className="text-sm text-[var(--color-text-muted)]">Đang phát triển</p>
            <p className="text-lg font-semibold text-[var(--color-text)]">{title}</p>
        </div>
        <span className="text-xs font-semibold text-[var(--color-primary)] bg-[var(--color-primary-light)] px-3 py-1 rounded-full">Soon</span>
    </div>
);

export default DatabaseManagementPage;
