import { Icon } from '../../components/Icon.jsx';
import { KPI } from '../../components/KPI.jsx';
import { api } from '../../api/client.js';
import { useEffect, useState } from 'react';

const AuditPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [moduleF, setModuleF] = useState('all');
  const [userF, setUserF] = useState('all');
  const [q, setQ] = useState('');

  useEffect(() => {
    api.getAuditLogs({ limit: 200 }).then((r) => {
      if (r.success) setLogs(Array.isArray(r.data) ? r.data : r.data?.data || []);
      setLoading(false);
    });
  }, []);

  const fmtLog = (iso) =>
    iso
      ? new Date(iso).toLocaleString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : '—';
  const today = new Date().toLocaleDateString('pt-BR');

  const modules = ['all', ...new Set(logs.map((a) => a.module))];
  const userNames = ['all', ...new Set(logs.map((a) => a.user_name || a.user_id || '?'))];

  const filtered = logs.filter(
    (a) =>
      (moduleF === 'all' || a.module === moduleF) &&
      (userF === 'all' || (a.user_name || a.user_id) === userF) &&
      (!q ||
        (a.action || '').toLowerCase().includes(q.toLowerCase()) ||
        (a.detail || '').toLowerCase().includes(q.toLowerCase())),
  );

  const moduleColors = {
    OS: 'bg-blue-50 text-blue-700',
    Financeiro: 'bg-green-50 text-green-700',
    Contratos: 'bg-purple-50 text-purple-700',
    Clientes: 'bg-orange-50 text-orange-700',
    Estoque: 'bg-amber-50 text-amber-700',
    Sistema: 'bg-gray-100 text-gray-600',
    Técnicos: 'bg-teal-50 text-teal-700',
    Frota: 'bg-cyan-50 text-cyan-700',
    Usuários: 'bg-violet-50 text-violet-700',
  };

  const todayCount = logs.filter(
    (a) => a.created_at && new Date(a.created_at).toLocaleDateString('pt-BR') === today,
  ).length;

  return (
    <div className="p-5 space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <KPI title="Eventos Hoje" value={loading ? '…' : todayCount} sub={today} icon="audit" color="blue" />
        <KPI
          title="Usuários Ativos"
          value={loading ? '…' : new Set(logs.map((a) => a.user_id)).size}
          sub="neste período"
          icon="technicians"
          color="green"
        />
        <KPI
          title="Módulos Usados"
          value={loading ? '…' : new Set(logs.map((a) => a.module)).size}
          sub="áreas acessadas"
          icon="dashboard"
          color="purple"
        />
      </div>
      <div className="flex items-center gap-3">
        <div className="relative">
          <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar ação ou detalhe..."
            className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg w-72 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={moduleF}
          onChange={(e) => setModuleF(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
        >
          {modules.map((m) => (
            <option key={m} value={m}>
              {m === 'all' ? 'Todos os módulos' : m}
            </option>
          ))}
        </select>
        <select
          value={userF}
          onChange={(e) => setUserF(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
        >
          {userNames.map((u) => (
            <option key={u} value={u}>
              {u === 'all' ? 'Todos os usuários' : u}
            </option>
          ))}
        </select>
        <span className="ml-auto text-xs text-gray-400">{filtered.length} eventos</span>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {['Data/Hora', 'Módulo', 'Ação', 'Detalhe'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading && (
              <tr>
                <td colSpan="4" className="px-4 py-10 text-center text-sm text-gray-400">
                  Carregando…
                </td>
              </tr>
            )}
            {!loading &&
              filtered.map((a) => (
                <tr key={a.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-xs text-gray-500 font-mono whitespace-nowrap">
                    {fmtLog(a.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${moduleColors[a.module] || 'bg-gray-100 text-gray-600'}`}
                    >
                      {a.module}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700 font-medium">{a.action}</td>
                  <td className="px-4 py-3 text-xs text-gray-500 max-w-xs truncate" title={a.detail}>
                    {a.detail}
                  </td>
                </tr>
              ))}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan="4" className="px-4 py-10 text-center text-sm text-gray-400">
                  Nenhum evento registrado ainda. Ações no sistema serão listadas aqui.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export { AuditPage };
