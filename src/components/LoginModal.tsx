import React, { useState } from 'react';
import { Lock, Key, X, Eye, EyeOff, AlertCircle } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (password: string) => Promise<boolean>;
  isPasswordChanged?: boolean;
}

export const LoginModal: React.FC<LoginModalProps> = ({ 
  isOpen, 
  onClose, 
  onLogin, 
  isPasswordChanged = false 
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError('Wpisz hasło administratora / nauczyciela.');
      return;
    }

    setIsLoading(true);
    setError('');

    const success = await onLogin(password);
    setIsLoading(false);

    if (success) {
      setPassword('');
      onClose();
    } else {
      setError(
        isPasswordChanged 
          ? 'Nieprawidłowe hasło. Wprowadź aktualne hasło po zmianie.' 
          : 'Nieprawidłowe hasło. Domyślne hasło początkowe: jagodno2026'
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div 
        className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Decorative background glow */}
        <div className="absolute -top-16 -right-16 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/20">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Logowanie do edycji</h3>
              <p className="text-xs text-slate-400">Warsztat Muzyczny na Jagodnie</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Hasło edytora / administratora:
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                autoFocus
                placeholder="Wpisz hasło..."
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError('');
                }}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-800/60 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Hint for initial setup only if NOT changed */}
          {!isPasswordChanged && (
            <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-slate-400 text-xs flex items-start gap-2">
              <Key className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <span>Domyślne hasło dostępu: </span>
                <button
                  type="button"
                  onClick={() => setPassword('jagodno2026')}
                  className="font-mono font-bold text-indigo-300 underline cursor-pointer hover:text-indigo-200"
                >
                  jagodno2026
                </button>
                <span className="block text-[11px] text-slate-400 mt-0.5">
                  (Po zalogowaniu możesz w każdej chwili zmienić hasło w ustawieniach).
                </span>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
            >
              Anuluj
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-all shadow-md shadow-indigo-600/30 disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? 'Sprawdzanie...' : 'Odblokuj edycję'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
