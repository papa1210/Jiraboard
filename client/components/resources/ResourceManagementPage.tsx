import React, { useMemo, useState } from 'react';
import { useData } from '../../context/DataContext';
import { DutyStatus, Resource } from '../../types';
import Modal from '../ui/Modal';

const ResourceManagementPage: React.FC = () => {
    const { resources, addResource, updateResource, deleteResource, isAdmin, currentUserRole } = useData();
    const [error, setError] = useState('');
    const [editingResource, setEditingResource] = useState<Resource | null>(null);
    const [editName, setEditName] = useState('');
    const [editRole, setEditRole] = useState<'SUPV' | 'ENG'>('ENG');
    const [editStatus, setEditStatus] = useState<DutyStatus>(DutyStatus.OnDuty);
    const [editSite, setEditSite] = useState<'PQP_HT' | 'MT1'>('PQP_HT');
    const [editError, setEditError] = useState('');
    const [draggingId, setDraggingId] = useState<string | null>(null);

    const groupedBySite = useMemo(() => {
        const init = { PQP_HT: { on: [], off: [] } as { on: Resource[]; off: Resource[] }, MT1: { on: [], off: [] } };
        resources.forEach(r => {
            const site = r.site === 'MT1' ? 'MT1' : 'PQP_HT';
            if (r.status === DutyStatus.OnDuty) {
                init[site].on.push(r);
            } else {
                init[site].off.push(r);
            }
        });
        return init;
    }, [resources]);

    const handleToggleStatus = (resource: Resource) => {
        const nextStatus = resource.status === DutyStatus.OnDuty ? DutyStatus.OffDuty : DutyStatus.OnDuty;
        updateResource(resource.id, { status: nextStatus });
    };

    const openEdit = (resource: Resource) => {
        setEditingResource(resource);
        setEditName(resource.name);
        setEditRole(resource.role);
        setEditStatus(resource.status);
        setEditSite(resource.site);
        setEditError('');
    };

    const handleEditSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!editName.trim() || !editRole) {
            setEditError('Name and Role are required.');
            return;
        }
        if (editingResource) {
            try {
                await updateResource(editingResource.id, {
                    name: editName.trim(),
                    role: editRole,
                    status: editStatus,
                    site: editSite,
                });
                setEditingResource(null);
            } catch (e: any) {
                setEditError(e?.message || 'Failed to update resource');
            }
        }
    };

    const handleDrop = (site: 'PQP_HT' | 'MT1', status: DutyStatus) => {
        if (!draggingId) return;
        const resource = resources.find(r => r.id === draggingId);
        if (!resource) return;
        updateResource(resource.id, { site, status });
        setDraggingId(null);
    };

    const canModify = isAdmin || currentUserRole === 'SUPV';
    const canDelete = canModify;

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold text-black">Human Resources</h1>
                <p className="text-sm text-[#5E6C84]">Quản lý On/Off Duty cho PQP-HT và MT1, kéo thả để chuyển cột.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <SummaryCard title="PQP-HT On Duty" value={groupedBySite.PQP_HT.on.length} accent="bg-accent-green" />
                <SummaryCard title="PQP-HT Off Duty" value={groupedBySite.PQP_HT.off.length} accent="bg-accent-yellow" />
                <SummaryCard title="MT1 On Duty" value={groupedBySite.MT1.on.length} accent="bg-accent-green" />
                <SummaryCard title="MT1 Off Duty" value={groupedBySite.MT1.off.length} accent="bg-accent-yellow" />
            </div>

            {error && <p className="text-accent-red text-sm mt-2">{error}</p>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ResourceColumn
                    title="PQP-HT On Duty"
                    resources={groupedBySite.PQP_HT.on}
                    emptyText="Chưa có ai On Duty (PQP-HT)."
                    badgeClass="bg-accent-green"
                    onToggle={handleToggleStatus}
                    onDelete={deleteResource}
                    onEdit={openEdit}
                    canDelete={canDelete}
                    canModify={canModify}
                    onDrop={(status) => handleDrop('PQP_HT', status)}
                    onDragStart={setDraggingId}
                />
                <ResourceColumn
                    title="PQP-HT Off Duty"
                    resources={groupedBySite.PQP_HT.off}
                    emptyText="Chưa có ai Off Duty (PQP-HT)."
                    badgeClass="bg-accent-yellow"
                    onToggle={handleToggleStatus}
                    onDelete={deleteResource}
                    onEdit={openEdit}
                    canDelete={canDelete}
                    canModify={canModify}
                    onDrop={(status) => handleDrop('PQP_HT', status)}
                    onDragStart={setDraggingId}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ResourceColumn
                    title="MT1 On Duty"
                    resources={groupedBySite.MT1.on}
                    emptyText="Chưa có ai On Duty (MT1)."
                    badgeClass="bg-accent-green"
                    onToggle={handleToggleStatus}
                    onDelete={deleteResource}
                    onEdit={openEdit}
                    canDelete={canDelete}
                    canModify={canModify}
                    onDrop={(status) => handleDrop('MT1', status)}
                    onDragStart={setDraggingId}
                />
                <ResourceColumn
                    title="MT1 Off Duty"
                    resources={groupedBySite.MT1.off}
                    emptyText="Chưa có ai Off Duty (MT1)."
                    badgeClass="bg-accent-yellow"
                    onToggle={handleToggleStatus}
                    onDelete={deleteResource}
                    onEdit={openEdit}
                    canDelete={canDelete}
                    canModify={canModify}
                    onDrop={(status) => handleDrop('MT1', status)}
                    onDragStart={setDraggingId}
                />
            </div>

            <Modal
                isOpen={!!editingResource}
                onClose={() => setEditingResource(null)}
                title={editingResource ? `Edit ${editingResource.name}` : 'Edit Resource'}
            >
                <form className="space-y-4 bg-white p-2" onSubmit={handleEditSubmit}>
                    <div>
                        <label className="block text-sm font-medium text-[#5E6C84] mb-1">Username</label>
                        <input
                            type="text"
                            value={editName}
                            disabled
                            className="w-full p-2 bg-gray-100 border border-[#DFE1E6] rounded-md text-[#172B4D]"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[#5E6C84] mb-1">Role</label>
                        <select
                            value={editRole}
                            onChange={(e) => setEditRole(e.target.value as any)}
                            className="w-full p-2 bg-white border border-[#DFE1E6] rounded-md text-[#172B4D] focus:outline-none focus:ring-2 focus:ring-[#0052CC]"
                        >
                            <option value="SUPV">Supv</option>
                            <option value="ENG">Eng</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[#5E6C84] mb-1">Site</label>
                        <select
                            value={editSite}
                            onChange={(e) => setEditSite(e.target.value as 'PQP_HT' | 'MT1')}
                            className="w-full p-2 bg-white border border-[#DFE1E6] rounded-md text-[#172B4D] focus:outline-none focus:ring-2 focus:ring-[#0052CC]"
                        >
                            <option value="PQP_HT">PQP-HT</option>
                            <option value="MT1">MT1</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[#5E6C84] mb-1">Duty</label>
                        <select
                            value={editStatus}
                            onChange={(e) => setEditStatus(e.target.value as DutyStatus)}
                            className="w-full p-2 bg-white border border-[#DFE1E6] rounded-md text-[#172B4D] focus:outline-none focus:ring-2 focus:ring-[#0052CC]"
                        >
                            <option value={DutyStatus.OnDuty}>On Duty</option>
                            <option value={DutyStatus.OffDuty}>Off Duty</option>
                        </select>
                    </div>
                    {editError && <p className="text-accent-red text-sm">{editError}</p>}
                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => setEditingResource(null)}
                            className="bg-secondary hover:bg-opacity-80 text-white font-bold py-2 px-4 rounded-md"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="bg-[#0052CC] hover:bg-[#0747A6] text-white font-bold py-2 px-4 rounded-md transition-colors"
                        >
                            Save
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

const SummaryCard = ({ title, value, accent }: { title: string; value: number; accent: string }) => (
    <div className="bg-white rounded-2xl p-4 flex items-center justify-between shadow-[var(--shadow-soft)] border border-[var(--color-border)]">
        <div>
            <p className="text-sm text-[var(--color-text-muted)] font-medium">{title}</p>
            <p className="text-2xl font-bold text-[var(--color-text)]">{value}</p>
        </div>
        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${accent}`}>
            {title.slice(0, 1)}
        </div>
    </div>
);

const ResourceColumn = ({ title, resources, emptyText, badgeClass, onToggle, onDelete, onEdit, canDelete, canModify, onDrop, onDragStart }: { title: string; resources: Resource[]; emptyText: string; badgeClass: string; onToggle: (resource: Resource) => void; onDelete: (id: string) => void; onEdit: (resource: Resource) => void; canDelete: boolean; canModify: boolean; onDrop: (status: DutyStatus) => void; onDragStart: (id: string) => void }) => (
    <div
        className="bg-white rounded-2xl shadow-[var(--shadow-soft)] border border-[var(--color-border)] p-4"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
            e.preventDefault();
            onDrop(title.includes('Off') ? DutyStatus.OffDuty : DutyStatus.OnDuty);
        }}
    >
        <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold text-black">{title}</h3>
            <span className={`px-3 py-1 text-xs font-semibold rounded-full text-white ${badgeClass}`}>{resources.length} nguoi</span>
        </div>
        <div className="space-y-3 min-h-[100px]">
            {resources.map(resource => (
                <ResourceCard
                    key={resource.id}
                    resource={resource}
                    onToggle={onToggle}
                    onDelete={onDelete}
                    onEdit={onEdit}
                    canDelete={canDelete}
                    canModify={canModify}
                    onDragStart={onDragStart}
                />
            ))}
            {resources.length === 0 && (
                <p className="text-sm text-text-secondary text-center py-6">{emptyText}</p>
            )}
        </div>
    </div>
);

const ResourceCard = ({ resource, onToggle, onDelete, onEdit, canDelete, canModify, onDragStart }: { resource: Resource; onToggle: (resource: Resource) => void; onDelete: (id: string) => void; onEdit: (resource: Resource) => void; canDelete: boolean; canModify: boolean; onDragStart: (id: string) => void }) => (
    <div
        className="border border-[var(--color-border)] rounded-xl p-4 flex flex-col gap-3 bg-[#F8F9FB]"
        draggable={canModify}
        onDragStart={() => onDragStart(resource.id)}
    >
        <div className="flex items-center justify-between">
            <div>
                <p className="text-base font-semibold text-[var(--color-text)]">{resource.name}</p>
                <p className="text-sm text-[var(--color-text-muted)]">{resource.role} • {resource.site}</p>
            </div>
            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${resource.status === DutyStatus.OnDuty ? 'bg-accent-green text-white' : 'bg-accent-yellow text-[#172B4D]'}`}>
                {resource.status}
            </span>
        </div>
        <div className="flex flex-wrap gap-2">
            <button
                onClick={() => canModify && onToggle(resource)}
                disabled={!canModify}
                className={`text-sm font-semibold py-2 px-3 rounded-md transition-colors ${canModify ? 'bg-[#0052CC] hover:bg-[#0747A6] text-white' : 'bg-gray-300 text-gray-600 cursor-not-allowed'}`}
            >
                Move to {resource.status === DutyStatus.OnDuty ? 'Off Duty' : 'On Duty'}
            </button>
            <button
                onClick={() => canModify && onEdit(resource)}
                disabled={!canModify}
                className={`text-sm font-semibold py-2 px-3 rounded-md transition-colors ${canModify ? 'bg-white border border-[#DFE1E6] hover:bg-[#F4F5F7] text-[#172B4D]' : 'bg-gray-200 text-gray-500 border border-[#DFE1E6] cursor-not-allowed'}`}
            >
                Edit
            </button>
            <button
                onClick={() => canDelete && onDelete(resource.id)}
                disabled={!canDelete}
                className={`text-sm font-semibold py-2 px-3 rounded-md transition-colors ${canDelete ? 'bg-accent-red hover:bg-opacity-80 text-white' : 'bg-gray-300 text-gray-600 cursor-not-allowed'}`}
            >
                Remove
            </button>
        </div>
    </div>
);

export default ResourceManagementPage;
