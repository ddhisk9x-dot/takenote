import { AppEvent, Student, TimetableRow } from './types';

declare global {
  interface Window { [key: string]: any; }
}

export const normalizeAppsScriptUrl = (input: string): string => {
  const s = (input || '').trim();
  if (!s) return '';
  // Ensure ends with /exec (common GAS webapp endpoint)
  if (s.includes('/exec')) return s;
  if (s.endsWith('/')) return s + 'exec';
  return s + '/exec';
};

const jsonpGet = async <T,>(baseUrl: string, params: Record<string, string>): Promise<T> => {
  const url = new URL(baseUrl);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const cb = `__tna_cb_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
  // Some school networks / browser extensions may slow down loading remote scripts.
  // Give more time to avoid false errors.
  const timeoutMs = 30000;

  return new Promise<T>((resolve, reject) => {
    let timer: any = null;
    const cleanup = () => {
      try { delete (window as any)[cb]; } catch {}
      if (script && script.parentNode) script.parentNode.removeChild(script);
      if (timer) clearTimeout(timer);
    };

    (window as any)[cb] = (data: any) => {
      cleanup();
      resolve(data as T);
    };

    const script = document.createElement('script');
    url.searchParams.set('callback', cb);
    script.src = url.toString();
    script.async = true;
    // Reduce chance of strict referrer policies causing odd blocks
    (script as any).referrerPolicy = 'no-referrer';
    script.onerror = () => {
      cleanup();
      reject(new Error('Không tải được Apps Script (lỗi mạng hoặc link sai). URL: ' + script.src));
    };

    timer = setTimeout(() => {
      cleanup();
      reject(new Error('Apps Script phản hồi quá lâu. Vui lòng thử lại.'));
    }, timeoutMs);

    document.body.appendChild(script);
  });
};

// POST without CORS (we don't read response; GAS webapp doesn't support CORS preflight well).
// Use Content-Type text/plain to avoid preflight.
const postNoCors = async (baseUrl: string, body: any): Promise<void> => {
  await fetch(baseUrl, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
    body: JSON.stringify(body),
  });
};

export const apiPing = async (baseUrl: string, token?: string) => {
  const params: Record<string, string> = { action: 'ping' };
  if (token) params.token = token;
  return jsonpGet<{ ok: boolean; version?: string; now?: string; error?: string }>(baseUrl, params);
};

export const apiGetStudents = async (baseUrl: string, token?: string): Promise<Student[]> => {
  const params: Record<string, string> = { action: 'getStudents' };
  if (token) params.token = token;
  const res = await jsonpGet<{ ok: boolean; students?: Student[]; error?: string }>(baseUrl, params);
  if (!res.ok) throw new Error(res.error || 'Không lấy được danh sách học sinh');
  return res.students || [];
};

export const apiGetTimetable = async (baseUrl: string, token?: string): Promise<TimetableRow[]> => {
  const params: Record<string, string> = { action: 'getTimetable' };
  if (token) params.token = token;
  const res = await jsonpGet<{ ok: boolean; timetable?: TimetableRow[]; error?: string }>(baseUrl, params);
  if (!res.ok) throw new Error(res.error || 'Không lấy được thời khóa biểu');
  return res.timetable || [];
};

export const apiAppendEvents = async (baseUrl: string, events: AppEvent[], token?: string): Promise<void> => {
  if (!events.length) return;
  await postNoCors(baseUrl, { action: 'appendEvents', token: token || '', events });
};

export const apiSoftDeleteEvents = async (baseUrl: string, eventIds: string[], token?: string): Promise<void> => {
  if (!eventIds.length) return;
  await postNoCors(baseUrl, { action: 'softDeleteEvents', token: token || '', event_ids: eventIds });
};

export const apiReplaceTimetable = async (baseUrl: string, rows: TimetableRow[], token?: string): Promise<void> => {
  await postNoCors(baseUrl, { action: 'replaceTimetable', token: token || '', rows });
};

export const apiReplaceStudents = async (baseUrl: string, rows: Student[], token?: string): Promise<void> => {
  await postNoCors(baseUrl, { action: 'replaceStudents', token: token || '', rows });
};
