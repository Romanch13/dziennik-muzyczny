/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  WorkshopDatabase, 
  MonthData, 
  Week, 
  DaySchedule, 
  Lesson, 
  AdditionalLesson, 
  CopiedDayTemplate, 
  WorkspaceType 
} from './types/journal';
import { recalculateMonth, exportMonthToExcel } from './utils/calculations';
import { exportMonthToPdf } from './utils/pdfExport';
import { generateNewMonth, createEmptyPrivateMonths, sanitizePrivateMonths } from './utils/monthGenerator';
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
  X,
  User,
  Building2
} from 'lucide-react';
import initialDatabaseJson from './data/initialData.json';
import { 
  getJournalFromFirestore, 
  saveJournalToFirestore, 
  subscribeToJournal, 
  testFirestoreConnection 
} from './services/firebase';

// SHA-256 helper for client-side password validation in offline / GitHub Pages mode
async function sha256Hex(text: string): Promise<string> {
  const enc = new TextEncoder().encode(text.trim());
  const hash = await crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// Ensures both workspaces (Jagodno and Private) are initialized cleanly
function ensureWorkspaces(db: WorkshopDatabase): WorkshopDatabase {
  if (!db.privateMonths || !Array.isArray(db.privateMonths) || db.privateMonths.length === 0) {
    return {
      ...db,
      activeWorkspace: db.activeWorkspace || 'jagodno',
      privateMonths: createEmptyPrivateMonths(db.months || []),
    };
  }
  return {
    ...db,
    privateMonths: sanitizePrivateMonths(db.privateMonths),
  };
}

// Safely retrieve cached data or bundled default database
function getStoredOrInitialDatabase(): WorkshopDatabase {
  try {
    const saved = localStorage.getItem('wm_journal_database');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && Array.isArray(parsed.months) && parsed.months.length > 0) {
        return ensureWorkspaces(parsed);
      }
    }
  } catch (err) {
    console.warn('Failed to parse cached database from localStorage:', err);
  }
  const base = initialDatabaseJson as unknown as WorkshopDatabase;
  return ensureWorkspaces(base);
}

export default function App() {
  const [data, setData] = useState<WorkshopDatabase>(getStoredOrInitialDatabase);
  
  // Active Workspace tab ('jagodno' = Praca Główna Jagodno, 'private' = Praca Prywatna)
  const [activeWorkspace, setActiveWorkspace] = useState<WorkspaceType>(() => {
    const saved = localStorage.getItem('wm_active_workspace') as WorkspaceType | null;
    if (saved === 'private' || saved === 'jagodno') return saved;
    const init = getStoredOrInitialDatabase();
    return init.activeWorkspace || 'jagodno';
  });

  const handleSelectWorkspace = (ws: WorkspaceType) => {
    setActiveWorkspace(ws);
    try {
      localStorage.setItem('wm_active_workspace', ws);
    } catch {
      // ignore
    }
  };

  // Track active month separately for each workspace so switching tabs remembers your position
  const [activeMonthIdJagodno, setActiveMonthIdJagodno] = useState<string>(() => {
    const init = getStoredOrInitialDatabase();
    return init.months?.[0]?.id || 'pazdziernik-2026';
  });

  const [activeMonthIdPrivate, setActiveMonthIdPrivate] = useState<string>(() => {
    const init = getStoredOrInitialDatabase();
    return init.privateMonths?.[0]?.id || 'pazdziernik-2026';
  });

  const activeMonthId = activeWorkspace === 'private' ? activeMonthIdPrivate : activeMonthIdJagodno;

  const setActiveMonthId = (id: string) => {
    if (activeWorkspace === 'private') {
      setActiveMonthIdPrivate(id);
    } else {
      setActiveMonthIdJagodno(id);
    }
  };
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
    dayKey: string;
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
          const normalized = ensureWorkspaces(json);
          setData(normalized);
          setIsBackendOnline(true);
          try {
            localStorage.setItem('wm_journal_database', JSON.stringify(normalized));
          } catch {
            // ignore
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
  }, []);

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

  // Active months for current workspace
  const currentMonths = useMemo(() => {
    if (activeWorkspace === 'private') {
      return data.privateMonths || [];
    }
    return data.months || [];
  }, [data, activeWorkspace]);

  // Active month object
  const activeMonth = useMemo(() => {
    if (!currentMonths.length) return null;
    return currentMonths.find((m) => m.id === activeMonthId) || currentMonths[0];
  }, [currentMonths, activeMonthId]);

  // List of all unique student names across the active workspace
  const allKnownStudents = useMemo(() => {
    const studentsSet = new Set<string>();
    const monthsToScan = activeWorkspace === 'private' ? (data.privateMonths || []) : (data.months || []);

    for (const m of monthsToScan) {
      for (const w of m.weeks) {
        const days = [w.monday, w.friday, w.singleDay, ...(w.days || [])];
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

    if (activeWorkspace === 'jagodno') {
      data.defaultTemplates?.monday?.forEach((s) => studentsSet.add(s.student));
      data.defaultTemplates?.friday?.forEach((s) => studentsSet.add(s.student));
    }

    return Array.from(studentsSet).sort();
  }, [data, activeWorkspace]);

  // 3. Real-time multi-device sync via Firebase Firestore
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    testFirestoreConnection().then(async (online) => {
      if (online) {
        setIsRealtimeConnected(true);
        // Load latest cloud data
        try {
          const cloudDb = await getJournalFromFirestore();
          if (cloudDb && Array.isArray(cloudDb.months) && cloudDb.months.length > 0) {
            const normalized = ensureWorkspaces(cloudDb);
            setData(normalized);
            try {
              localStorage.setItem('wm_journal_database', JSON.stringify(normalized));
            } catch {
              // ignore
            }
          } else {
            // First time cloud setup: seed initial database to Firestore
            const initial = getStoredOrInitialDatabase();
            await saveJournalToFirestore(initial);
          }
        } catch (err) {
          console.warn('Initial cloud fetch error:', err);
        }

        // Subscribe to real-time changes from any device
        try {
          unsubscribe = subscribeToJournal((remoteDb) => {
            if (remoteDb && Array.isArray(remoteDb.months) && remoteDb.months.length > 0) {
              const normalized = ensureWorkspaces(remoteDb);
              setData(normalized);
              try {
                localStorage.setItem('wm_journal_database', JSON.stringify(normalized));
              } catch {
                // ignore
              }
              setIsRealtimeConnected(true);
            }
          });
        } catch (err) {
          console.warn('Failed to subscribe to cloud journal:', err);
        }
      }
    }).catch((err) => {
      console.warn('Firestore connection failed:', err);
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  // Helper to persist database to local state, localStorage, and Cloud Firestore
  const persistDatabase = useCallback((newData: WorkshopDatabase) => {
    const normalized = ensureWorkspaces(newData);
    setData(normalized);
    try {
      localStorage.setItem('wm_journal_database', JSON.stringify(normalized));
    } catch (err) {
      console.warn('LocalStorage save failed:', err);
    }
    // Sync to Cloud Firestore for multi-device synchronization
    saveJournalToFirestore(normalized).catch((err) => {
      console.warn('Firestore cloud sync error:', err);
    });
  }, []);

  // Save changes to backend or localStorage
  const saveMonthToBackend = async (
    updatedMonth: MonthData,
    updatedDb?: WorkshopDatabase,
    workspace: WorkspaceType = activeWorkspace
  ) => {
    if (!token || !isAuthenticated) return;
    setIsSaving(true);
    setLastSaved(new Date().toLocaleTimeString('pl-PL'));

    if (updatedDb) {
      persistDatabase(updatedDb);
    }

    if (isBackendOnline) {
      try {
        const res = await fetch(`/api/journal/month/${updatedMonth.id}?workspace=${workspace}`, {
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

    if (activeWorkspace === 'private') {
      const currentList = data.privateMonths || [];
      const updatedMonths = currentList.map((m) =>
        m.id === recalculated.id ? recalculated : m
      );
      const updatedDb: WorkshopDatabase = {
        ...data,
        privateMonths: updatedMonths,
      };
      persistDatabase(updatedDb);
      saveMonthToBackend(recalculated, updatedDb, 'private');
    } else {
      const updatedMonths = data.months.map((m) =>
        m.id === recalculated.id ? recalculated : m
      );
      const updatedDb: WorkshopDatabase = {
        ...data,
        months: updatedMonths,
      };
      persistDatabase(updatedDb);
      saveMonthToBackend(recalculated, updatedDb, 'jagodno');
    }
  };

  // Day schedule helper functions
  const updateDayInWeek = (
    week: Week,
    dayIdentifier: string,
    updater: (d: DaySchedule) => DaySchedule
  ): Week => {
    if (dayIdentifier === 'monday' && week.monday) {
      return { ...week, monday: updater(week.monday) };
    }
    if (dayIdentifier === 'friday' && week.friday) {
      return { ...week, friday: updater(week.friday) };
    }
    if (dayIdentifier === 'singleDay' && week.singleDay) {
      return { ...week, singleDay: updater(week.singleDay) };
    }

    if (week.days && week.days.length > 0) {
      let found = false;
      const newDays = week.days.map((d) => {
        if (d.id === dayIdentifier || d.dayOfWeek === dayIdentifier) {
          found = true;
          return updater(d);
        }
        return d;
      });
      if (found) {
        return { ...week, days: newDays };
      }
    }

    if (week.monday && week.monday.id === dayIdentifier) {
      return { ...week, monday: updater(week.monday) };
    }
    if (week.friday && week.friday.id === dayIdentifier) {
      return { ...week, friday: updater(week.friday) };
    }
    if (week.singleDay && week.singleDay.id === dayIdentifier) {
      return { ...week, singleDay: updater(week.singleDay) };
    }

    return week;
  };

  const findDayInWeek = (week: Week, dayIdentifier: string): DaySchedule | null => {
    if (dayIdentifier === 'monday') return week.monday;
    if (dayIdentifier === 'friday') return week.friday;
    if (dayIdentifier === 'singleDay') return week.singleDay;
    if (week.monday && week.monday.id === dayIdentifier) return week.monday;
    if (week.friday && week.friday.id === dayIdentifier) return week.friday;
    if (week.singleDay && week.singleDay.id === dayIdentifier) return week.singleDay;
    return (
      week.days?.find((d) => d.id === dayIdentifier || d.dayOfWeek === dayIdentifier) || null
    );
  };

  // Lesson actions
  const handleUpdateLesson = (
    weekId: string,
    dayIdentifier: string,
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
        return updateDayInWeek(w, dayIdentifier, (targetDay) => {
          const updatedLessons = targetDay.lessons.map((l) =>
            l.id === lessonId ? { ...l, ...updates } : l
          );
          return {
            ...targetDay,
            lessons: updatedLessons,
          };
        });
      });

      return {
        ...month,
        weeks: updatedWeeks,
      };
    });
  };

  const handleDeleteLesson = (
    weekId: string,
    dayIdentifier: string,
    lessonId: string
  ) => {
    if (!isAuthenticated) return;

    updateActiveMonth((month) => {
      const updatedWeeks = month.weeks.map((w) => {
        if (w.id !== weekId) return w;
        return updateDayInWeek(w, dayIdentifier, (targetDay) => {
          const updatedLessons = targetDay.lessons.filter((l) => l.id !== lessonId);
          return {
            ...targetDay,
            lessons: updatedLessons,
          };
        });
      });

      return {
        ...month,
        weeks: updatedWeeks,
      };
    });
  };

  const handleAddLessonSubmit = (lessonData: Omit<Lesson, 'id'>) => {
    if (!addLessonTarget || !isAuthenticated) return;
    const { weekId, dayKey } = addLessonTarget;

    updateActiveMonth((month) => {
      const updatedWeeks = month.weeks.map((w) => {
        if (w.id !== weekId) return w;
        return updateDayInWeek(w, dayKey, (targetDay) => {
          const newLesson: Lesson = {
            ...lessonData,
            id: `les-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          };
          return {
            ...targetDay,
            lessons: [...targetDay.lessons, newLesson],
          };
        });
      });

      return {
        ...month,
        weeks: updatedWeeks,
      };
    });

    setAddLessonTarget(null);
  };

  // Day addition and deletion for Private Workspace
  const handleAddDayToWeek = (weekId: string, dayOfWeek: string, date: string) => {
    if (!isAuthenticated) {
      setIsLoginOpen(true);
      return;
    }

    updateActiveMonth((month) => {
      const updatedWeeks = month.weeks.map((w) => {
        if (w.id !== weekId) return w;

        const newDay: DaySchedule = {
          id: `day-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          title: `${dayOfWeek}, ${date}`,
          date,
          dayOfWeek,
          lessons: [],
          total: 0,
        };

        return {
          ...w,
          days: [...(w.days || []), newDay],
        };
      });

      return {
        ...month,
        weeks: updatedWeeks,
      };
    });

    showToast(`Dodano dzień «${dayOfWeek}, ${date}» do grafiku!`);
  };

  const handleDeleteDayFromWeek = (weekId: string, dayIdentifier: string) => {
    if (!isAuthenticated) {
      setIsLoginOpen(true);
      return;
    }

    updateActiveMonth((month) => {
      const updatedWeeks = month.weeks.map((w) => {
        if (w.id !== weekId) return w;

        let monday = w.monday;
        let friday = w.friday;
        let singleDay = w.singleDay;

        if (dayIdentifier === 'monday' || (w.monday && w.monday.id === dayIdentifier)) {
          monday = null;
        }
        if (dayIdentifier === 'friday' || (w.friday && w.friday.id === dayIdentifier)) {
          friday = null;
        }
        if (dayIdentifier === 'singleDay' || (w.singleDay && w.singleDay.id === dayIdentifier)) {
          singleDay = null;
        }

        const days = (w.days || []).filter(
          (d) => d.id !== dayIdentifier && d.dayOfWeek !== dayIdentifier
        );

        return {
          ...w,
          monday,
          friday,
          singleDay,
          days,
        };
      });

      return {
        ...month,
        weeks: updatedWeeks,
      };
    });

    showToast('Dzień został usunięty z grafiku.');
  };

  // Day Template copy & paste actions
  const handleCopyDayTemplate = (weekId: string, dayIdentifier: string) => {
    if (!activeMonth) return;
    const week = activeMonth.weeks.find((w) => w.id === weekId);
    if (!week) return;
    const targetDay = findDayInWeek(week, dayIdentifier);
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
    dayIdentifier: string,
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
        return updateDayInWeek(w, dayIdentifier, (targetDay) => {
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

          const finalLessons =
            mode === 'replace' ? newLessons : [...targetDay.lessons, ...newLessons];

          return {
            ...targetDay,
            lessons: finalLessons,
          };
        });
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

    const isPrivate = activeWorkspace === 'private';
    const templates = isPrivate ? undefined : data.defaultTemplates;
    const newMonth = generateNewMonth(monthName, year, templates, prefill && !isPrivate);

    if (isPrivate) {
      const currentList = data.privateMonths || [];
      const updatedMonths = [...currentList, newMonth];
      const updatedDb: WorkshopDatabase = {
        ...data,
        privateMonths: updatedMonths,
      };
      persistDatabase(updatedDb);
      setActiveMonthIdPrivate(newMonth.id);
      saveMonthToBackend(newMonth, updatedDb, 'private');
    } else {
      const updatedMonths = [...data.months, newMonth];
      const updatedDb: WorkshopDatabase = {
        ...data,
        months: updatedMonths,
      };
      persistDatabase(updatedDb);
      setActiveMonthIdJagodno(newMonth.id);
      saveMonthToBackend(newMonth, updatedDb, 'jagodno');
    }
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

    const isPrivate = activeWorkspace === 'private';
    const prevMonths = isPrivate ? (data.privateMonths || []) : data.months;
    const filteredMonths = prevMonths.filter((m) => m.id !== monthId);

    // If the active month is deleted, switch active month to adjacent or first available
    if (activeMonthId === monthId) {
      const deletedIndex = prevMonths.findIndex((m) => m.id === monthId);
      const newActive = filteredMonths[Math.max(0, deletedIndex - 1)] || filteredMonths[0];
      setActiveMonthId(newActive ? newActive.id : '');
    }

    const updatedDb: WorkshopDatabase = isPrivate
      ? { ...data, privateMonths: filteredMonths }
      : { ...data, months: filteredMonths };

    persistDatabase(updatedDb);
    setLastSaved(new Date().toLocaleTimeString('pl-PL'));
    setMonthToDelete(null);

    if (isBackendOnline) {
      try {
        await fetch(`/api/journal/month/${monthId}?workspace=${activeWorkspace}`, {
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

    if (activeWorkspace === 'private') {
      const freshPrivate = createEmptyPrivateMonths(data.months);
      const updatedDb: WorkshopDatabase = {
        ...data,
        privateMonths: freshPrivate
      };
      persistDatabase(updatedDb);
      setActiveMonthIdPrivate(freshPrivate[0]?.id || '');
      showToast('Wyczyszczono dane pracy prywatnej.');
    } else {
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
      const freshData = JSON.parse(JSON.stringify(initialDatabaseJson)) as WorkshopDatabase;
      const merged = ensureWorkspaces(freshData);
      persistDatabase(merged);
      if (merged.months?.length > 0) {
        setActiveMonthIdJagodno(merged.months[0].id);
      }
      showToast('Przywrócono domyślne dane Warsztatu na Jagodnie.');
    }
    setLastSaved(new Date().toLocaleTimeString('pl-PL'));
    setIsSaving(false);
  };

  const handleExportJson = () => {
    try {
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `dziennik_muzyczny_baza_${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      showToast('Kopia zapasowa bazy danych JSON została pobrana!');
    } catch (err) {
      console.error(err);
      showToast('Błąd pobierania kopii zapasowej.');
    }
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isAuthenticated) {
      setIsLoginOpen(true);
      return;
    }
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        if (parsed && Array.isArray(parsed.months) && parsed.months.length > 0) {
          persistDatabase(parsed);
          if (parsed.months[0]?.id) {
            setActiveMonthId(parsed.months[0].id);
          }
          showToast('Baza danych została pomyślnie zaimportowana i zsynchronizowana!');
        } else {
          showToast('Nieprawidłowy format pliku JSON.');
        }
      } catch (err) {
        console.error(err);
        showToast('Błąd odczytu pliku JSON.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
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
        workspace={activeWorkspace}
        onSelectWorkspace={handleSelectWorkspace}
        isAuthenticated={isAuthenticated}
        onOpenLogin={() => setIsLoginOpen(true)}
        onLogout={handleLogout}
        onOpenChangePassword={() => setIsChangePasswordOpen(true)}
        onOpenStats={() => setIsStatsOpen(true)}
        onExportExcel={() =>
          activeMonth &&
          exportMonthToExcel(
            activeMonth,
            activeWorkspace === 'private' ? 'Lekcje Prywatne' : data.schoolInfo.name,
            activeWorkspace
          )
        }
        onExportPdf={() =>
          activeMonth &&
          exportMonthToPdf(
            activeMonth,
            activeWorkspace === 'private' ? 'Lekcje Prywatne' : data.schoolInfo.name,
            activeWorkspace
          )
        }
        onExportJson={handleExportJson}
        onImportJson={handleImportJson}
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
              title={activeWorkspace === 'private' ? 'Wyczyść dane pracy prywatnej' : 'Przywróć dane z arkusza Excel'}
            >
              <RotateCcw className="w-3 h-3" />
              {activeWorkspace === 'private' ? 'Wyczyść dane prywatne' : 'Przywróć arkusz źródłowy'}
            </button>
          </div>
        )}

        {/* Month Selector & Monthly KPIs */}
        <MonthNavigation
          months={currentMonths}
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
                  monthName={activeMonth.name}
                  isAuthenticated={isAuthenticated}
                  isPrivateWorkspace={activeWorkspace === 'private'}
                  onAddDay={(weekId, dayOfWeek, date) =>
                    handleAddDayToWeek(weekId, dayOfWeek, date)
                  }
                  onDeleteDay={(weekId, dayIdentifier) =>
                    handleDeleteDayFromWeek(weekId, dayIdentifier)
                  }
                  onUpdateLesson={(dayIdentifier, lessonId, updates) =>
                    handleUpdateLesson(week.id, dayIdentifier, lessonId, updates)
                  }
                  onDeleteLesson={(dayIdentifier, lessonId) =>
                    handleDeleteLesson(week.id, dayIdentifier, lessonId)
                  }
                  onOpenAddLesson={(dayIdentifier, dayDate, dayOfWeek) =>
                    setAddLessonTarget({ weekId: week.id, dayKey: dayIdentifier, dayDate, dayOfWeek })
                  }
                  searchFilter={searchQuery}
                  copiedTemplate={copiedTemplate}
                  onCopyTemplate={(dayIdentifier) => handleCopyDayTemplate(week.id, dayIdentifier)}
                  onPasteTemplate={(dayIdentifier, mode) =>
                    handlePasteDayTemplate(week.id, dayIdentifier, mode)
                  }
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
            <div className={`w-5 h-5 rounded-md flex items-center justify-center text-white ${
              activeWorkspace === 'private' ? 'bg-purple-600' : 'bg-indigo-600'
            }`}>
              {activeWorkspace === 'private' ? <User className="w-3 h-3" /> : <Music className="w-3 h-3" />}
            </div>
            <span className={`font-semibold ${theme === 'light' ? 'text-slate-800' : 'text-slate-300'}`}>
              {activeWorkspace === 'private' ? 'Lekcje Prywatne' : 'Warsztat Muzyczny na Jagodnie'}
            </span>
            <span>{activeWorkspace === 'private' ? '• Zajęcia Indywidualne' : '• Wrocław Jagodno'}</span>
          </div>
          <p className={`${theme === 'light' ? 'text-slate-500' : 'text-slate-400'} text-[11px]`}>
            {activeWorkspace === 'private' 
              ? 'Lekcje prywatne — indywidualny grafik i rozliczenia' 
              : '30 min = 40 zł | 45 min = 60 zł | 60 min = 70 zł'}
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
