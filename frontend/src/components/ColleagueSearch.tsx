import { useState, useEffect, useCallback } from 'react';
import apiClient from '../api/client';

interface User {
  id: string;
  username: string;
  full_name: string;
}

interface ColleagueSearchProps {
  onSelectUser: (userId: string | null) => void;
  selectedUserId: string | null;
}

export default function ColleagueSearch({ onSelectUser, selectedUserId }: ColleagueSearchProps) {
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const searchUsers = useCallback(async (search: string) => {
    if (!search.trim()) {
      setUsers([]);
      return;
    }
    setLoading(true);
    try {
      const { data } = await apiClient.get(`/users?search=${encodeURIComponent(search)}`);
      setUsers(data);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      searchUsers(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, searchUsers]);

  const handleSelect = (user: User) => {
    setQuery(user.full_name);
    setShowDropdown(false);
    onSelectUser(user.id);
  };

  const handleClear = () => {
    setQuery('');
    setUsers([]);
    setShowDropdown(false);
    onSelectUser(null);
  };

  return (
    <div className="relative">
      <div className="relative flex items-center">
        <span className="material-symbols-outlined absolute left-3 text-gray-500 text-[20px]">
          person_search
        </span>
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
          placeholder="Поиск коллег"
          className="w-full h-10 pl-10 pr-10 bg-gray-100 border border-gray-200 rounded-xl text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all outline-none"
        />
        {(query || selectedUserId) && (
          <button
            onClick={handleClear}
            className="absolute right-3 text-gray-400 hover:text-gray-600"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        )}
      </div>
      {showDropdown && users.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-60 overflow-y-auto">
          {users.map((user) => (
            <button
              key={user.id}
              onClick={() => handleSelect(user)}
              className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center gap-3 ${
                user.id === selectedUserId ? 'bg-blue-50' : ''
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-blue-600 text-sm font-semibold">
                  {user.full_name.charAt(0)}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{user.full_name}</p>
                <p className="text-xs text-gray-500">@{user.username}</p>
              </div>
            </button>
          ))}
        </div>
      )}
      {loading && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg p-4 text-center text-sm text-gray-500">
          Загрузка...
        </div>
      )}
    </div>
  );
}
