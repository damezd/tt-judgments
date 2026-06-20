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
        <h1 className="text-center font-extrabold mb-1"
          style={{ fontSize: '1.7rem', letterSpacing: '-.02em', textShadow: '0 4px 20px rgba(0,0,0,.3)' }}>
          TT Judgments Intel
        </h1>
        <p className="text-center text-xs mb-6" style={{ color: 'rgba(238,244,255,.6)' }}>
          Court-judgment knowledge base · enter password to continue
        </p>
        <form onSubmit={handleSubmit}>
          <label className="block text-xs mb-1.5" style={{ color: 'rgba(238,244,255,.8)' }}>Password</label>
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
