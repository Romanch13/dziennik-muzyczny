/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { WorkshopDatabase, MonthData, Lesson, AdditionalLesson, CopiedDayTemplate } from './types/journal';
import { recalculateMonth, exportMonthToExcel } from './utils/calculations';
import { exportMonthToPdf } from './utils/pdfExport';
import { generateNewMonth } from './utils/monthGenerator';
import { Header } from './components/Header';
import { MonthNavigation } from './components/MonthNavigation';
import { WeekCard } from './components/WeekCard';
import { AdditionalLessonsSection } from './components/AdditionalLessonsSection';
import { LoginModal } from './components/LoginModal';
import { ChangePasswordModal } from './components/ChangePasswordModal';
import { AddLessonModal } from './components/AddLessonModal';
import { AddExtraLessonModal } from './components/AddExtraLessonModal';
import { AddMonthModal } from './components/AddMonthModal';
import { StudentStatsModal } from './components/StudentStatsModal';
import { 
  RotateCcw, 
  Check, 
  Loader2, 
  AlertCircle,
  Music,
  Trash2,
  Calendar,
  PlusCircle,
  X
} from 'lucide-react';
import initialDatabaseJson from './data/initialData.json';

// SHA-256 helper for client-side password validation in offline / GitHub Pages mode
async function sha256Hex(text: string): Promise<string> {
  const enc = new TextEncoder().encode(text.trim());
  const hash = await crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// Safely retrieve cached data or bundled default database
function getStoredOrInitialDatabase(): WorkshopDatabase {
  try {
    const saved = localStorage.getItem('wm_journal_database');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && Array.isArray(parsed.months) && parsed.months.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Failed to parse cached database from localStorage:', err);
  }
  return initialDatabaseJson as unknown as WorkshopDatabase;
}

export default function App() {
  const [data, setData] = useState<WorkshopDatabase>(getStoredOrInitialDatabase);
  const [activeMonthId, setActiveMonthId] = useState<string>(() => {
    const init = getStoredOrInitialDatabase();
    return init.months?.[0]?.id || 'pazdziernik-2026';
  });
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isRealtimeConnected, setIsRealtimeConnected] = useState<boolean>(false);
  const [isBackendOnline, setIsBackendOnline] = useState<boolean>(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('wm_theme');
    return saved === 'dark' ? 'dark' : 'light';
  });

  // Sync theme with document element for CSS custom-variants
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('wm_theme', next);
      return next;
    });
  };

  // Day Template copy & paste state
  const [copiedTemplate, setCopiedTemplate] = useState<CopiedDayTemplate | null>(() => {
    try {
      const saved = localStorage.getItem('wm_day_template');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((cur) => (cur === msg ? null : cur));
    }, 4000);
  };

  // Modals state
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isAddExtraOpen, setIsAddExtraOpen] = useState(false);
  const [isAddMonthOpen, setIsAddMonthOpen] = useState(false);
  const [monthToDelete, setMonthToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isDeletingMonth, setIsDeletingMonth] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [addLessonTarget, setAddLessonTarget] = useState<{
    weekId: string;
    dayKey: 'monday' | 'friday' | 'singleDay';
    dayDate: string;
    dayOfWeek: string;
  } | null>(null);

  // 1. Fetch journal from backend if available, fallback smoothly to local cached state
  const fetchJournal = useCallback(async () => {
    try {
      const res = await fetch('/api/journal');
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const json: WorkshopDatabase = await res.json();
        if (json && Array.isArray(json.months)) {
          setData(json);
          setIsBackendOnline(true);
          try {
            localStorage.setItem('wm_journal_database', JSON.stringify(json));
          } catch {
            // ignore
          }
          if (json.months.length > 0 && !activeMonthId) {
            setActiveMonthId(json.months[0].id);
          }
          return;
        }
      }
      setIsBackendOnline(false);
    } catch {
      setIsBackendOnline(false);
    } finally {
      setIsLoading(false);
    }
  }, [activeMonthId]);

  // Check auth token on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('wm_auth_token');
    if (savedToken) {
      if (savedToken.startsWith('local-auth-')) {
        setIsAuthenticated(true);
        setToken(savedToken);
      } else {
        fetch('/api/auth/status', {
          headers: { Authorization: `Bearer ${savedToken}` }
        })
          .then((res) => {
            const ct = res.headers.get('content-type') || '';
            if (res.ok && ct.includes('application/json')) {
              return res.json();
            }
            throw new Error('Static host');
          })
          .then((json) => {
            if (json.isAuthenticated) {
              setIsAuthenticated(true);
              setToken(savedToken);
            } else {
              localStorage.removeItem('wm_auth_token');
            }
          })
          .catch(() => {
            // Static host fallback: allow persistent session if token exists
            setIsAuthenticated(true);
            setToken(savedToken);
          });
      }
    }

    fetchJournal();
  }, [fetchJournal]);

  // 2. Real-time sync via Server-Sent Events (SSE) only when backend is active
  useEffect(() => {
    if (!isBackendOnline) return;

    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/journal/events');

      eventSource.onopen = () => {
        setIsRealtimeConnected(true);
      };

      eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === 'journal_updated' || payload.type === 'journal_reset') {
            fetchJournal();
          } else if (payload.type === 'month_updated') {
            fetchJournal();
          }
        } catch (err) {
          console.error('SSE parsing error:', err);
        }
      };

      eventSource.onerror = () => {
        setIsRealtimeConnected(false);
      };
    } catch {
      setIsRealtimeConnected(false);
    }

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [isBackendOnline, fetchJournal]);

  // Active month object
  const activeMonth = useMemo(() => {
    if (!data?.months?.length) return null;
    return data.months.find((m) => m.id === activeMonthId) || data.months[0];
  }, [data, activeMonthId]);

  // List of all unique student names across the system
  const allKnownStudents = useMemo(() => {
    if (!data?.months) return [];
    const studentsSet = new Set<string>();

    for (const m of data.months) {
      for (const w of m.weeks) {
        const days = [w.monday, w.friday, w.singleDay];
        for (const d of days) {
          if (!d) continue;
          for (const l of d.lessons) {
            if (l.student && l.student !== 'Imię ucznia') {
              studentsSet.add(l.student.trim());
            }
          }
        }
      }
      for (const a of m.additional || []) {
        if (a.student && a.student !== 'Imię ucznia') {
          studentsSet.add(a.student.trim());
        }
      }
    }

    // Also include default template students
    data.defaultTemplates?.monday?.forEach((s) => studentsSet.add(s.student));
    data.defaultTemplates?.friday?.forEach((s) => studentsSet.add(s.student));

    return Array.from(studentsSet).sort();
  }, [data]);

  // Helper to persist database to local state and localStorage
  const persistDatabase = useCallback((newData: WorkshopDatabase) => {
    setData(newData);
    try {
      localStorage.setItem('wm_journal_database', JSON.stringify(newData));
    } catch (err) {
      console.warn('LocalStorage save failed:', err);
    }
  }, []);

  // Save changes to backend or localStorage
  const saveMonthToBackend = async (updatedMonth: MonthData, updatedDb?: WorkshopDatabase) => {
    if (!token || !isAuthenticated) return;
    setIsSaving(true);
    setLastSaved(new Date().toLocaleTimeString('pl-PL'));

    if (updatedDb) {
      persistDatabase(updatedDb);
    }

    if (isBackendOnline) {
      try {
        const res = await fetch(`/api/journal/month/${updatedMonth.id}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(updatedMonth)
        });
        if (res.ok) {
          setLastSaved(new Date().toLocaleTimeString('pl-PL'));
        }
      } catch (err) {
        console.warn('Backend save error:', err);
      }
    }
    setIsSaving(false);
  };

  // Update a single month locally and trigger save
  const updateActiveMonth = (updater: (prev: MonthData) => MonthData) => {
    if (!data || !activeMonth) return;

    const modified = updater(activeMonth);
    const recalculated = recalculateMonth(modified);

    const updatedMonths = data.months.map((m) =>
      m.id === recalculated.id ? recalculated : m
    );

    const updatedDb: WorkshopDatabase = {
      ...data,
      months: updatedMonths
    };

    persistDatabase(updatedDb);
    saveMonthToBackend(recalculated, updatedDb);
  };

  // Lesson actions
  const handleUpdateLesson = (
    weekId: string,
    dayKey: 'monday' | 'friday' | 'singleDay',
    lessonId: string,
    updates: Partial<Lesson>
  ) => {
    if (!isAuthenticated) {
      setIsLoginOpen(true);
      return;
    }

    updateActiveMonth((month) => {
      const updatedWeeks = month.weeks.map((w) => {
        if (w.id !== weekId) return w;
        const targetDay = w[dayKey];
        if (!targetDay) return w;

        const updatedLessons = targetDay.lessons.map((l) =>
          l.id === lessonId ? { ...l, ...updates } : l
        );

        return {
          ...w,
          [dayKey]: {
            ...targetDay,
            lessons: updatedLessons
          }
        };
      });

      return {
        ...month,
        weeks: updatedWeeks
      };
    });
  };

  const handleDeleteLesson = (
    weekId: string,
    dayKey: 'monday' | 'friday' | 'singleDay',
    lessonId: string
  ) => {
    if (!isAuthenticated) return;

    updateActiveMonth((month) => {
      const updatedWeeks = month.weeks.map((w) => {
        if (w.id !== weekId) return w;
        const targetDay = w[dayKey];
        if (!targetDay) return w;

        const updatedLessons = targetDay.lessons.filter((l) => l.id !== lessonId);

        return {
          ...w,
          [dayKey]: {
            ...targetDay,
            lessons: updatedLessons
          }
        };
      });

      return {
        ...month,
        weeks: updatedWeeks
      };
    });
  };

  const handleAddLessonSubmit = (lessonData: Omit<Lesson, 'id'>) => {
    if (!addLessonTarget || !isAuthenticated) return;
    const { weekId, dayKey } = addLessonTarget;

    updateActiveMonth((month) => {
      const updatedWeeks = month.weeks.map((w) => {
        if (w.id !== weekId) return w;
        const targetDay = w[dayKey];
        if (!targetDay) return w;

        const newLesson: Lesson = {
          ...lessonData,
          id: `les-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`
        };

        return {
          ...w,
          [dayKey]: {
            ...targetDay,
            lessons: [...targetDay.lessons, newLesson]
          }
        };
      });

      return {
        ...month,
        weeks: updatedWeeks
      };
    });

    setAddLessonTarget(null);
  };

  // Day Template copy & paste actions
  const handleCopyDayTemplate = (weekId: string, dayKey: 'monday' | 'friday' | 'singleDay') => {
    if (!activeMonth) return;
    const week = activeMonth.weeks.find((w) => w.id === weekId);
    const targetDay = week ? week[dayKey] : null;
    if (!targetDay) return;

    const validLessons = targetDay.lessons
      .filter((l) => l.student && l.student.trim() !== '')
      .map((l) => ({
        student: l.student,
        duration: l.duration,
        price: l.price,
      }));

    if (validLessons.length === 0) {
      showToast('W wybranym dniu nie ma uczniów do skopiowania');
      return;
    }

    const template: CopiedDayTemplate = {
      sourceDayOfWeek: targetDay.dayOfWeek,
      sourceDate: targetDay.date,
      lessons: validLessons,
    };

    setCopiedTemplate(template);
    localStorage.setItem('wm_day_template', JSON.stringify(template));
    showToast(`Skopiowano szablon dnia: ${targetDay.dayOfWeek} (${validLessons.length} uczniów)`);
  };

  const handlePasteDayTemplate = (
    weekId: string,
    dayKey: 'monday' | 'friday' | 'singleDay',
    mode: 'replace' | 'append'
  ) => {
    if (!isAuthenticated) {
      setIsLoginOpen(true);
      return;
    }
    if (!copiedTemplate || !activeMonth) return;

    updateActiveMonth((month) => {
      const updatedWeeks = month.weeks.map((w) => {
        if (w.id !== weekId) return w;
        const targetDay = w[dayKey];
        if (!targetDay) return w;

        const newLessons: Lesson[] = copiedTemplate.lessons.map((tpl, i) => ({
          id: `les-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`,
          date: targetDay.date,
          student: tpl.student,
          duration: tpl.duration,
          price: tpl.price,
          status: 'Był',
          excused: '-',
          sum: tpl.price,
        }));

        const finalLessons = mode === 'replace' ? newLessons : [...targetDay.lessons, ...newLessons];

        return {
          ...w,
          [dayKey]: {
            ...targetDay,
            lessons: finalLessons,
          },
        };
      });

      return {
        ...month,
        weeks: updatedWeeks,
      };
    });

    showToast(`Wklejono ${copiedTemplate.lessons.length} lekcji z szablonu!`);
  };

  // Additional lessons actions
  const handleUpdateExtraLesson = (id: string, updates: Partial<AdditionalLesson>) => {
    if (!isAuthenticated) return;
    updateActiveMonth((month) => ({
      ...month,
      additional: (month.additional || []).map((a) =>
        a.id === id ? { ...a, ...updates } : a
      )
    }));
  };

  const handleDeleteExtraLesson = (id: string) => {
    if (!isAuthenticated) return;
    updateActiveMonth((month) => ({
      ...month,
      additional: (month.additional || []).filter((a) => a.id !== id)
    }));
  };

  const handleAddExtraLessonSubmit = (extraData: Omit<AdditionalLesson, 'id'>) => {
    if (!isAuthenticated) return;
    updateActiveMonth((month) => ({
      ...month,
      additional: [
        ...(month.additional || []),
        {
          ...extraData,
          id: `add-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`
        }
      ]
    }));
    setIsAddExtraOpen(false);
  };

  // Auth operations
  const handleLogin = async (password: string): Promise<boolean> => {
    const trimmed = password.trim();
    if (!trimmed) return false;

    if (isBackendOnline) {
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: trimmed })
        });
        const contentType = res.headers.get('content-type') || '';
        if (res.ok && contentType.includes('application/json')) {
          const json = await res.json();
          setIsAuthenticated(true);
          setToken(json.token);
          localStorage.setItem('wm_auth_token', json.token);
          return true;
        }
      } catch (err) {
        console.warn('Backend login attempt failed, checking local credentials:', err);
      }
    }

    // Static / client-side check (e.g. GitHub Pages or offline)
    try {
      const inputHash = await sha256Hex(trimmed);
      const customHash = localStorage.getItem('wm_password_hash');
      const defaultHash = await sha256Hex('jagodno2026');
      const expectedHash = customHash || defaultHash;

      if (inputHash === expectedHash) {
        const localToken = 'local-auth-' + Math.random().toString(36).substring(2) + '-' + Date.now().toString(36);
        setIsAuthenticated(true);
        setToken(localToken);
        localStorage.setItem('wm_auth_token', localToken);
        return true;
      }
    } catch (err) {
      console.error('Local auth check error:', err);
    }
    return false;
  };

  const handleLogout = async () => {
    try {
      if (token && isBackendOnline) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        });
      }
    } catch {
      // ignore
    } finally {
      setIsAuthenticated(false);
      setToken(null);
      localStorage.removeItem('wm_auth_token');
    }
  };

  const handleChangePassword = async (newPassword: string): Promise<boolean> => {
    if (!token) return false;
    const trimmed = newPassword.trim();
    if (!trimmed) return false;

    if (isBackendOnline) {
      try {
        const res = await fetch('/api/settings/password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ newPassword: trimmed })
        });
        if (res.ok) {
          const json = await res.json();
          if (json.token) {
            setToken(json.token);
            localStorage.setItem('wm_auth_token', json.token);
          }
        }
      } catch (err) {
        console.warn('Backend password change failed:', err);
      }
    }

    // Always update local storage hash as well
    try {
      const newHash = await sha256Hex(trimmed);
      localStorage.setItem('wm_password_hash', newHash);
      if (data) {
        const updatedDb: WorkshopDatabase = {
          ...data,
          settings: {
            ...data.settings,
            defaultPasswordHint: 'custom'
          }
        };
        persistDatabase(updatedDb);
      }
      return true;
    } catch {
      return false;
    }
  };

  const handleAddMonth = (monthName: string, year: number, prefill: boolean) => {
    if (!data) return;

    const newMonth = generateNewMonth(monthName, year, data.defaultTemplates, prefill);
    const updatedMonths = [...data.months, newMonth];
    const updatedDb: WorkshopDatabase = {
      ...data,
      months: updatedMonths,
    };

    persistDatabase(updatedDb);
    setActiveMonthId(newMonth.id);
    saveMonthToBackend(newMonth, updatedDb);
  };

  const handleDeleteMonthClick = (monthId: string, monthName: string) => {
    if (!isAuthenticated || !token) {
      setIsLoginOpen(true);
      return;
    }
    setMonthToDelete({ id: monthId, name: monthName });
  };

  const confirmDeleteMonth = async () => {
    if (!monthToDelete || !token || !data) return;

    const monthId = monthToDelete.id;
    setIsDeletingMonth(true);

    const prevMonths = data.months;
    const filteredMonths = prevMonths.filter((m) => m.id !== monthId);

    // If the active month is deleted, switch active month to adjacent or first available
    if (activeMonthId === monthId) {
      const deletedIndex = prevMonths.findIndex((m) => m.id === monthId);
      const newActive = filteredMonths[Math.max(0, deletedIndex - 1)] || filteredMonths[0];
      setActiveMonthId(newActive ? newActive.id : '');
    }

    const updatedDb: WorkshopDatabase = {
      ...data,
      months: filteredMonths,
    };

    persistDatabase(updatedDb);
    setLastSaved(new Date().toLocaleTimeString('pl-PL'));
    setMonthToDelete(null);

    if (isBackendOnline) {
      try {
        await fetch(`/api/journal/month/${monthId}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
      } catch (err) {
        console.error('Error deleting month on backend:', err);
      }
    }
    setIsDeletingMonth(false);
  };

  const handleResetDataClick = () => {
    if (!token || !isAuthenticated) {
      setIsLoginOpen(true);
      return;
    }
    setIsResetConfirmOpen(true);
  };

  const confirmResetData = async () => {
    if (!token || !isAuthenticated) return;
    setIsResetConfirmOpen(false);
    setIsSaving(true);

    if (isBackendOnline) {
      try {
        await fetch('/api/journal/reset', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (err) {
        console.error('Reset error on backend:', err);
      }
    }

    // Always reset local copy as well
    const freshData = JSON.parse(JSON.stringify(initialDatabaseJson)) as WorkshopDatabase;
    persistDatabase(freshData);
    setLastSaved(new Date().toLocaleTimeString('pl-PL'));
    if (freshData.months?.length > 0) {
      setActiveMonthId(freshData.months[0].id);
    }
    showToast('Przywrócono domyślne dane dziennika.');
    setIsSaving(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-slate-300 gap-4">
        <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 animate-pulse">
          <Music className="w-6 h-6" />
        </div>
        <p className="text-sm font-medium">Ładowanie Warsztatu Muzycznego na Jagodnie...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 text-center">
        <AlertCircle className="w-12 h-12 text-rose-400 mb-3" />
        <h2 className="text-lg font-bold text-white mb-1">Brak danych dziennika</h2>
        <p className="text-xs text-slate-400 max-w-sm mb-4">
          Nie udało się odnaleźć bazy danych dziennika lekcji.
        </p>
        <button
          onClick={() => {
            const initial = initialDatabaseJson as unknown as WorkshopDatabase;
            setData(initial);
            localStorage.setItem('wm_journal_database', JSON.stringify(initial));
          }}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-md"
        >
          Załaduj dane domyślne
        </button>
      </div>
    );
  }

  const isPasswordChanged = data.settings?.defaultPasswordHint === 'custom';

  return (
    <div className={`min-h-screen ${theme === 'light' ? 'light bg-[#f4f5f8] text-slate-900' : 'bg-slate-950 text-slate-100'} flex flex-col transition-colors duration-200`}>
      {/* Header with Search, Auth, and Export Tools */}
      <Header
        isAuthenticated={isAuthenticated}
        onOpenLogin={() => setIsLoginOpen(true)}
        onLogout={handleLogout}
        onOpenChangePassword={() => setIsChangePasswordOpen(true)}
        onOpenStats={() => setIsStatsOpen(true)}
        onExportExcel={() => activeMonth && exportMonthToExcel(activeMonth, data.schoolInfo.name)}
        onExportPdf={() => activeMonth && exportMonthToPdf(activeMonth, data.schoolInfo.name)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        isRealtimeConnected={isRealtimeConnected}
        activeMonthName={activeMonth ? activeMonth.name : 'Brak miesięcy'}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Save / Status Toast if editing */}
        {isAuthenticated && (
          <div className="flex items-center justify-between text-xs text-slate-400 no-print">
            <div className="flex items-center gap-2">
              {isSaving ? (
                <span className="flex items-center gap-1.5 text-indigo-400">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Zapisywanie zmian...
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <Check className="w-3.5 h-3.5" /> Wszystkie zmiany zapisane na serwerze {lastSaved ? `(${lastSaved})` : ''}
                </span>
              )}
            </div>

            <button
              onClick={handleResetDataClick}
              className="text-[11px] text-slate-400 hover:text-rose-400 underline flex items-center gap-1 cursor-pointer"
              title="Przywróć dane z arkusza Excel"
            >
              <RotateCcw className="w-3 h-3" />
              Przywróć arkusz źródłowy
            </button>
          </div>
        )}

        {/* Month Selector & Monthly KPIs */}
        <MonthNavigation
          months={data.months}
          selectedMonthId={activeMonth ? activeMonth.id : ''}
          onSelectMonth={setActiveMonthId}
          activeMonth={activeMonth}
          onOpenAddMonth={() => {
            if (!isAuthenticated) {
              setIsLoginOpen(true);
            } else {
              setIsAddMonthOpen(true);
            }
          }}
          isAuthenticated={isAuthenticated}
          onDeleteMonth={handleDeleteMonthClick}
        />

        {activeMonth ? (
          <>
            {/* Search Active Notification */}
            {searchQuery && (
              <div className="p-3 bg-indigo-950/40 border border-indigo-500/30 rounded-2xl flex items-center justify-between text-xs text-indigo-300">
                <span>
                  Filtrowanie po uczniu: <strong>"{searchQuery}"</strong>
                </span>
                <button
                  onClick={() => setSearchQuery('')}
                  className="underline text-indigo-400 hover:text-white cursor-pointer"
                >
                  Wyczyść filtr
                </button>
              </div>
            )}

            {/* Weeks List */}
            <div className="space-y-6">
              {activeMonth.weeks.map((week) => (
                <WeekCard
                  key={week.id}
                  week={week}
                  isAuthenticated={isAuthenticated}
                  onUpdateLesson={(dayKey, lessonId, updates) =>
                    handleUpdateLesson(week.id, dayKey, lessonId, updates)
                  }
                  onDeleteLesson={(dayKey, lessonId) =>
                    handleDeleteLesson(week.id, dayKey, lessonId)
                  }
                  onOpenAddLesson={(dayKey, dayDate, dayOfWeek) =>
                    setAddLessonTarget({ weekId: week.id, dayKey, dayDate, dayOfWeek })
                  }
                  searchFilter={searchQuery}
                  copiedTemplate={copiedTemplate}
                  onCopyTemplate={(dayKey) => handleCopyDayTemplate(week.id, dayKey)}
                  onPasteTemplate={(dayKey, mode) => handlePasteDayTemplate(week.id, dayKey, mode)}
                />
              ))}
            </div>

            {/* DODATKOWO Section */}
            <AdditionalLessonsSection
              lessons={activeMonth.additional || []}
              total={activeMonth.additionalTotal}
              regularTotal={activeMonth.regularTotal}
              grandTotal={activeMonth.grandTotal}
              isAuthenticated={isAuthenticated}
              onUpdateLesson={handleUpdateExtraLesson}
              onDeleteLesson={handleDeleteExtraLesson}
              onOpenAddLesson={() => {
                if (!isAuthenticated) {
                  setIsLoginOpen(true);
                } else {
                  setIsAddExtraOpen(true);
                }
              }}
              searchFilter={searchQuery}
            />
          </>
        ) : (
          <div className="ios-glass rounded-3xl p-10 text-center max-w-lg mx-auto space-y-4 my-8">
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
              <Calendar className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              Brak miesięcy w dzienniku
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
              Wszystkie miesiące zostały usunięte. Możesz teraz utworzyć nowy miesiąc za pomocą przycisku poniżej i rozpocząć planowanie zajęć.
            </p>
            <button
              onClick={() => {
                if (!isAuthenticated) setIsLoginOpen(true);
                else setIsAddMonthOpen(true);
              }}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all cursor-pointer inline-flex items-center gap-2 active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ Utwórz nowy miesiąc</span>
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className={`border-t py-6 text-center text-xs no-print transition-colors duration-200 ${
        theme === 'light'
          ? 'border-slate-200 bg-white text-slate-600'
          : 'border-slate-900 bg-slate-950 text-slate-400'
      }`}>
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-indigo-600 flex items-center justify-center text-white">
              <Music className="w-3 h-3" />
            </div>
            <span className={`font-semibold ${theme === 'light' ? 'text-slate-800' : 'text-slate-300'}`}>
              Warsztat Muzyczny na Jagodnie
            </span>
            <span>• Wrocław Jagodno</span>
          </div>
          <p className={`${theme === 'light' ? 'text-slate-500' : 'text-slate-400'} text-[11px]`}>
            30 min = 40 zł | 45 min = 60 zł | 60 min = 70 zł
          </p>
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <span className="text-emerald-400 text-xs flex items-center gap-1 font-medium">
                <Check className="w-3.5 h-3.5" /> Edycja aktywna
              </span>
            ) : (
              <button
                onClick={() => setIsLoginOpen(true)}
                className="text-xs text-indigo-400 hover:text-indigo-300 underline cursor-pointer"
              >
                Logowanie nauczyciela
              </button>
            )}
          </div>
        </div>
      </footer>

      {/* Modals */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLogin={handleLogin}
        isPasswordChanged={isPasswordChanged}
      />

      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
        onChangePassword={handleChangePassword}
      />

      <StudentStatsModal
        isOpen={isStatsOpen}
        onClose={() => setIsStatsOpen(false)}
        month={activeMonth}
      />

      {addLessonTarget && (
        <AddLessonModal
          isOpen={Boolean(addLessonTarget)}
          onClose={() => setAddLessonTarget(null)}
          dayDate={addLessonTarget.dayDate}
          dayOfWeek={addLessonTarget.dayOfWeek}
          onAdd={handleAddLessonSubmit}
          existingStudents={allKnownStudents}
        />
      )}

      <AddExtraLessonModal
        isOpen={isAddExtraOpen}
        onClose={() => setIsAddExtraOpen(false)}
        onAdd={handleAddExtraLessonSubmit}
        existingStudents={allKnownStudents}
      />

      <AddMonthModal
        isOpen={isAddMonthOpen}
        onClose={() => setIsAddMonthOpen(false)}
        onAddMonth={handleAddMonth}
        existingMonths={data.months}
      />

      {/* Month Delete Confirmation Modal (iOS / Windows 11 Fluent style) */}
      {monthToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 backdrop-blur-2xl">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Usunąć miesiąc „{monthToDelete.name}”?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Wszystkie zaplanowane lekcje, frekwencja oraz rozliczenia finansowe dla tego miesiąca zostaną trwale usunięte z dziennika.
                </p>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={isDeletingMonth}
                onClick={() => setMonthToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              >
                Anuluj
              </button>
              <button
                type="button"
                disabled={isDeletingMonth}
                onClick={confirmDeleteMonth}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/30 flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
              >
                {isDeletingMonth ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Usuwanie...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Usuń bezpowrotnie</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 backdrop-blur-2xl">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                <RotateCcw className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Przywrócić arkusz źródłowy?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Ta operacja przywróci pierwotną wersję danych z pliku Excel. Wszelkie bieżące edycje zostaną zastąpione.
                </p>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              >
                Anuluj
              </button>
              <button
                type="button"
                onClick={confirmResetData}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white shadow-md shadow-amber-600/30 flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Przywróć dane</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 bg-slate-900/95 dark:bg-white text-white dark:text-slate-900 px-4 py-2.5 rounded-2xl shadow-2xl border border-slate-700 dark:border-slate-200 text-xs font-semibold animate-in slide-in-from-bottom-3 duration-200">
          <Check className="w-4 h-4 text-emerald-400 dark:text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="ml-2 text-slate-400 hover:text-white dark:hover:text-black cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
