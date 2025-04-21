import { useState } from 'react';
import { authService } from '../services/authService';
import { useGameStore } from '../store/gameStore';
import '../styles/AuthPage.css';

interface AuthPageProps {
  onLogin: () => void;
}

export default function AuthPage({ onLogin }: AuthPageProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [message, setMessage] = useState({ text: '', isError: false });
  const [loading, setLoading] = useState(false);
  const loadPlayerScore = useGameStore(state => state.loadPlayerScore);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage({ text: '', isError: false });
    setLoading(true);

    try {
      if (isLogin) {
        const result = await authService.login(username, password);
        if (result.success) {
          setMessage({ text: 'Login successful!', isError: false });
          await loadPlayerScore(); // Load player's score after successful login
          // Ensure we transition to game immediately
          setLoading(false);
          onLogin();
          return; // Exit early to prevent the loading state from being reset
        } else {
          setMessage({ text: result.message || 'Login failed', isError: true });
        }
      } else {
        const result = await authService.register(username, password, displayName);
        if (result.success) {
          setMessage({ text: 'Registration successful!', isError: false });
          // Auto login after successful registration
          const loginResult = await authService.login(username, password);
          if (loginResult.success) {
            await loadPlayerScore(); // Load player's score after successful login
            setLoading(false);
            onLogin();
            return; // Exit early to prevent the loading state from being reset
          }
        } else {
          setMessage({ text: result.message || 'Registration failed', isError: true });
        }
      }
    } catch (err: unknown) {
      console.error('Auth error:', err);
      setMessage({ text: 'An unexpected error occurred. Please try again.', isError: true });
    }
    setLoading(false);
  };

  const handleGuestLogin = async () => {
    setMessage({ text: '', isError: false });
    setLoading(true);
    try {
      const result = await authService.createGuestAccount();
      if (result.success) {
        setMessage({ text: 'Logging in as guest...', isError: false });
        setLoading(false);
        onLogin();
        return; // Exit early to prevent the loading state from being reset
      } else {
        setMessage({ text: result.message || 'Failed to create guest account', isError: true });
      }
    } catch (err: unknown) {
      console.error('Guest login error:', err);
      setMessage({ text: 'Failed to create guest account. Please try again.', isError: true });
    }
    setLoading(false);
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h1>RoboVerse</h1>
        <div className="auth-form-container">
          <div className="auth-tabs">
            <button 
              className={isLogin ? 'active' : ''} 
              onClick={() => {
                setIsLogin(true);
                setMessage({ text: '', isError: false });
              }}
            >
              Login
            </button>
            <button 
              className={!isLogin ? 'active' : ''} 
              onClick={() => {
                setIsLogin(false);
                setMessage({ text: '', isError: false });
              }}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            {!isLogin && (
              <div className="form-group">
                <input
                  type="text"
                  placeholder="Display Name (optional)"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </div>
            )}

            <div className="form-group">
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {message.text && (
              <div className={`auth-message ${message.isError ? 'error' : 'success'}`}>
                {message.text}
              </div>
            )}

            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? 'Please wait...' : isLogin ? 'Login' : 'Register'}
            </button>
          </form>

          <div className="auth-divider">
            <span>or</span>
          </div>

          <button 
            onClick={handleGuestLogin} 
            className="guest-button"
            disabled={loading}
            title="Guest progress will not persist outside of the current session"
          >
            Continue as Guest
          </button>
        </div>
      </div>
    </div>
  );
}