const SlaTab = ({ saveSla, setSla, sla }) => (
  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5">
    <div>
      <h3 className="text-base font-semibold text-gray-800">Configuração de SLA</h3>
      <p className="text-xs text-gray-400 mt-0.5">Tempo máximo de atendimento por prioridade</p>
    </div>
    <div className="space-y-4">
      {[
        ['urgent', 'Urgente', 'Falha crítica em andamento'],
        ['high', 'Alta', 'Impacto operacional significativo'],
        ['medium', 'Média', 'Degradação parcial do serviço'],
        ['low', 'Baixa', 'Solicitação de melhoria'],
      ].map(([k, l, sub]) => (
        <div key={k} className="flex items-center gap-4">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-800">{l}</p>
            <p className="text-xs text-gray-400">{sub}</p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={sla[k]}
              onChange={(e) => setSla((p) => ({ ...p, [k]: parseInt(e.target.value) || 0 }))}
              className="w-20 border border-gray-300 rounded-lg px-3 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-500">horas</span>
          </div>
        </div>
      ))}
    </div>
    <div className="flex justify-end pt-2 border-t border-gray-100">
      <button
        onClick={saveSla}
        className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
      >
        Salvar SLAs
      </button>
    </div>
  </div>
);

export { SlaTab };
