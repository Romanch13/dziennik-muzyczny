import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'workshop_data.json');
const INITIAL_DATA_FILE = path.join(__dirname, 'src', 'data', 'initialData.json');

app.use(express.json({ limit: '10mb' }));

// Active authenticated tokens (in-memory session map)
const validTokens = new Set<string>();

// Connected SSE clients for live real-time updates
const sseClients: Response[] = [];

function broadcastUpdate(type: string, data?: unknown) {
  const payload = JSON.stringify({ type, data, timestamp: new Date().toISOString() });
  for (let i = sseClients.length - 1; i >= 0; i--) {
    const res = sseClients[i];
    try {
      res.write(`data: ${payload}\n\n`);
    } catch {
      sseClients.splice(i, 1);
    }
  }
}

// Load data helper
function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(content);
    }
    if (fs.existsSync(INITIAL_DATA_FILE)) {
      const content = fs.readFileSync(INITIAL_DATA_FILE, 'utf-8');
      const data = JSON.parse(content);
      saveData(data);
      return data;
    }
  } catch (err) {
    console.error('Error reading data file:', err);
  }
  return null;
}

// Save data helper
function saveData(data: unknown) {
  try {
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error writing data file:', err);
    return false;
  }
}

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password.trim()).digest('hex');
}

// Auth middleware for write operations
function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.status(401).json({ error: 'Brak autoryzacji. Wymagane zalogowanie.' });
    return;
  }
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token || !validTokens.has(token)) {
    res.status(401).json({ error: 'Nieprawidłowa lub wygasła sesja.' });
    return;
  }
  next();
}

// --- API ROUTES ---

// 1. GET /api/journal (Public read-only for anyone!)
app.get('/api/journal', (_req: Request, res: Response) => {
  const data = loadData();
  if (!data) {
    res.status(500).json({ error: 'Nie udało się załadować danych dziennika.' });
    return;
  }
  // Sanitize password hash before sending to client
  const sanitized = {
    ...data,
    settings: {
      defaultPasswordHint: data.settings?.defaultPasswordHint || 'jagodno2026',
      lastModified: data.settings?.lastModified || new Date().toISOString()
    }
  };
  res.json(sanitized);
});

// 2. Real-time Server-Sent Events (SSE)
app.get('/api/journal/events', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  sseClients.push(res);
  res.write(`data: ${JSON.stringify({ type: 'connected', clientsCount: sseClients.length })}\n\n`);

  req.on('close', () => {
    const idx = sseClients.indexOf(res);
    if (idx !== -1) {
      sseClients.splice(idx, 1);
    }
  });
});

// 3. POST /api/auth/login
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { password } = req.body;
  if (!password) {
    res.status(400).json({ error: 'Podaj hasło.' });
    return;
  }

  const data = loadData();
  const currentHash = data?.settings?.passwordHash || hashPassword('jagodno2026');
  const inputHash = hashPassword(password);

  // STRICT CHECK: Only accept if input hash exactly matches current stored hash
  if (inputHash === currentHash) {
    const token = crypto.randomBytes(32).toString('hex');
    validTokens.add(token);
    res.json({
      success: true,
      token,
      message: 'Zalogowano pomyślnie. Tryb edycji jest aktywny.'
    });
  } else {
    res.status(401).json({ error: 'Nieprawidłowe hasło.' });
  }
});

// 4. GET /api/auth/status
app.get('/api/auth/status', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.json({ isAuthenticated: false });
    return;
  }
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  res.json({ isAuthenticated: validTokens.has(token) });
});

// 5. POST /api/auth/logout
app.post('/api/auth/logout', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    validTokens.delete(token);
  }
  res.json({ success: true, message: 'Wylogowano pomyślnie.' });
});

// 6. POST /api/journal/update (Protected write)
app.post('/api/journal/update', requireAuth, (req: Request, res: Response) => {
  const updatedData = req.body;
  if (!updatedData || !Array.isArray(updatedData.months)) {
    res.status(400).json({ error: 'Nieprawidłowy format danych.' });
    return;
  }

  const current = loadData() || {};
  const merged = {
    ...current,
    ...updatedData,
    settings: {
      ...current.settings,
      ...updatedData.settings,
      passwordHash: current.settings?.passwordHash || hashPassword('jagodno2026'),
      lastModified: new Date().toISOString()
    }
  };

  if (saveData(merged)) {
    broadcastUpdate('journal_updated', {
      lastModified: merged.settings.lastModified,
      monthCount: merged.months.length
    });
    res.json({ success: true, message: 'Dane zostały pomyślnie zapisane.' });
  } else {
    res.status(500).json({ error: 'Błąd podczas zapisywania danych.' });
  }
});

// 7. POST /api/journal/month/:id (Protected write for specific month)
app.post('/api/journal/month/:id', requireAuth, (req: Request, res: Response) => {
  const { id } = req.params;
  const monthData = req.body;
  if (!monthData) {
    res.status(400).json({ error: 'Brak danych miesiąca.' });
    return;
  }

  const current = loadData();
  if (!current || !Array.isArray(current.months)) {
    res.status(500).json({ error: 'Błąd bazy danych.' });
    return;
  }

  const index = current.months.findIndex((m: { id: string }) => m.id === id);
  if (index === -1) {
    current.months.push(monthData);
  } else {
    current.months[index] = monthData;
  }

  current.settings = {
    ...current.settings,
    lastModified: new Date().toISOString()
  };

  if (saveData(current)) {
    broadcastUpdate('month_updated', { monthId: id });
    res.json({ success: true, message: `Miesiąc ${id} zaktualizowany.` });
  } else {
    res.status(500).json({ error: 'Błąd zapisu miesiąca.' });
  }
});

// 7b. DELETE /api/journal/month/:id (Protected delete for specific month)
app.delete('/api/journal/month/:id', requireAuth, (req: Request, res: Response) => {
  const { id } = req.params;
  const current = loadData();
  if (!current || !Array.isArray(current.months)) {
    res.status(500).json({ error: 'Błąd bazy danych.' });
    return;
  }

  const index = current.months.findIndex((m: { id: string }) => m.id === id);
  if (index === -1) {
    res.status(404).json({ error: 'Nie znaleziono wskazanego miesiąca.' });
    return;
  }

  const removedMonth = current.months.splice(index, 1)[0];
  current.settings = {
    ...current.settings,
    lastModified: new Date().toISOString()
  };

  if (saveData(current)) {
    broadcastUpdate('journal_updated', {
      lastModified: current.settings.lastModified,
      monthCount: current.months.length,
      deletedMonthId: id
    });
    res.json({ 
      success: true, 
      message: `Miesiąc "${removedMonth.name}" został pomyślnie usunięty.`,
      deletedMonthId: id 
    });
  } else {
    res.status(500).json({ error: 'Błąd zapisu danych po usunięciu miesiąca.' });
  }
});

// 8. POST /api/settings/password (Change admin password)
app.post('/api/settings/password', requireAuth, (req: Request, res: Response) => {
  const { newPassword } = req.body;
  if (!newPassword || newPassword.trim().length < 4) {
    res.status(400).json({ error: 'Hasło musi zawierać co najmniej 4 znaki.' });
    return;
  }

  const data = loadData();
  if (!data) {
    res.status(500).json({ error: 'Błąd bazy danych.' });
    return;
  }

  data.settings = data.settings || {};
  // Save new hash
  data.settings.passwordHash = hashPassword(newPassword);
  data.settings.defaultPasswordHint = 'custom';
  data.settings.lastModified = new Date().toISOString();

  if (saveData(data)) {
    // Generate fresh token for active user
    const newToken = crypto.randomBytes(32).toString('hex');
    validTokens.add(newToken);
    res.json({ 
      success: true, 
      token: newToken,
      message: 'Hasło zostało pomyślnie zmienione. Poprzednie hasło jest już nieaktywne.' 
    });
  } else {
    res.status(500).json({ error: 'Błąd zapisu hasła.' });
  }
});

// 9. POST /api/journal/reset (Reset to initial excel data)
app.post('/api/journal/reset', requireAuth, (_req: Request, res: Response) => {
  try {
    if (fs.existsSync(INITIAL_DATA_FILE)) {
      const content = fs.readFileSync(INITIAL_DATA_FILE, 'utf-8');
      const initial = JSON.parse(content);
      saveData(initial);
      broadcastUpdate('journal_reset');
      res.json({ success: true, message: 'Przywrócono oryginalne dane z arkusza Excel.' });
      return;
    }
    res.status(404).json({ error: 'Brak pliku z danymi początkowymi.' });
  } catch (err) {
    console.error('Reset error:', err);
    res.status(500).json({ error: 'Nie udało się zresetować danych.' });
  }
});

// --- SERVER INITIALIZATION (Dev with Vite middlewares vs Production static) ---
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Warsztat Muzyczny Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
