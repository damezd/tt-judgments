import { useState } from 'react';
import { login } from '../api/auth';

export default function LoginPage({ onLogin }) {
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(password);
      onLogin();
    } catch (err) {
      setError(err.message || 'Sign-in failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="glass p-8 w-full max-w-sm panel-in">
        <h1 className="text-center mb-1"
          style={{ fontFamily: 'var(--serif)', fontSize: '2rem', letterSpacing: '-.01em' }}>
          Insight<span style={{ color: 'var(--red)' }}>TT</span>
        </h1>
        <p className="text-center text-xs mb-6" style={{ color: 'var(--muted)' }}>
          Court-judgment knowledge base · enter password to continue
        </p>
        <form onSubmit={handleSubmit}>
          <label className="block text-xs mb-1.5" style={{ color: 'var(--muted)' }}>Password</label>
          <input className="field-input mb-4" type="password" placeholder="••••••••"
            autoComplete="current-password" value={password}
            onChange={e => setPassword(e.target.value)} autoFocus />
          {error && <p className="text-red-300 text-xs mb-3">{error}</p>}
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? 'Checking…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
