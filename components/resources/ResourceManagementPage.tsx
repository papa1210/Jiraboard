import React, { useMemo, useState } from 'react';
import { useData } from '../../context/DataContext';
import { DutyStatus, Resource } from '../../types';
import Modal from '../ui/Modal';

const ResourceManagementPage: React.FC = () => {
    const { resources, addResource, updateResource, deleteResource } = useData();
    const [name, setName] = useState('');
    const [role, setRole] = useState('');
    const [status, setStatus] = useState<DutyStatus>(DutyStatus.OnDuty);
    const [error, setError] = useState('');
    const [editingResource, setEditingResource] = useState<Resource | null>(null);
    const [editName, setEditName] = useState('');
    const [editRole, setEditRole] = useState('');
    const [editStatus, setEditStatus] = useState<DutyStatus>(DutyStatus.OnDuty);
    const [editError, setEditError] = useState('');

    const onDutyResources = useMemo(
        () => resources.filter(resource => resource.status === DutyStatus.OnDuty),
        [resources]
    );
    const offDutyResources = useMemo(
        () => resources.filter(resource => resource.status === DutyStatus.OffDuty),
        [resources]
    );

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        if (!name.trim() || !role.trim()) {
            setError('Name and Role are required.');
            return;
        }
        addResource({ name: name.trim(), role: role.trim(), status });
        setName('');
        setRole('');
        setStatus(DutyStatus.OnDuty);
        setError('');
    };

    const handleToggleStatus = (resource: Resource) => {
        const nextStatus = resource.status === DutyStatus.OnDuty ? DutyStatus.OffDuty : DutyStatus.OnDuty;
        updateResource(resource.id, { status: nextStatus });
    };

    const openEdit = (resource: Resource) => {
        setEditingResource(resource);
        setEditName(resource.name);
        setEditRole(resource.role);
        setEditStatus(resource.status);
        setEditError('');
    };

    const handleEditSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        if (!editName.trim() || !editRole.trim()) {
            setEditError('Name and Role are required.');
            return;
        }
        if (editingResource) {
            updateResource(editingResource.id, {
                name: editName.trim(),
                role: editRole.trim(),
                status: editStatus,
            });
            setEditingResource(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold text-black">Human Resources</h1>
                <p className="text-sm text-[#5E6C84]">Quan ly nhan su dang On Duty va Off Duty cung ten va vai tro.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <SummaryCard title="On Duty" value={onDutyResources.length} accent="bg-accent-green" />
                <SummaryCard title="Off Duty" value={offDutyResources.length} accent="bg-accent-yellow" />
                <SummaryCard title="Total" value={resources.length} accent="bg-accent-blue" />
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-[#DFE1E6] p-6">
                <h2 className="text-xl font-bold text-black mb-4">Add Member</h2>
                <form className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end" onSubmit={handleSubmit}>
                    <div className="col-span-1 md:col-span-1">
                        <label className="block text-sm font-medium text-[#5E6C84] mb-1">Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full p-2 bg-white border border-[#DFE1E6] rounded-md text-[#172B4D] focus:outline-none focus:ring-2 focus:ring-[#0052CC]"
                            placeholder="Jane Doe"
                        />
                    </div>
                    <div className="col-span-1 md:col-span-1">
                        <label className="block text-sm font-medium text-[#5E6C84] mb-1">Role</label>
                        <input
                            type="text"
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            className="w-full p-2 bg-white border border-[#DFE1E6] rounded-md text-[#172B4D] focus:outline-none focus:ring-2 focus:ring-[#0052CC]"
                            placeholder="On-call Engineer"
                        />
                    </div>
                    <div className="col-span-1 md:col-span-1">
                        <label className="block text-sm font-medium text-[#5E6C84] mb-1">Duty</label>
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value as DutyStatus)}
                            className="w-full p-2 bg-white border border-[#DFE1E6] rounded-md text-[#172B4D] focus:outline-none focus:ring-2 focus:ring-[#0052CC]"
                        >
                            <option value={DutyStatus.OnDuty}>On Duty</option>
                            <option value={DutyStatus.OffDuty}>Off Duty</option>
                        </select>
                    </div>
                    <div className="col-span-1 md:col-span-1 flex gap-3 md:justify-end">
                        <button
                            type="submit"
                            className="bg-[#0052CC] hover:bg-[#0747A6] text-white font-bold py-2 px-4 rounded-md transition-colors w-full md:w-auto"
                        >
                            Add
                        </button>
                    </div>
                </form>
                {error && <p className="text-accent-red text-sm mt-2">{error}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ResourceColumn
                    title="On Duty"
                    resources={onDutyResources}
                    emptyText="Chua co ai On Duty."
                    badgeClass="bg-accent-green"
                    onToggle={handleToggleStatus}
                    onDelete={deleteResource}
                    onEdit={openEdit}
                />
                <ResourceColumn
                    title="Off Duty"
                    resources={offDutyResources}
                    emptyText="Chua co ai Off Duty."
                    badgeClass="bg-accent-yellow"
                    onToggle={handleToggleStatus}
                    onDelete={deleteResource}
                    onEdit={openEdit}
                />
            </div>

            <Modal
                isOpen={!!editingResource}
                onClose={() => setEditingResource(null)}
                title={editingResource ? `Edit ${editingResource.name}` : 'Edit Resource'}
            >
                <form className="space-y-4 bg-white p-2" onSubmit={handleEditSubmit}>
                    <div>
                        <label className="block text-sm font-medium text-[#5E6C84] mb-1">Name</label>
                        <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full p-2 bg-white border border-[#DFE1E6] rounded-md text-[#172B4D] focus:outline-none focus:ring-2 focus:ring-[#0052CC]"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[#5E6C84] mb-1">Role</label>
                        <input
                            type="text"
                            value={editRole}
                            onChange={(e) => setEditRole(e.target.value)}
                            className="w-full p-2 bg-white border border-[#DFE1E6] rounded-md text-[#172B4D] focus:outline-none focus:ring-2 focus:ring-[#0052CC]"
                        />
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
    <div className="bg-white rounded-lg p-4 flex items-center justify-between shadow-sm border border-[#DFE1E6]">
        <div>
            <p className="text-sm text-[#5E6C84] font-medium">{title}</p>
            <p className="text-2xl font-bold text-[#172B4D]">{value}</p>
        </div>
        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${accent}`}>
            {title.slice(0, 1)}
        </div>
    </div>
);

const ResourceColumn = ({ title, resources, emptyText, badgeClass, onToggle, onDelete, onEdit }: { title: string; resources: Resource[]; emptyText: string; badgeClass: string; onToggle: (resource: Resource) => void; onDelete: (id: string) => void; onEdit: (resource: Resource) => void }) => (
    <div className="bg-white rounded-lg shadow-sm border border-[#DFE1E6] p-4">
        <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold text-black">{title}</h3>
            <span className={`px-3 py-1 text-xs font-semibold rounded-full text-white ${badgeClass}`}>{resources.length} nguoi</span>
        </div>
        <div className="space-y-3">
            {resources.map(resource => (
                <ResourceCard key={resource.id} resource={resource} onToggle={onToggle} onDelete={onDelete} onEdit={onEdit} />
            ))}
            {resources.length === 0 && (
                <p className="text-sm text-text-secondary text-center py-6">{emptyText}</p>
            )}
        </div>
    </div>
);

const ResourceCard = ({ resource, onToggle, onDelete, onEdit }: { resource: Resource; onToggle: (resource: Resource) => void; onDelete: (id: string) => void; onEdit: (resource: Resource) => void }) => (
    <div className="border border-[#DFE1E6] rounded-lg p-4 flex flex-col gap-3 bg-[#F8F9FB]">
        <div className="flex items-center justify-between">
            <div>
                <p className="text-base font-semibold text-[#172B4D]">{resource.name}</p>
                <p className="text-sm text-[#5E6C84]">{resource.role}</p>
            </div>
            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${resource.status === DutyStatus.OnDuty ? 'bg-accent-green text-white' : 'bg-accent-yellow text-[#172B4D]'}`}>
                {resource.status}
            </span>
        </div>
        <div className="flex flex-wrap gap-2">
            <button
                onClick={() => onToggle(resource)}
                className="bg-[#0052CC] hover:bg-[#0747A6] text-white text-sm font-semibold py-2 px-3 rounded-md transition-colors"
            >
                Move to {resource.status === DutyStatus.OnDuty ? 'Off Duty' : 'On Duty'}
            </button>
            <button
                onClick={() => onEdit(resource)}
                className="bg-white border border-[#DFE1E6] hover:bg-[#F4F5F7] text-[#172B4D] text-sm font-semibold py-2 px-3 rounded-md transition-colors"
            >
                Edit
            </button>
            <button
                onClick={() => onDelete(resource.id)}
                className="bg-accent-red hover:bg-opacity-80 text-white text-sm font-semibold py-2 px-3 rounded-md transition-colors"
            >
                Remove
            </button>
        </div>
    </div>
);

export default ResourceManagementPage;
