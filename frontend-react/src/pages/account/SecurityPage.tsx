import { useState } from 'react';
import toast from 'react-hot-toast';
import { authApi } from '@/api/auth';
import { useAuthStore } from '@/stores/auth';

export default function SecurityPage() {
  const { user } = useAuthStore();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [show, setShow] = useState({ current: false, new_: false, confirm: false });
  const [saving, setSaving] = useState(false);

  const update = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const validations = [
    { ok: form.newPassword.length >= 8, label: 'At least 8 characters' },
    { ok: /[A-Z]/.test(form.newPassword), label: 'One uppercase letter' },
    { ok: /[a-z]/.test(form.newPassword), label: 'One lowercase letter' },
    { ok: /\d/.test(form.newPassword), label: 'One number' },
  ];

  const allValid = validations.every((v) => v.ok) && form.newPassword === form.confirmPassword && form.currentPassword.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allValid) {
      toast.error('Please fix the validation errors');
      return;
    }
    setSaving(true);
    try {
      await authApi.changePassword(form.currentPassword, form.newPassword);
      toast.success('Password changed successfully');
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch {
      toast.error('Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h1 className="text-xl font-bold mb-6">Security</h1>

      {/* Change Password */}
      <div className="border border-gray-200 rounded-lg p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-[#B8860B]/10 flex items-center justify-center">
            <svg className="w-5 h-5 text-[#B8860B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </div>
          <div>
            <h2 className="text-sm font-semibold">Change Password</h2>
            <p className="text-xs text-gray-500">Update your password regularly for better security</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {([
            ['currentPassword', 'Current Password', 'current'] as const,
            ['newPassword', 'New Password', 'new_'] as const,
            ['confirmPassword', 'Confirm New Password', 'confirm'] as const,
          ]).map(([key, label, showKey]) => (
            <div key={key}>
              <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
              <div className="relative">
                <input
                  type={show[showKey] ? 'text' : 'password'}
                  value={form[key]}
                  onChange={(e) => update(key, e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2.5 text-sm pr-10 focus:outline-none focus:border-[#B8860B]"
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => ({ ...s, [showKey]: !s[showKey] }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {show[showKey] ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  )}
                </button>
              </div>
            </div>
          ))}

          {/* Validation checklist */}
          {form.newPassword && (
            <div className="space-y-1">
              {validations.map((v) => (
                <p key={v.label} className={`text-xs flex items-center gap-1.5 ${v.ok ? 'text-green-600' : 'text-gray-400'}`}>
                  {v.ok ? '✓' : '○'} {v.label}
                </p>
              ))}
              <p className={`text-xs flex items-center gap-1.5 ${form.newPassword === form.confirmPassword && form.confirmPassword ? 'text-green-600' : 'text-gray-400'}`}>
                {form.newPassword === form.confirmPassword && form.confirmPassword ? '✓' : '○'} Passwords match
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={!allValid || saving}
            className="px-6 py-2.5 bg-black text-white text-sm font-semibold rounded hover:bg-gray-900 transition-colors disabled:opacity-50"
          >
            {saving ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>

      {/* Account info */}
      <div className="border border-gray-200 rounded-lg p-6">
        <h2 className="text-sm font-semibold mb-3">Account Information</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Member Since</span>
            <p className="font-medium">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</p>
          </div>
          <div>
            <span className="text-gray-500">Last Login</span>
            <p className="font-medium">{user?.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'N/A'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
