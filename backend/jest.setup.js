require('dotenv').config({ path: '.env.test' });

jest.setTimeout(30000);

// Os testes batiam no Supabase real: falhavam sem rede e o de auth chegava a
// criar usuário. Aqui o cliente é substituído por um encadeamento que devolve
// vazio. Cada teste que precisar de dados sobrescreve o que usa.
jest.mock('./config/supabase', () => {
  const naoAchou = { data: null, error: { code: 'PGRST116' } };
  // Cada teste define o que o "banco" devolve: __set({ rows, single })
  const estado = { rows: [], single: naoAchou };
  const chain = {
    __set: ({ rows, single }) => {
      estado.rows = rows !== undefined ? rows : [];
      estado.single = single !== undefined ? { data: single, error: null } : naoAchou;
    },
    __reset: () => { estado.rows = []; estado.single = naoAchou; },
    from: jest.fn(() => chain),
    select: jest.fn(() => chain),
    insert: jest.fn(() => chain),
    update: jest.fn(() => chain),
    upsert: jest.fn(() => chain),
    delete: jest.fn(() => chain),
    eq: jest.fn(() => chain),
    in: jest.fn(() => chain),
    gte: jest.fn(() => chain),
    lte: jest.fn(() => chain),
    order: jest.fn(() => chain),
    range: jest.fn(() => Promise.resolve({ data: estado.rows, error: null, count: estado.rows.length })),
    single: jest.fn(() => Promise.resolve(estado.single)),
    rpc: jest.fn(() => Promise.resolve({ data: 'SEQ-001', error: null })),
    then: (resolve) => resolve({ data: estado.rows, error: null, count: estado.rows.length }),
  };
  return chain;
});
