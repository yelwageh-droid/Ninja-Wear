import { useEffect, useMemo, useState } from 'react';
import { findProfileByEmail, getTeamMembers, updateTeamMember } from '../../services/apparelService.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { PERMISSIONS, PERMISSION_DEFINITIONS, roleLabel } from '../../data/permissions.js';

// team.manage is super-admin only and is not grantable, so it is not offered as a checkbox
// صلاحية إدارة الفريق خاصة بالسوبر أدمن فقط ولا تُمنح، لذلك لا تظهر كمربع اختيار
const grantablePermissions = PERMISSION_DEFINITIONS.filter((definition) => definition.key !== PERMISSIONS.teamManage);

const roleOptions = ['admin', 'super_admin', 'user'];

const roleStyles = {
  super_admin: 'border-red-300/30 bg-red-400/10 text-red-200',
  admin: 'border-sky-300/20 bg-sky-300/10 text-sky-200',
  user: 'border-white/15 bg-white/5 text-gray-300',
};

function RolePill({ role }) {
  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-semibold ${roleStyles[role] || roleStyles.user}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {roleLabel(role)}
    </span>
  );
}

function TeamMemberCard({ member, isSelf, isSaving, onRoleChange, onTogglePermission }) {
  const { t } = useLanguage();
  const isAdmin = member.role === 'admin';
  const locked = isSelf || isSaving;

  return (
    <li className="border border-white/10 bg-[#0e0e11] p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="font-semibold text-white">{member.full_name || 'Unnamed member'}</p>
          <p className="mt-1 text-xs text-gray-500">{member.email || '—'}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <RolePill role={member.role} />
          <label className="text-xs text-gray-500">
            <span className="sr-only">Change role for {member.full_name || member.email}</span>
            <select
              value={member.role}
              disabled={locked}
              onChange={(event) => onRoleChange(member.user_id, event.target.value)}
              className="rounded-md border border-white/10 bg-[#111116] px-3 py-2 text-xs font-semibold text-gray-200 outline-none focus:border-red-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {roleOptions.map((role) => (
                <option key={role} value={role} className="bg-[#111116] text-white">
                  {role === 'user' ? 'Remove access (Customer)' : roleLabel(role)}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="mt-4 border-t border-white/10 pt-4">
        {member.role === 'super_admin' ? (
          <p className="text-xs text-gray-500">Super admins always hold every permission. Nothing to configure here.</p>
        ) : !isAdmin ? (
          <p className="text-xs text-gray-500">This account is not a staff member. Set the role to Admin to grant permissions.</p>
        ) : (
          <fieldset disabled={locked} className="grid gap-3 sm:grid-cols-2">
            <legend className="sr-only">Permissions for {member.full_name || member.email}</legend>
            {grantablePermissions.map((definition) => (
              <label key={definition.key} className="flex items-start gap-3 border border-white/10 bg-[#111116] p-3 transition hover:border-white/25 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60">
                <input
                  type="checkbox"
                  checked={member.permissions.includes(definition.key)}
                  onChange={() => onTogglePermission(member.user_id, definition.key)}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-red-400"
                />
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-gray-200">{t(definition.labelKey)}</span>
                  <span className="mt-0.5 block text-xs text-gray-500">{t(definition.hintKey)}</span>
                </span>
              </label>
            ))}
          </fieldset>
        )}
      </div>

      {isSelf && <p className="mt-3 text-xs text-amber-300">This is your own account, so it is locked to avoid locking yourself out.</p>}
    </li>
  );
}

export default function TeamManager() {
  const { isSuperAdmin, user } = useAuth();
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');
  const [actionNotice, setActionNotice] = useState('');
  const [savingId, setSavingId] = useState('');
  const [search, setSearch] = useState('');
  const [promoteEmail, setPromoteEmail] = useState('');
  const [isPromoting, setIsPromoting] = useState(false);

  const loadMembers = async () => {
    const result = await getTeamMembers();
    if (result.error) {
      setLoadError(result.error.message || result.error);
      return;
    }
    setMembers(result.data);
  };

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const result = await getTeamMembers();
      if (cancelled) return;
      if (result.error) setLoadError(result.error.message || result.error);
      else setMembers(result.data);
      setIsLoading(false);
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const filteredMembers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return members;
    return members.filter((member) => [member.full_name, member.email].some((value) => (value || '').toLowerCase().includes(query)));
  }, [members, search]);

  // Apply one change and keep the list in sync with the database / تنفيذ التعديل ومزامنة القائمة
  const saveMember = async (userId, updates) => {
    setSavingId(userId);
    setActionError('');
    setActionNotice('');
    const { data, error } = await updateTeamMember(userId, updates);
    setSavingId('');
    if (error) {
      setActionError(error.message || String(error));
      return;
    }
    if (data.role === 'user') {
      setMembers((current) => current.filter((member) => member.user_id !== userId));
      setActionNotice('Access removed. The account is now a regular customer.');
      return;
    }
    setMembers((current) => current.map((member) => (
      member.user_id === userId
        ? { ...member, role: data.role, permissions: data.permissions }
        : member
    )));
    setActionNotice('Team updated.');
  };

  const handleRoleChange = (userId, role) => {
    // A fresh admin starts with read-only orders access and nothing else
    // الأدمن الجديد يبدأ بمشاهدة الطلبات فقط وبدون أي صلاحيات تانية
    const member = members.find((entry) => entry.user_id === userId);
    const permissions = role === 'admin' && member && !member.permissions.length ? [PERMISSIONS.ordersView] : [];
    return saveMember(userId, { role, permissions });
  };

  const handleTogglePermission = (userId, key) => {
    const member = members.find((entry) => entry.user_id === userId);
    if (!member) return;
    const permissions = member.permissions.includes(key)
      ? member.permissions.filter((entry) => entry !== key)
      : [...member.permissions, key];
    saveMember(userId, { permissions });
  };

  const handlePromote = async (event) => {
    event.preventDefault();
    const email = promoteEmail.trim();
    if (!email) return;
    setIsPromoting(true);
    setActionError('');
    setActionNotice('');

    const lookup = await findProfileByEmail(email);
    setIsPromoting(false);
    if (lookup.error) {
      setActionError(lookup.error.message || String(lookup.error));
      return;
    }
    if (!lookup.data) {
      setActionError('No account exists with this email. Ask them to sign up first.');
      return;
    }
    if (members.some((member) => member.user_id === lookup.data.id)) {
      setActionError('This account is already on the team.');
      return;
    }

    setPromoteEmail('');
    // Promote as a read-only admin: orders are visible, nothing else until granted
    // نرقّيه كأدمن بمشاهدة الطلبات فقط لحد ما تُمنح صلاحيات إضافية
    await saveMember(lookup.data.id, { role: 'admin', permissions: [PERMISSIONS.ordersView] });
    loadMembers();
  };

  if (!isSuperAdmin) {
    return (
      <section className="max-w-xl border border-white/10 bg-[#121214] p-8">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-amber-300">Super admin only</p>
        <h2 className="text-2xl font-bold text-white">Team management is restricted.</h2>
        <p className="mt-3 text-sm leading-6 text-gray-500">Only a super admin can grant or revoke admin permissions. Ask a super admin to make the change for you.</p>
      </section>
    );
  }

  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-red-300">Access control</p>
          <h2 className="mt-2 text-2xl font-bold text-white sm:text-3xl">Team &amp; permissions</h2>
          <p className="mt-2 text-sm text-gray-500">Grant granular permissions to admins, promote a customer, or remove access. Super admins always keep full access.</p>
        </div>
        <label className="text-sm text-gray-400">
          <span className="sr-only">Search team</span>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name or email" className="w-64 rounded-md border border-white/10 bg-[#111116] px-3 py-2 text-sm text-white outline-none focus:border-red-300" />
        </label>
      </div>

      <form onSubmit={handlePromote} className="border border-white/10 bg-[#0e0e11] p-5">
        <p className="text-sm font-semibold text-white">Add a team member</p>
        <p className="mt-1 text-xs text-gray-500">Enter the email of an existing account to promote it to admin.</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <input
            type="email"
            required
            value={promoteEmail}
            onChange={(event) => setPromoteEmail(event.target.value)}
            placeholder="name@example.com"
            className="min-w-56 flex-1 rounded-md border border-white/10 bg-[#111116] px-3 py-2 text-sm text-white outline-none focus:border-red-300"
          />
          <button type="submit" disabled={isPromoting} className="rounded-md bg-red-400 px-4 py-2 text-sm font-bold text-black transition hover:bg-red-300 disabled:cursor-wait disabled:opacity-60">
            {isPromoting ? 'Adding...' : 'Add as admin'}
          </button>
        </div>
      </form>

      {loadError && <p role="alert" className="border-s-2 border-red-400 px-4 py-3 text-sm text-red-200">Could not load the team: {loadError}</p>}
      {actionError && <p role="alert" className="border-s-2 border-red-400 px-4 py-3 text-sm text-red-200">{actionError}</p>}
      {actionNotice && <p role="status" className="border-s-2 border-emerald-400 px-4 py-3 text-sm text-emerald-200">{actionNotice}</p>}

      {isLoading ? (
        <p className="py-12 text-center text-sm text-gray-500">Loading team...</p>
      ) : !filteredMembers.length ? (
        <p className="py-12 text-center text-sm text-gray-500">{members.length ? 'No team members match your search.' : 'No staff accounts yet.'}</p>
      ) : (
        <ul className="space-y-4">
          {filteredMembers.map((member) => (
            <TeamMemberCard
              key={member.user_id}
              member={member}
              isSelf={member.user_id === user?.id}
              isSaving={savingId === member.user_id}
              onRoleChange={handleRoleChange}
              onTogglePermission={handleTogglePermission}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
