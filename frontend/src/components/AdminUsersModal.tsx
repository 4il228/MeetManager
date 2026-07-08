import { useState, useEffect, useCallback } from 'react';
import apiClient from '../api/client';

interface User {
  id: string;
  username: string;
  full_name: string;
  is_admin: boolean;
}

interface AdminUsersModalProps {
  isOpen: boolean;
  currentUserId?: string;
  onClose: () => void;
  onSuccess: (message: string, deletedUserId?: string) => void;
}

export default function AdminUsersModal({
  isOpen,
  currentUserId,
  onClose,
  onSuccess,
}: AdminUsersModalProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const fetchUsers = useCallback(async () => {
    setListLoading(true);
    try {
      const { data } = await apiClient.get<User[]>('/users');
      setUsers(data);
    } catch {
      setUsers([]);
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    setError('');
    setConfirmDeleteId(null);
    fetchUsers();
  }, [isOpen, fetchUsers]);

  const resetForm = () => {
    setUsername('');
    setPassword('');
    setFullName('');
    setShowPassword(false);
  };

  const handleClose = () => {
    resetForm();
    setError('');
    setConfirmDeleteId(null);
    onClose();
  };

  const parseError = (err: unknown, fallback: string) => {
    const axiosErr = err as {
      response?: { status?: number; data?: { detail?: string | { msg?: string }[] } };
    };
    if (axiosErr.response?.status === 404) {
      const detail = axiosErr.response.data?.detail;
      if (detail === 'Not Found') {
        return 'Сервер устарел (нет DELETE /users). stop.bat → start.bat';
      }
      return typeof detail === 'string'
        ? detail
        : 'Пользователь не найден';
    }
    if (axiosErr.response?.status === 409) {
      return typeof axiosErr.response.data?.detail === 'string'
        ? axiosErr.response.data.detail
        : 'Конфликт при выполнении операции';
    }
    if (axiosErr.response?.status === 403) {
      return typeof axiosErr.response.data?.detail === 'string'
        ? axiosErr.response.data.detail
        : 'Недостаточно прав';
    }
    if (axiosErr.response?.status === 422) {
      const detail = axiosErr.response.data?.detail;
      return Array.isArray(detail)
        ? detail.map((d) => d.msg).join(', ')
        : String(detail || 'Ошибка валидации');
    }
    if (axiosErr.response?.status === 405) {
      return 'Сервер устарел. Запустите stop.bat, затем start.bat';
    }
    return fallback;
  };

  const handleSubmit = async () => {
    if (!username.trim() || !password || !fullName.trim()) return;
    setLoading(true);
    setError('');
    try {
      const { data } = await apiClient.post('/users', {
        username: username.trim().toLowerCase(),
        password,
        full_name: fullName.trim(),
      });
      resetForm();
      await fetchUsers();
      onSuccess(`Пользователь ${data.full_name} создан`);
    } catch (err: unknown) {
      setError(parseError(err, 'Не удалось создать пользователя'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (user: User) => {
    setDeletingId(user.id);
    setError('');
    try {
      await apiClient.delete(`/users/${user.id}`);
      setUsers((prev) => prev.filter((item) => item.id !== user.id));
      setConfirmDeleteId(null);
      onSuccess(`Пользователь ${user.full_name} удалён`, user.id);
    } catch (err: unknown) {
      setError(parseError(err, 'Не удалось удалить пользователя'));
    } finally {
      setDeletingId(null);
    }
  };

  if (!isOpen) return null;

  const canDelete = (user: User) =>
    user.id !== currentUserId && !user.is_admin && user.username !== 'admin';

  return (
    <div
      className="fixed inset-0 z-[55] flex items-end sm:items-center justify-center bg-black/50"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 space-y-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">
                Администрирование
              </p>
              <h2 className="text-lg font-bold text-gray-900">Пользователи</h2>
            </div>
            <button
              onClick={handleClose}
              className="p-2 min-h-11 min-w-11 rounded-full hover:bg-gray-100 flex items-center justify-center"
              aria-label="Закрыть"
            >
              <span className="material-symbols-outlined text-gray-500">close</span>
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900">Новый пользователь</h3>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">ФИО</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Иванов Иван Иванович"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-11"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Логин</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="ivanov"
                autoComplete="off"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-11"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Пароль</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="минимум 8 символов"
                  autoComplete="new-password"
                  className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 p-1"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>
            <button
              onClick={handleSubmit}
              disabled={loading || !username.trim() || !password || !fullName.trim()}
              className="w-full py-3 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-40 min-h-11"
            >
              {loading ? 'Создание...' : 'Создать пользователя'}
            </button>
          </div>

          <div className="pt-4 border-t border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Все пользователи ({users.length})
            </h3>
            {listLoading ? (
              <p className="text-sm text-gray-400 text-center py-4">Загрузка...</p>
            ) : (
              <ul className="space-y-2 max-h-48 overflow-y-auto">
                {users.map((u) => (
                  <li
                    key={u.id}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-gray-100 bg-gray-50"
                  >
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-600 text-sm font-semibold">
                        {u.full_name.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{u.full_name}</p>
                      <p className="text-xs text-gray-500 truncate">@{u.username}</p>
                    </div>
                    {u.is_admin && (
                      <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full flex-shrink-0">
                        админ
                      </span>
                    )}
                    {canDelete(u) && (
                      confirmDeleteId === u.id ? (
                        <div className="flex gap-1 flex-shrink-0">
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            disabled={deletingId === u.id}
                            className="px-2 py-1 text-xs font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg min-h-8"
                          >
                            Нет
                          </button>
                          <button
                            onClick={() => handleDelete(u)}
                            disabled={deletingId === u.id}
                            className="px-2 py-1 text-xs font-semibold text-white bg-red-600 rounded-lg min-h-8 disabled:opacity-50"
                          >
                            {deletingId === u.id ? '...' : 'Да'}
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteId(u.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg min-h-8 min-w-8 flex items-center justify-center flex-shrink-0"
                          aria-label={`Удалить ${u.full_name}`}
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      )
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="border-t border-gray-200">
          <button
            onClick={handleClose}
            className="w-full py-3.5 text-sm font-semibold text-gray-600 active:bg-gray-50 transition-colors min-h-11"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}
