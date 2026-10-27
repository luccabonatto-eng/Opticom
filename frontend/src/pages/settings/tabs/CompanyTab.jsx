const CompanyTab = ({ company, saveCompany, setCompany }) => (
  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5">
    <div className="flex items-start justify-between">
      <div>
        <h3 className="text-base font-semibold text-gray-800">Dados da Empresa</h3>
        <p className="text-xs text-gray-400 mt-0.5">Informações gerais da organização</p>
      </div>
      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
        Plano {company.plan}
      </span>
    </div>
    <div className="grid grid-cols-2 gap-4">
      {[
        { label: 'Nome / Razão Social', key: 'name' },
        { label: 'CNPJ', key: 'cnpj' },
        { label: 'E-mail', key: 'email' },
        { label: 'Telefone', key: 'phone' },
        { label: 'Endereço', key: 'address' },
        { label: 'Cidade / Estado', key: 'city' },
        { label: 'CEP', key: 'cep' },
      ].map((f) => (
        <div key={f.key} className={f.key === 'address' ? 'col-span-2' : ''}>
          <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
          <input
            value={company[f.key]}
            onChange={(e) => setCompany((p) => ({ ...p, [f.key]: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      ))}
    </div>
    <div className="flex justify-end pt-2 border-t border-gray-100">
      <button
        onClick={saveCompany}
        className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
      >
        Salvar Alterações
      </button>
    </div>
  </div>
);

export { CompanyTab };
