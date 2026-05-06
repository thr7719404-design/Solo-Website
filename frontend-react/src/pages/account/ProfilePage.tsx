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
  const [resending, setResending] = useState(false);

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
    setResending(true);
    try {
      await authApi.resendVerification(profile.email);
      toast.success('Verification email sent — check your inbox');
    } catch {
      toast.error('Could not send verification email');
    } finally {
      setResending(false);
    }
  };

  if (!profile) {
    return (
      <div className="py-20 text-center">
        <div className="w-8 h-8 border-2 border-[#B8860B] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-gray-400 mt-3">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your personal information</p>
        </div>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-black text-white text-sm font-semibold rounded-xl hover:bg-gray-900 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
            </svg>
            Edit Profile
          </button>
        )}
      </div>

      {/* Verification banner */}
      {!profile.emailVerified && (
        <div className="flex items-center gap-4 bg-amber-50 border border-amber-200 rounded-xl px-5 py-4">
          <div className="flex-shrink-0 w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-800">Verify your email address</p>
            <p className="text-xs text-amber-600 mt-0.5">Please verify your email to unlock all features and secure your account.</p>
          </div>
          <button
            onClick={handleResendVerification}
            disabled={resending}
            className="flex-shrink-0 px-4 py-2 text-xs font-semibold bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50"
          >
            {resending ? 'Sending...' : 'Resend Email'}
          </button>
        </div>
      )}

      {/* Profile details card */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">Personal Information</h2>
        </div>
        <div className="p-6 space-y-5">
          {/* Email */}
          <div>
            <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5">Email</label>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-900">{profile.email}</span>
              <span
                className={`inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-medium ${
                  profile.emailVerified
                    ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                    : 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'
                }`}
              >
                {profile.emailVerified ? (
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                  </svg>
                )}
                {profile.emailVerified ? 'Verified' : 'Unverified'}
              </span>
            </div>
          </div>

          {/* Editable fields */}
          {editing ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="first-name" className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5">First Name</label>
                  <input id="first-name"
                    value={form.firstName ?? ''}
                    onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#B8860B]/20 focus:border-[#B8860B] transition-all"
                  />
                </div>
                <div>
                  <label htmlFor="last-name" className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5">Last Name</label>
                  <input id="last-name"
                    value={form.lastName ?? ''}
                    onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#B8860B]/20 focus:border-[#B8860B] transition-all"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="phone" className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5">Phone</label>
                <input id="phone"
                  value={form.phone ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="+971 50 123 4567"
                  className="w-full sm:w-1/2 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#B8860B]/20 focus:border-[#B8860B] transition-all"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-6 py-2.5 bg-[#B8860B] text-white text-sm font-semibold rounded-xl hover:bg-[#9a7209] transition-colors disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={() => {
                    setEditing(false);
                    setForm({ firstName: profile.firstName ?? '', lastName: profile.lastName ?? '', phone: profile.phone ?? '' });
                  }}
                  className="px-6 py-2.5 border border-gray-200 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5">First Name</label>
                <p className="text-sm font-medium text-gray-900">{profile.firstName || '—'}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5">Last Name</label>
                <p className="text-sm font-medium text-gray-900">{profile.lastName || '—'}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5">Phone</label>
                <p className="text-sm font-medium text-gray-900">{profile.phone || '—'}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Account info */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">Account Information</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5">Role</label>
              <p className="text-sm font-medium text-gray-900 capitalize">{user?.role ?? profile.role}</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5">Member Since</label>
              <p className="text-sm font-medium text-gray-900">{profile.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5">Account Status</label>
              <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                Active
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
