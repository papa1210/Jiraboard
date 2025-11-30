import React, { useEffect, useMemo, useState } from 'react';
import { useData } from '../../context/DataContext';
import { DutyStatus, Resource } from '../../types';
import { permissionsApi } from '../../api';

type RoleKey = 'ENG' | 'SUPV';
type PermissionMap = Record<RoleKey, Record<string, boolean>>;
type PermissionItem = { key: string; label: string };

const permissionMatrix: { group: string; items: PermissionItem[] }[] = [
  {
    group: 'Sprint management',
    items: [
      { key: 'sprint:create', label: 'Create/close sprint' },
      { key: 'sprint:delete', label: 'Delete sprint' },
      { key: 'sprint:report', label: 'Export sprint report' },
    ],
  },
  {
    group: 'Task management',
    items: [
      { key: 'task:create', label: 'Create task' },
      { key: 'task:update', label: 'Edit task' },
      { key: 'task:assign', label: 'Assign task' },
      { key: 'task:delete', label: 'Delete task' },
    ],
  },
  {
    group: 'Human resources',
    items: [
      { key: 'resource:manage', label: 'Manage members (add/update/delete)' },
    ],
  },
];

const defaultPermissions: PermissionMap = {
  ENG: {
    'sprint:create': false,
    'sprint:delete': false,
    'sprint:report': true,
    'task:create': true,
    'task:update': true,
    'task:assign': false,
    'task:delete': false,
    'resource:manage': false,
  },
  SUPV: {
    'sprint:create': true,
    'sprint:delete': true,
    'sprint:report': true,
    'task:create': true,
    'task:update': true,
    'task:assign': true,
    'task:delete': true,
    'resource:view': true,
    'resource:manage': true,
    'resource:delete': true,
  },
};

const UserAccountsPage: React.FC = () => {
  const { resources, addResource, updateResource, deleteResource, isAdmin, currentUserRole } = useData();
  const [username, setUsername] = useState('');
  const [role, setRole] = useState<'SUPV' | 'ENG'>('ENG');
  const [status, setStatus] = useState<DutyStatus>(DutyStatus.OnDuty);
  const [site, setSite] = useState<'PQP_HT' | 'MT1'>('PQP_HT');
  const [error, setError] = useState('');
  const [permError, setPermError] = useState('');
  const [isSavingPerm, setIsSavingPerm] = useState(false);
  const [permState, setPermState] = useState<PermissionMap>(defaultPermissions);

  const canModify = isAdmin || currentUserRole === 'SUPV';

  const sortedUsers = useMemo(() => {
    return [...resources].sort((a, b) => a.name.localeCompare(b.name));
  }, [resources]);

  useEffect(() => {
    if (!isAdmin) return;
    permissionsApi.get().then((data: any) => {
      if (data?.ENG && data?.SUPV) {
        setPermState({
          ENG: { ...defaultPermissions.ENG, ...data.ENG },
          SUPV: { ...defaultPermissions.SUPV, ...data.SUPV },
        });
      }
    }).catch(err => {
      console.error('Failed to load permissions', err);
      setPermError('Failed to load permissions');
    });
  }, [isAdmin]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canModify) return;
    if (!username.trim()) {
      setError('Username is required');
      return;
    }
    try {
      await addResource({ name: username.trim(), role, status, site });
      setUsername('');
      setRole('ENG');
      setStatus(DutyStatus.OnDuty);
      setSite('PQP_HT');
      setError('');
    } catch (err: any) {
      setError(err?.message || 'Failed to add user');
    }
  };

  const handleRoleChange = (user: Resource, nextRole: 'SUPV' | 'ENG') => {
    if (!canModify) return;
    updateResource(user.id, { role: nextRole });
  };

  const handleStatusToggle = (user: Resource) => {
    if (!canModify) return;
    const nextStatus = user.status === DutyStatus.OnDuty ? DutyStatus.OffDuty : DutyStatus.OnDuty;
    updateResource(user.id, { status: nextStatus });
  };

  const handleRemove = (user: Resource) => {
    if (!canModify) return;
    if (window.confirm(`Remove user "${user.name}"?`)) {
      deleteResource(user.id);
    }
  };

  const renderPermission = (permKey: string, roleKey: 'ENG' | 'SUPV' | 'ADMIN') => {
    if (roleKey === 'ADMIN') return '✔️';
    const current = permState[roleKey][permKey];
    return (
      <input
        type="checkbox"
        checked={!!current}
        disabled={!isAdmin}
        onChange={(e) => handlePermToggle(roleKey as 'ENG' | 'SUPV', permKey, e.target.checked)}
      />
    );
  };

  const handlePermToggle = (roleKey: 'ENG' | 'SUPV', action: string, value: boolean) => {
    setPermState(prev => ({
      ...prev,
      [roleKey]: { ...prev[roleKey], [action]: value },
    }));
  };

  const handleSavePermissions = async () => {
    setIsSavingPerm(true);
    setPermError('');
    try {
      await permissionsApi.update(permState);
    } catch (err: any) {
      setPermError(err?.message || 'Failed to save permissions');
    } finally {
      setIsSavingPerm(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="bg-white border border-[#DFE1E6] rounded-lg p-6">
        <h1 className="text-2xl font-bold text-black mb-2">Access restricted</h1>
        <p className="text-sm text-[#5E6C84]">Chỉ admin mới truy cập được trang này.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold text-black">User Accounts</h1>
        <p className="text-sm text-[#5E6C84]">Quản lý user, vai trò và trạng thái. Admin cố định; SUPV/ENG có thể đổi qua đây.</p>
      </div>

      <div className="bg-white rounded-lg border border-[#DFE1E6] shadow-sm p-4">
        <h2 className="text-lg font-semibold text-black mb-3">Role Permissions</h2>
        <div className="flex justify-end mb-2">
          <button
            onClick={handleSavePermissions}
            disabled={isSavingPerm}
            className={`px-4 py-2 rounded-md text-sm font-semibold ${isSavingPerm ? 'bg-gray-300 text-gray-600 cursor-not-allowed' : 'bg-[#0052CC] text-white hover:bg-[#0747A6]'}`}
          >
            {isSavingPerm ? 'Saving...' : 'Save changes'}
          </button>
        </div>
        {permError && <p className="text-accent-red text-sm mb-2">{permError}</p>}
        <table className="w-full text-sm border border-[#DFE1E6]">
          <thead className="bg-[#F4F5F7] text-[#172B4D]">
            <tr>
              <th className="p-2 text-left">Action</th>
              <th className="p-2 text-center">ENG</th>
              <th className="p-2 text-center">SUPV</th>
              <th className="p-2 text-center">ADMIN</th>
            </tr>
          </thead>
          <tbody>
            {permissionMatrix.map(section => (
              <React.Fragment key={section.group}>
                <tr className="bg-[#EBECF0] text-[#5E6C84] font-semibold">
                  <td className="p-2" colSpan={4}>{section.group}</td>
                </tr>
                {section.items.map(item => (
                  <tr key={item.key} className="border-t border-[#DFE1E6]">
                    <td className="p-2 text-[#172B4D]">{item.label}</td>
                    <td className="p-2 text-center">{renderPermission(item.key, 'ENG')}</td>
                    <td className="p-2 text-center">{renderPermission(item.key, 'SUPV')}</td>
                    <td className="p-2 text-center">{renderPermission(item.key, 'ADMIN')}</td>
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-white rounded-lg border border-[#DFE1E6] shadow-sm p-4 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-lg font-semibold text-black">Team members</h2>
            <p className="text-sm text-[#5E6C84]">Add or manage members. Admin flag cố định.</p>
          </div>
          <form className="flex flex-wrap items-end gap-2" onSubmit={handleAdd}>
            <div className="flex flex-col">
              <label className="text-xs text-[#5E6C84]">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="p-2 bg-white border border-[#DFE1E6] rounded-md text-[#172B4D] focus:outline-none focus:ring-2 focus:ring-[#0052CC]"
                placeholder="username"
                disabled={!canModify}
              />
            </div>
            <div className="flex flex-col">
              <label className="text-xs text-[#5E6C84]">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as 'SUPV' | 'ENG')}
                className="p-2 bg-white border border-[#DFE1E6] rounded-md text-[#172B4D] focus:outline-none focus:ring-2 focus:ring-[#0052CC]"
                disabled={!canModify}
              >
                <option value="SUPV">SUPV</option>
                <option value="ENG">ENG</option>
              </select>
            </div>
            <div className="flex flex-col">
              <label className="text-xs text-[#5E6C84]">Duty</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as DutyStatus)}
                className="p-2 bg-white border border-[#DFE1E6] rounded-md text-[#172B4D] focus:outline-none focus:ring-2 focus:ring-[#0052CC]"
                disabled={!canModify}
              >
                <option value={DutyStatus.OnDuty}>On Duty</option>
                <option value={DutyStatus.OffDuty}>Off Duty</option>
              </select>
            </div>
            <div className="flex flex-col">
              <label className="text-xs text-[#5E6C84]">Site</label>
              <select
                value={site}
                onChange={(e) => setSite(e.target.value as 'PQP_HT' | 'MT1')}
                className="p-2 bg-white border border-[#DFE1E6] rounded-md text-[#172B4D] focus:outline-none focus:ring-2 focus:ring-[#0052CC]"
                disabled={!canModify}
              >
                <option value="PQP_HT">PQP-HT</option>
                <option value="MT1">MT1</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={!canModify}
              className={`px-4 py-2 rounded-md font-semibold ${canModify ? 'bg-[#0052CC] text-white hover:bg-[#0747A6]' : 'bg-gray-300 text-gray-600 cursor-not-allowed'}`}
            >
              Add Member
            </button>
          </form>
        </div>
        {error && <p className="text-accent-red text-sm">{error}</p>}

        <div className="border border-[#DFE1E6] rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[#F4F5F7] text-[#172B4D]">
              <tr>
                <th className="p-3 text-left">Username</th>
                <th className="p-3 text-left">Role</th>
                <th className="p-3 text-left">Site</th>
                <th className="p-3 text-left">Duty</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedUsers.map(user => (
                <tr key={user.id} className="border-t border-[#DFE1E6]">
                  <td className="p-3 text-[#172B4D] font-medium">{user.name}</td>
                  <td className="p-3">
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user, e.target.value as 'SUPV' | 'ENG')}
                      disabled={!canModify}
                      className="p-2 bg-white border border-[#DFE1E6] rounded-md text-[#172B4D] focus:outline-none focus:ring-2 focus:ring-[#0052CC]"
                    >
                      <option value="SUPV">SUPV</option>
                      <option value="ENG">ENG</option>
                    </select>
                  </td>
                  <td className="p-3">
                    <select
                      value={user.site}
                      onChange={(e) => handleRoleChange({ ...user, site: e.target.value as 'PQP_HT' | 'MT1' }, user.role)}
                      disabled={!canModify}
                      className="p-2 bg-white border border-[#DFE1E6] rounded-md text-[#172B4D] focus:outline-none focus:ring-2 focus:ring-[#0052CC]"
                    >
                      <option value="PQP_HT">PQP-HT</option>
                      <option value="MT1">MT1</option>
                    </select>
                  </td>
                  <td className="p-3">
                    <button
                      onClick={() => handleStatusToggle(user)}
                      disabled={!canModify}
                      className={`px-3 py-1 rounded-md text-sm font-semibold ${user.status === DutyStatus.OnDuty ? 'bg-accent-green text-white' : 'bg-accent-yellow text-[#172B4D]'} ${!canModify ? 'opacity-60 cursor-not-allowed' : ''}`}
                    >
                      {user.status === DutyStatus.OnDuty ? 'On Duty' : 'Off Duty'}
                    </button>
                  </td>
                  <td className="p-3 space-x-2">
                    <button
                      onClick={() => handleRemove(user)}
                      disabled={!canModify}
                      className={`px-3 py-1 rounded-md text-sm font-semibold ${canModify ? 'bg-accent-red text-white hover:bg-opacity-80' : 'bg-gray-300 text-gray-600 cursor-not-allowed'}`}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
              {sortedUsers.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-[#5E6C84]">No members found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserAccountsPage;
