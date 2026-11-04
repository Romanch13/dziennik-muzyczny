import React from 'react';
import { 
  Music, 
  Lock, 
  Unlock, 
  Search, 
  FileSpreadsheet, 
  FileText, 
  Users, 
  KeyRound, 
  Radio, 
  LogOut,
  Sun,
  Moon,
  Cloud,
  Download,
  Upload,
  User,
  Building2
} from 'lucide-react';
import { WorkspaceType } from '../types/journal';

interface HeaderProps {
  workspace: WorkspaceType;
  onSelectWorkspace: (ws: WorkspaceType) => void;
  isAuthenticated: boolean;
  onOpenLogin: () => void;
  onLogout: () => void;
  onOpenChangePassword: () => void;
  onOpenStats: () => void;
  onExportExcel: () => void;
  onExportPdf: () => void;
  onExportJson: () => void;
  onImportJson: (e: React.ChangeEvent<HTMLInputElement>) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  isRealtimeConnected: boolean;
  activeMonthName: string;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  workspace,
  onSelectWorkspace,
  isAuthenticated,
  onOpenLogin,
  onLogout,
  onOpenChangePassword,
  onOpenStats,
  onExportExcel,
  onExportPdf,
  onExportJson,
  onImportJson,
  searchQuery,
  onSearchChange,
  isRealtimeConnected,
  activeMonthName,
  theme,
  onToggleTheme,
}) => {
  const isLight = theme === 'light';
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  return (
    <header className={`sticky top-0 z-40 border-b no-print transition-colors duration-200 ${
      isLight 
        ? 'bg-white/80 border-slate-200/80 text-slate-900 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] backdrop-blur-2xl' 
        : 'bg-slate-900/90 border-slate-800 text-slate-100 shadow-lg backdrop-blur-md'
    }`}>
      {/* Top Banner Notice for Read-Only or Editing Mode */}
      {!isAuthenticated ? (
        <div className={`px-4 py-2 text-xs md:text-sm flex items-center justify-between border-b ${
          isLight 
            ? 'bg-amber-50/80 border-amber-200/80 text-amber-900 backdrop-blur-md' 
            : 'bg-gradient-to-r from-amber-500/15 via-indigo-500/15 to-amber-500/15 border-amber-500/30 text-amber-200'
        }`}>
          <div className="flex items-center gap-2 max-w-3xl">
            <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
            <p>
              <strong className="font-semibold text-amber-800 dark:text-amber-300">Tryb podglądu (bez zmian):</strong> Przeglądasz aktualny dziennik lekcji w trybie tylko do odczytu. Aby wprowadzać obecności, edytować kwoty lub dodawać uczniów — zaloguj się hasłem.
            </p>
          </div>
          <button
            onClick={onOpenLogin}
            className="shrink-0 ml-3 inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-medium rounded-lg text-xs transition-colors shadow-xs cursor-pointer active:scale-95"
          >
            <Lock className="w-3.5 h-3.5" />
            Zaloguj się do edycji
          </button>
        </div>
      ) : (
        <div className={`px-4 py-1.5 text-xs flex items-center justify-between border-b ${
          isLight
            ? 'bg-emerald-50/80 border-emerald-200/80 text-emerald-900 backdrop-blur-md'
            : 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
        }`}>
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
            <span>
              <strong>Tryb edytora aktywny:</strong> Wszelkie zmiany obecności i stawek zapisują się na bieżąco i synchronizują w czasie rzeczywistym.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenChangePassword}
              className={`inline-flex items-center gap-1 text-xs underline cursor-pointer ${
                isLight ? 'text-emerald-700 hover:text-emerald-950' : 'text-emerald-400 hover:text-emerald-200'
              }`}
            >
              <KeyRound className="w-3 h-3" />
              Zmień hasło
            </button>
          </div>
        </div>
      )}

      {/* Main Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-md shrink-0 transition-all ${
              workspace === 'private'
                ? 'bg-gradient-to-br from-purple-500 to-pink-600 shadow-purple-500/20'
                : 'bg-gradient-to-br from-indigo-500 to-purple-600 shadow-indigo-500/20'
            }`}>
              {workspace === 'private' ? <User className="w-5 h-5" /> : <Music className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className={`text-lg md:text-xl font-bold tracking-tight transition-colors ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {workspace === 'private' ? 'Lekcje Prywatne' : 'Warsztat Muzyczny na Jagodnie'}
                </h1>
                <span className={`hidden sm:inline-block text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border transition-colors ${
                  workspace === 'private'
                    ? isLight
                      ? 'bg-purple-50/80 text-purple-700 border-purple-200/80'
                      : 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                    : isLight 
                      ? 'bg-indigo-50/80 text-indigo-700 border-indigo-200/80' 
                      : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                }`}>
                  {workspace === 'private' ? 'Prywatnie' : 'Wrocław'}
                </span>
                {isRealtimeConnected ? (
                  <span 
                    className={`inline-flex items-center gap-1.5 text-[11px] px-2.5 py-0.5 rounded-full border ${
                      isLight
                        ? 'text-emerald-700 bg-emerald-50/90 border-emerald-200'
                        : 'text-emerald-300 bg-emerald-950/60 border-emerald-800/60'
                    }`}
                    title="Chmura Firebase połączona: dane synchronizują się na żywo między wszystkimi urządzeniami"
                  >
                    <Cloud className="w-3 h-3 text-emerald-500 animate-pulse" />
                    <span className="hidden xl:inline">Chmura aktywna</span>
                  </span>
                ) : (
                  <span 
                    className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border ${
                      isLight
                        ? 'text-slate-600 bg-slate-100 border-slate-200'
                        : 'text-slate-400 bg-slate-800 border-slate-700'
                    }`}
                    title="Tryb pamięci przeglądarki"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                    <span className="hidden xl:inline">Lokalnie</span>
                  </span>
                )}
              </div>
              <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                {workspace === 'private'
                  ? `Dziennik lekcji prywatnych • ${activeMonthName}`
                  : `Dziennik lekcji, obecności i rozliczeń • ${activeMonthName}`}
              </p>
            </div>
          </div>

          {/* Search & Actions */}
          <div className="flex items-center flex-wrap gap-2 md:gap-2.5">
            {/* Hidden JSON file input */}
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={onImportJson} 
              accept=".json" 
              className="hidden" 
            />

            {/* Student Search */}
            <div className="relative flex-1 sm:w-52 md:w-56">
              <Search className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none ${
                isLight ? 'text-slate-400' : 'text-slate-400'
              }`} />
              <input
                type="text"
                placeholder="Szukaj ucznia..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className={`w-full rounded-xl pl-9 pr-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all ${
                  isLight
                    ? 'bg-white/85 border border-slate-200/90 text-slate-800 placeholder-slate-400 focus:bg-white focus:border-indigo-500 shadow-xs'
                    : 'bg-slate-800/80 border border-slate-700/80 text-slate-200 placeholder-slate-400 focus:border-indigo-500'
                }`}
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className={`absolute right-2.5 top-1/2 -translate-y-1/2 text-xs cursor-pointer ${
                    isLight ? 'text-slate-500 hover:text-slate-800' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  ✕
                </button>
              )}
            </div>

            {/* Backup export button */}
            <button
              onClick={onExportJson}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer active:scale-95 ${
                isLight
                  ? 'bg-white/90 hover:bg-white text-slate-700 border-slate-200/90 shadow-xs'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700'
              }`}
              title="Pobierz kopię zapasową bazy w pliku JSON"
            >
              <Download className="w-3.5 h-3.5 text-blue-500" />
              <span className="hidden xl:inline">Kopia JSON</span>
            </button>

            {/* Backup import button */}
            {isAuthenticated && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer active:scale-95 ${
                  isLight
                    ? 'bg-white/90 hover:bg-white text-slate-700 border-slate-200/90 shadow-xs'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700'
                }`}
                title="Wgraj kopię zapasową bazy z pliku JSON"
              >
                <Upload className="w-3.5 h-3.5 text-indigo-500" />
                <span className="hidden xl:inline">Wgraj JSON</span>
              </button>
            )}

            {/* Students stats summary */}
            <button
              onClick={onOpenStats}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer active:scale-95 ${
                isLight
                  ? 'bg-white/90 hover:bg-white text-slate-700 border-slate-200/90 shadow-xs'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700'
              }`}
              title="Podsumowanie finansowe uczniów"
            >
              <Users className="w-3.5 h-3.5 text-purple-500" />
              <span className="hidden sm:inline">Rozliczenia</span>
            </button>

            {/* Export PDF Button */}
            <button
              onClick={onExportPdf}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer active:scale-95 ${
                isLight
                  ? 'bg-white/90 hover:bg-white text-slate-700 border-slate-200/90 shadow-xs'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700'
              }`}
              title="Pobierz elegancki raport w PDF z polskimi znakami"
            >
              <FileText className="w-3.5 h-3.5 text-rose-500" />
              <span>PDF</span>
            </button>

            {/* Export Excel */}
            <button
              onClick={onExportExcel}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer active:scale-95 ${
                isLight
                  ? 'bg-white/90 hover:bg-white text-slate-700 border-slate-200/90 shadow-xs'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700'
              }`}
              title="Pobierz arkusz Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
              <span className="hidden sm:inline">Excel</span>
            </button>

            {/* Light / Dark Mode Toggle */}
            <button
              onClick={onToggleTheme}
              className={`p-1.5 rounded-xl border transition-all cursor-pointer flex items-center justify-center active:scale-95 ${
                isLight
                  ? 'bg-white/90 hover:bg-white text-amber-600 border-slate-200/90 shadow-xs'
                  : 'bg-slate-800 hover:bg-slate-700 text-amber-400 border-slate-700'
              }`}
              title={isLight ? 'Przełącz na tryb ciemny' : 'Przełącz na tryb jasny'}
            >
              {isLight ? <Moon className="w-4 h-4 text-slate-700" /> : <Sun className="w-4 h-4 text-amber-400" />}
            </button>

            {/* Auth toggle button */}
            {isAuthenticated ? (
              <button
                onClick={onLogout}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer active:scale-95 ${
                  isLight
                    ? 'bg-rose-50/90 hover:bg-rose-100 text-rose-700 border-rose-200 shadow-xs'
                    : 'bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 hover:text-white border-rose-800/60'
                }`}
                title="Wyloguj się z trybu edycji"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Wyloguj</span>
              </button>
            ) : (
              <button
                onClick={onOpenLogin}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-medium transition-all shadow-md shadow-indigo-600/20 cursor-pointer active:scale-95"
              >
                <Unlock className="w-3.5 h-3.5" />
                <span>Zaloguj</span>
              </button>
            )}

          </div>

        </div>
      </div>

      {/* Workspace Tabs (Praca Główna Jagodno vs Praca Prywatna) */}
      <div className={`border-t px-4 sm:px-6 lg:px-8 py-2.5 transition-colors ${
        isLight 
          ? 'bg-slate-50/90 border-slate-200/80 shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]' 
          : 'bg-slate-900/90 border-slate-800'
      }`}>
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          {/* Segmented Switcher */}
          <div className="inline-flex p-1 rounded-2xl bg-slate-200/80 dark:bg-slate-800/90 border border-slate-300/80 dark:border-slate-700 shadow-inner">
            <button
              type="button"
              onClick={() => onSelectWorkspace('jagodno')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold tracking-tight transition-all flex items-center gap-2 cursor-pointer ${
                workspace === 'jagodno'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-1 ring-white/20'
                  : isLight
                    ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Building2 className={`w-4 h-4 ${workspace === 'jagodno' ? 'text-white' : 'text-indigo-500'}`} />
              <span>OSNOWNA PRACA JAGODNO</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectWorkspace('private')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold tracking-tight transition-all flex items-center gap-2 cursor-pointer ${
                workspace === 'private'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30 ring-1 ring-white/20'
                  : isLight
                    ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <User className={`w-4 h-4 ${workspace === 'private' ? 'text-white' : 'text-purple-500'}`} />
              <span>PRACA PRYWATNA</span>
            </button>
          </div>

          {/* Active Workspace Info badge */}
          <div className="flex items-center gap-2 text-xs">
            {workspace === 'jagodno' ? (
              <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${
                isLight 
                  ? 'bg-indigo-50 text-indigo-800 border-indigo-200' 
                  : 'bg-indigo-950/50 text-indigo-300 border-indigo-800/60'
              }`}>
                <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                <span>Aktywny moduł: <strong>Warsztat Muzyczny na Jagodnie</strong> (osobne raporty PDF/Excel)</span>
              </span>
            ) : (
              <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${
                isLight 
                  ? 'bg-purple-50 text-purple-800 border-purple-200' 
                  : 'bg-purple-950/50 text-purple-300 border-purple-800/60'
              }`}>
                <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0" />
                <span>Aktywny moduł: <strong>Praca Prywatna</strong> (oddzielny grafik i niezależne raporty)</span>
              </span>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};
