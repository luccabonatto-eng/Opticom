import { useEffect, useRef, useState } from 'react';
import { api } from '../../../api/client.js';
// No optimistic UI: successful persistence is the only source of "saved" state.
export function useFinancialSetting(key, initial) {
  const [state, setState] = useState({ data: initial, raw: null, ready: false, error: '' });
  const [busy, setBusy] = useState(false);
  const [revision, setRevision] = useState(0);
  const locked = useRef(false);
  useEffect(() => {
    let active = true;
    setState({ data: initial, raw: null, ready: false, error: '' });
    if (!key) return;
    api.getSetting(key).then(r => {
      if (!active) return;
      try {
        if (!r.success && r.status !== 404) throw new Error(r.error);
        const raw = r.success ? r.data?.value ?? null : null;
        const data = raw ? JSON.parse(raw) : initial;
        if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Dados salvos inválidos');
        setState({ data, raw, ready: true, error: '' });
      } catch (e) { setState({ data: initial, raw: null, ready: false, error: e.message }); }
    });
    return () => { active = false; };
  }, [key, revision]);
  const save = async data => {
    if (!state.ready || locked.current) return false;
    locked.current = true; setBusy(true);
    const raw = JSON.stringify(data);
    const r = await api.setSetting(key, raw, state.raw);
    if (r.success) setState({ data, raw, ready: true, error: '' });
    else setState(s => ({ ...s, error: r.error, ready: r.status === 409 ? false : s.ready }));
    locked.current = false; setBusy(false);
    return r.success;
  };
  return { ...state, busy, save, reload: () => setRevision(r=>r+1) };
}
