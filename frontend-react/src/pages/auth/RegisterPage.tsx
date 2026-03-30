import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/stores/auth';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register, isLoading, error, clearError } = useAuthStore();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showConfPw, setShowConfPw] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const pwHas8 = password.length >= 8;
  const pwHasUpper = /[A-Z]/.test(password);
  const pwHasNum = /\d/.test(password);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    clearError();
    setLocalError(null);

    if (!agreeTerms) {
      setLocalError('You must agree to the Terms & Conditions.');
      return;
    }
    if (password !== confirmPw) {
      setLocalError('Passwords do not match.');
      return;
    }
    if (!pwHas8 || !pwHasUpper || !pwHasNum) {
      setLocalError('Password does not meet requirements.');
      return;
    }

    const ok = await register({
      email,
      password,
      firstName,
      lastName,
      phone: phone || undefined,
    });

    if (ok) {
      toast.success('Account created successfully!');
      navigate('/', { replace: true });
    }
  };

  const displayError = localError || error;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-10">
      <div className="w-full max-w-[500px]">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
        </div>

        <h1 className="text-3xl font-light text-center font-sans mb-1">Create Account</h1>
        <p className="text-sm text-gray-500 text-center mb-8">
          Join us for an exclusive shopping experience
        </p>

        {displayError && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded p-3 mb-4">
            {displayError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                First Name
              </label>
              <input
                id="firstName"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
              />
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                Last Name
              </label>
              <input
                id="lastName"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number <span className="text-gray-400">(Optional)</span>
            </label>
            <input
              id="phone"
              type="tel"
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
            />
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPw ? 'text' : 'password'}
                required
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label={showPw ? 'Hide password' : 'Show password'}
              >
                {showPw ? '🙈' : '👁'}
              </button>
            </div>
            {/* Requirements */}
            {password.length > 0 && (
              <ul className="mt-2 text-xs space-y-1">
                <li className={pwHas8 ? 'text-green-600' : 'text-gray-400'}>
                  {pwHas8 ? '✓' : '○'} At least 8 characters
                </li>
                <li className={pwHasUpper ? 'text-green-600' : 'text-gray-400'}>
                  {pwHasUpper ? '✓' : '○'} One uppercase letter
                </li>
                <li className={pwHasNum ? 'text-green-600' : 'text-gray-400'}>
                  {pwHasNum ? '✓' : '○'} One number
                </li>
              </ul>
            )}
          </div>

          {/* Confirm password */}
          <div>
            <label htmlFor="confirmPw" className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password
            </label>
            <div className="relative">
              <input
                id="confirmPw"
                type={showConfPw ? 'text' : 'password'}
                required
                autoComplete="new-password"
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfPw(!showConfPw)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label={showConfPw ? 'Hide password' : 'Show password'}
              >
                {showConfPw ? '🙈' : '👁'}
              </button>
            </div>
          </div>

          {/* Terms checkbox */}
          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              className="mt-0.5 accent-primary"
            />
            <span className="text-sm text-gray-600">
              I agree to the{' '}
              <Link to="/terms" className="text-primary hover:underline">
                Terms &amp; Conditions
              </Link>
            </span>
          </label>

          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full flex items-center justify-center"
          >
            {isLoading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              'CREATE ACCOUNT'
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{' '}
          <Link to="/login" className="text-primary font-medium hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
