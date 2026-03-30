import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { accountApi } from '@/api/account';
import { authApi } from '@/api/auth';
import { useAuthStore } from '@/stores/auth';
import type { ProfileDto, UpdateProfileRequest } from '@/types';

export default function ProfilePage() {
  const { user } = useAuthStore();
  const [profile, setProfile] = useState<ProfileDto | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<UpdateProfileRequest>({ firstName: '', lastName: '', phone: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    accountApi.getProfile().then((p) => {
      setProfile(p);
      setForm({ firstName: p.firstName ?? '', lastName: p.lastName ?? '', phone: p.phone ?? '' });
    });
  }, []);

  const handleSave = async () => {
    if (!form.firstName || form.firstName.length < 2) {
      toast.error('First name must be at least 2 characters');
      return;
    }
    if (!form.lastName || form.lastName.length < 2) {
      toast.error('Last name must be at least 2 characters');
      return;
    }
    setSaving(true);
    try {
      const updated = await accountApi.updateProfile(form);
      setProfile(updated);
      setEditing(false);
      toast.success('Profile updated');
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleResendVerification = async () => {
    if (!profile?.email) return;
    try {
      await authApi.resendVerification(profile.email);
      toast.success('Verification email sent');
    } catch {
      toast.error('Could not send verification email');
    }
  };

  if (!profile) {
    return <div className="py-12 text-center text-gray-400">Loading profile...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">Profile</h1>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="text-sm font-semibold text-[#B8860B] hover:underline"
          >
            Edit
          </button>
        )}
      </div>

      <div className="border border-gray-200 rounded-lg p-6 space-y-5">
        {/* Email */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
          <div className="flex items-center gap-2">
            <span className="text-sm">{profile.email}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${profile.emailVerified ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
              {profile.emailVerified ? 'Verified' : 'Not Verified'}
            </span>
          </div>
          {!profile.emailVerified && (
            <button onClick={handleResendVerification} className="mt-1 text-xs text-[#B8860B] underline">
              Resend verification email
            </button>
          )}
        </div>

        {/* First Name */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">First Name</label>
          {editing ? (
            <input
              value={form.firstName ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#B8860B]"
            />
          ) : (
            <p className="text-sm">{profile.firstName || '—'}</p>
          )}
        </div>

        {/* Last Name */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Last Name</label>
          {editing ? (
            <input
              value={form.lastName ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#B8860B]"
            />
          ) : (
            <p className="text-sm">{profile.lastName || '—'}</p>
          )}
        </div>

        {/* Phone */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Phone</label>
          {editing ? (
            <input
              value={form.phone ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              placeholder="+971 50 123 4567"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#B8860B]"
            />
          ) : (
            <p className="text-sm">{profile.phone || '—'}</p>
          )}
        </div>

        {/* Editing buttons */}
        {editing && (
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 bg-black text-white text-sm font-semibold rounded hover:bg-gray-900 transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={() => {
                setEditing(false);
                setForm({ firstName: profile.firstName ?? '', lastName: profile.lastName ?? '', phone: profile.phone ?? '' });
              }}
              className="px-6 py-2 border border-gray-300 text-sm font-semibold rounded hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Account info */}
      <div className="border border-gray-200 rounded-lg p-6 mt-6">
        <h2 className="text-sm font-semibold mb-3">Account Information</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Role</span>
            <p className="font-medium capitalize">{user?.role ?? profile.role}</p>
          </div>
          <div>
            <span className="text-gray-500">Member Since</span>
            <p className="font-medium">{profile.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'N/A'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
