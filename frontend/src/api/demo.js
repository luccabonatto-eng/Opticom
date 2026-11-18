// Modo demonstração (build com VITE_DEMO=1): entra sem login e não conversa com o
// backend — nada chega ao banco. Usado só no link de prévia para mostrar telas.
const DEMO = import.meta.env.VITE_DEMO === '1';

const DEMO_USER = { id: 'demo', name: 'Demonstração', email: 'demo@opticom.local', role: 'ADMIN' };

const p = (id, sku, name, category, quantity, min_quantity, unit_cost, unit = 'un', description = '') => ({
  id,
  sku,
  name,
  category,
  quantity,
  min_quantity,
  unit_cost,
  unit,
  description,
});
const products = [
  p(1, 'CAB-DROP-1F', 'Cabo drop 1 fibra (bobina 1 km)', 'Cabos', 6, 2, 420, 'un', 'Almox. A — Prat. 1'),
  p(2, 'CON-SC-APC', 'Conector SC/APC fast', 'Conectores', 180, 50, 6.5, 'un', 'Almox. A — Gaveta 3'),
  p(3, 'CON-LC-UPC', 'Conector LC/UPC fast', 'Conectores', 40, 50, 7.2, 'un', 'Almox. A — Gaveta 3'),
  p(4, 'CTO-16', 'Caixa de terminação óptica 16 portas', 'Equipamentos', 9, 4, 310, 'un', 'Almox. B'),
  p(5, 'SPL-1X8', 'Splitter 1x8 conectorizado', 'Equipamentos', 22, 10, 58, 'un', 'Almox. B'),
  p(6, 'ABR-NYLON', 'Abraçadeira de nylon 200 mm (pct 100)', 'Outros', 15, 5, 12, 'cx', 'Almox. A — Prat. 2'),
  p(7, 'FITA-ISO', 'Fita isolante 20 m', 'Elétrico', 30, 10, 6, 'un', 'Almox. A — Prat. 2'),
  p(8, 'PTO-OPT', 'Ponto de terminação óptica (PTO)', 'Equipamentos', 35, 15, 18, 'un', 'Almox. B'),
];

const ok = (data) => ({ success: true, data });

const demoFetch = async (endpoint, options = {}) => {
  const method = (options.method || 'GET').toUpperCase();
  const path = endpoint.split('?')[0];
  const mov = path.match(/^\/products\/([^/]+)\/movements$/);

  if (mov && method === 'GET') return ok([]);
  if (mov && method === 'POST') {
    const prod = products.find((x) => String(x.id) === mov[1]);
    const { type, quantity, note } = JSON.parse(options.body || '{}');
    if (!prod) return { success: false, status: 404, error: 'Produto não encontrado' };
    if (type === 'OUT' && quantity > prod.quantity)
      return { success: false, status: 409, error: 'Estoque insuficiente' };
    prod.quantity += type === 'IN' ? quantity : -quantity;
    return ok({
      id: Date.now(),
      type,
      quantity,
      note,
      balance_after: prod.quantity,
      created_at: new Date().toISOString(),
      users: { name: DEMO_USER.name },
    });
  }
  if (path === '/products' && method === 'GET') return ok({ data: products, pagination: { total: products.length } });
  if (method === 'GET') return ok([]); // listas vazias: as telas aceitam r.data como array
  return { success: false, error: 'Modo demonstração: alterações não são salvas' };
};

export { DEMO, DEMO_USER, demoFetch };
