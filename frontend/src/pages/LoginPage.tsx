import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      navigate('/');
    } catch {
      setError('Неверный логин или пароль');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
      <main className="w-full max-w-[400px] flex flex-col items-center">
        {/* Logo Section */}
        <header className="mb-12 text-center">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mb-4 mx-auto">
            <span className="material-symbols-outlined text-white text-[28px]">event</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Добро пожаловать</h1>
          <p className="text-sm text-gray-500 mt-1">Войдите, чтобы управлять встречами</p>
        </header>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="w-full space-y-4">
          {/* Username Field */}
          <div className="space-y-1">
            <label className="block text-sm font-semibold text-gray-600" htmlFor="username">
              Имя пользователя
            </label>
            <div className="relative border border-gray-200 bg-white rounded-lg transition-all overflow-hidden focus-within:ring-2 focus-within:ring-blue-600/15 focus-within:border-blue-600">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-[20px]">
                person
              </span>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="ivanov"
                required
                className="w-full pl-10 pr-4 h-11 bg-transparent border-none focus:ring-0 text-sm placeholder:text-gray-400"
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-1">
            <label className="block text-sm font-semibold text-gray-600" htmlFor="password">
              Пароль
            </label>
            <div className="relative border border-gray-200 bg-white rounded-lg transition-all overflow-hidden focus-within:ring-2 focus-within:ring-blue-600/15 focus-within:border-blue-600">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-[20px]">
                lock
              </span>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full pl-10 pr-12 h-11 bg-transparent border-none focus:ring-0 text-sm placeholder:text-gray-400"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 p-1"
              >
                <span className="material-symbols-outlined text-[20px]">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          {/* Login Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white text-sm font-semibold h-11 rounded-lg shadow-sm hover:bg-blue-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
            ) : (
              <>
                Войти
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <footer className="mt-12 flex flex-col items-center gap-3">
          <div className="h-px w-16 bg-gray-200" />
          <p className="text-xs text-gray-400">© 2026 MeetManager</p>
        </footer>
      </main>
    </div>
  );
}
