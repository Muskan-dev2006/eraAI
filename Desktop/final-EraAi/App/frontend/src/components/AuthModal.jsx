import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Eye, EyeOff, Mail, Lock, User, AlertCircle, CheckCircle, ChevronDown } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';

const GOOGLE_CONFIGURED = process.env.REACT_APP_GOOGLE_CLIENT_ID &&
  process.env.REACT_APP_GOOGLE_CLIENT_ID !== 'your_google_client_id_here';

function FieldError({ msg }) {
  if (!msg) return null;
  return (
    <p className="flex items-center gap-1 text-xs text-danger mt-1">
      <AlertCircle size={11} /> {msg}
    </p>
  );
}

function PasswordStrength({ password }) {
  if (!password) return null;
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const colors = ['', 'bg-danger', 'bg-warning', 'bg-primary', 'bg-success'];

  return (
    <div className="mt-1.5">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= score ? colors[score] : 'bg-dark-border'}`} />
        ))}
      </div>
      <p className={`text-xs mt-0.5 ${score <= 1 ? 'text-danger' : score === 2 ? 'text-warning' : score === 3 ? 'text-primary' : 'text-success'}`}>
        {labels[score]}
      </p>
    </div>
  );
}

function InputField({ label, type = 'text', value, onChange, error, placeholder, icon: Icon, rightElement }) {
  return (
    <div>
      <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">{label}</label>
      <div className="relative mt-1">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
            <Icon size={15} />
          </div>
        )}
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`w-full bg-dark-bg border rounded-xl px-4 py-2 text-sm text-white focus:outline-none transition-colors
            ${Icon ? 'pl-9' : ''}
            ${rightElement ? 'pr-10' : ''}
            ${error ? 'border-danger/60 focus:border-danger' : 'border-dark-border focus:border-primary/60'}`}
        />
        {rightElement && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">{rightElement}</div>
        )}
      </div>
      <FieldError msg={error} />
    </div>
  );
}

export default function AuthModal({ isOpen, onClose, defaultTab = 'login' }) {
  const [tab, setTab] = useState(defaultTab);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [errors, setErrors] = useState({});

  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [signupData, setSignupData] = useState({ name: '', email: '', password: '', stream: '', college: '', year: '' });

  const { login, register, googleLogin } = useAuth();

  const setL = (field) => (e) => { setLoginData(p => ({ ...p, [field]: e.target.value })); setErrors(p => ({ ...p, [field]: '' })); setApiError(''); };
  const setS = (field) => (e) => { setSignupData(p => ({ ...p, [field]: e.target.value })); setErrors(p => ({ ...p, [field]: '' })); setApiError(''); };

  const validateLogin = () => {
    const e = {};
    if (!loginData.email) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(loginData.email)) e.email = 'Invalid email address';
    if (!loginData.password) e.password = 'Password is required';
    return e;
  };

  const validateSignup = () => {
    const e = {};
    if (!signupData.name.trim()) e.name = 'Name is required';
    else if (signupData.name.trim().length < 2) e.name = 'Name must be at least 2 characters';
    if (!signupData.email) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(signupData.email)) e.email = 'Invalid email address';
    if (!signupData.password) e.password = 'Password is required';
    else if (signupData.password.length < 8) e.password = 'Must be at least 8 characters';
    else if (!/[A-Z]/.test(signupData.password)) e.password = 'Must include an uppercase letter';
    else if (!/\d/.test(signupData.password)) e.password = 'Must include a number';
    if (!signupData.stream) e.stream = 'Please select your stream';
    return e;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const errs = validateLogin();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    setApiError('');
    try {
      await login(loginData.email, loginData.password);
      onClose();
    } catch (err) {
      setApiError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    const errs = validateSignup();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    setApiError('');
    try {
      await register({ name: signupData.name.trim(), email: signupData.email, password: signupData.password, stream: signupData.stream, college: signupData.college.trim(), year: signupData.year });
      onClose();
    } catch (err) {
      setApiError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    setApiError('');
    try {
      await googleLogin(credentialResponse.credential);
      onClose();
    } catch (err) {
      setApiError(err.response?.data?.message || 'Google sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const switchTab = (t) => { setTab(t); setErrors({}); setApiError(''); };

  const eyeBtn = (show, toggle) => (
    <button type="button" onClick={toggle} className="text-text-muted hover:text-text-secondary transition-colors">
      {show ? <EyeOff size={15} /> : <Eye size={15} />}
    </button>
  );

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 24 }}
          transition={{ type: 'spring', stiffness: 320, damping: 28 }}
          className="bg-dark-card border border-dark-border rounded-2xl w-full max-w-xl shadow-2xl overflow-y-auto"
          style={{ maxHeight: '90vh' }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-6 pb-4">
            <div>
              <h2 className="text-xl font-black text-white">
                {tab === 'login' ? 'Welcome back' : 'Create account'}
              </h2>
              <p className="text-text-secondary text-sm mt-0.5">
                {tab === 'login' ? 'Sign in to your eraAI account' : 'Start your AI assessment journey'}
              </p>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-dark-bg border border-dark-border flex items-center justify-center text-text-muted hover:text-white transition-colors">
              <X size={15} />
            </button>
          </div>

          {/* Tabs */}
          <div className="px-6">
            <div className="flex bg-dark-bg rounded-xl p-1 gap-1">
              {['login', 'signup'].map(t => (
                <button key={t} onClick={() => switchTab(t)}
                  className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all duration-200
                    ${tab === t ? 'bg-dark-card text-white shadow-sm' : 'text-text-secondary hover:text-white'}`}>
                  {t === 'login' ? 'Sign In' : 'Sign Up'}
                </button>
              ))}
            </div>
          </div>

          <div className="px-6 py-4 space-y-3">
            {/* API Error */}
            {apiError && (
              <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 px-3 py-2.5 bg-danger/10 border border-danger/20 rounded-xl text-danger text-sm">
                <AlertCircle size={14} className="shrink-0" />
                {apiError}
              </motion.div>
            )}

            {/* Login Form — inputs at top */}
            {tab === 'login' && (
              <form onSubmit={handleLogin} className="space-y-4">
                <InputField label="Email" type="email" value={loginData.email} onChange={setL('email')}
                  placeholder="your@email.com" icon={Mail} error={errors.email} />
                <InputField label="Password" type={showPass ? 'text' : 'password'} value={loginData.password}
                  onChange={setL('password')} placeholder="••••••••" icon={Lock} error={errors.password}
                  rightElement={eyeBtn(showPass, () => setShowPass(p => !p))} />
                <button type="submit" disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-xl font-semibold text-sm btn-glow transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                  {loading ? (
                    <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Signing in...</>
                  ) : (
                    <><CheckCircle size={15} /> Sign In</>
                  )}
                </button>
              </form>
            )}

            {/* Signup Form — inputs at top */}
            {tab === 'signup' && (
              <form onSubmit={handleSignup} className="space-y-4">
                <InputField label="Full Name" value={signupData.name} onChange={setS('name')}
                  placeholder="Your name" icon={User} error={errors.name} />
                <InputField label="College Name" value={signupData.college} onChange={setS('college')}
                  placeholder="Your college / university" icon={User} error={errors.college} />
                <InputField label="Email" type="email" value={signupData.email} onChange={setS('email')}
                  placeholder="your@email.com" icon={Mail} error={errors.email} />
                <div>
                  <InputField label="Password" type={showPass ? 'text' : 'password'} value={signupData.password}
                    onChange={setS('password')} placeholder="Min 8 chars, 1 uppercase, 1 number" icon={Lock}
                    error={errors.password} rightElement={eyeBtn(showPass, () => setShowPass(p => !p))} />
                  <PasswordStrength password={signupData.password} />
                </div>

                {/* Stream + Year row */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Stream Dropdown */}
                  <div>
                    <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Assessment Stream</label>
                    <div className="relative mt-1">
                      <select
                        value={signupData.stream}
                        onChange={e => { setSignupData(p => ({ ...p, stream: e.target.value })); setErrors(p => ({ ...p, stream: '' })); setApiError(''); }}
                        className={`w-full appearance-none bg-dark-bg border rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-colors pr-10
                          ${signupData.stream ? 'text-white' : 'text-text-muted'}
                          ${errors.stream ? 'border-danger/60 focus:border-danger' : 'border-dark-border focus:border-primary/60'}`}
                      >
                        <option value="" disabled>Select stream</option>
                        <option value="DSA">💻 DSA</option>
                        <option value="AI/ML">🤖 AI/ML</option>
                        <option value="Web Dev">🌐 Web Dev</option>
                        <option value="CS Fundamentals">🖥️ CS Fundamentals</option>
                      </select>
                      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                    </div>
                    {errors.stream && <p className="flex items-center gap-1 text-xs text-danger mt-1"><AlertCircle size={11} /> {errors.stream}</p>}
                  </div>

                  {/* Year Dropdown */}
                  <div>
                    <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Year</label>
                    <div className="relative mt-1">
                      <select
                        value={signupData.year}
                        onChange={e => { setSignupData(p => ({ ...p, year: e.target.value })); setApiError(''); }}
                        className={`w-full appearance-none bg-dark-bg border rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-colors pr-10
                          ${signupData.year ? 'text-white' : 'text-text-muted'}
                          border-dark-border focus:border-primary/60`}
                      >
                        <option value="" disabled>Select year</option>
                        <option value="1st Year">1st Year</option>
                        <option value="2nd Year">2nd Year</option>
                        <option value="3rd Year">3rd Year</option>
                        <option value="4th Year">4th Year</option>
                        <option value="Graduate">Graduate</option>
                      </select>
                      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                    </div>
                  </div>
                </div>

                <button type="submit" disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-xl font-semibold text-sm btn-glow transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                  {loading ? (
                    <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creating account...</>
                  ) : (
                    <><CheckCircle size={15} /> Create Account</>
                  )}
                </button>
                <p className="text-xs text-text-muted text-center">
                  By signing up you agree to our{' '}
                  <span className="text-primary cursor-pointer hover:underline">Terms of Use</span> and{' '}
                  <span className="text-primary cursor-pointer hover:underline">Privacy Policy</span>
                </p>
              </form>
            )}

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-dark-border" />
              <span className="text-xs text-text-muted">or continue with</span>
              <div className="flex-1 h-px bg-dark-border" />
            </div>

            {/* Google Button — authorization at bottom */}
            {GOOGLE_CONFIGURED ? (
              <div className="flex justify-center">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => setApiError('Google sign-in failed. Please try again.')}
                  text={tab === 'login' ? 'signin_with' : 'signup_with'}
                  shape="rectangular"
                  size="large"
                  width="368"
                  theme="outline"
                />
              </div>
            ) : (
              <button disabled
                className="w-full flex items-center justify-center gap-3 py-2.5 border border-dark-border rounded-xl text-text-muted text-sm cursor-not-allowed bg-dark-bg">
                <svg width="18" height="18" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                </svg>
                Continue with Google
              </button>
            )}

            {/* Cross-link */}
            <p className="text-center text-xs text-text-muted">
              {tab === 'login' ? "Don't have an account? " : 'Already have an account? '}
              <button onClick={() => switchTab(tab === 'login' ? 'signup' : 'login')}
                className="text-primary hover:underline font-medium">
                {tab === 'login' ? 'Sign Up' : 'Sign In'}
              </button>
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
