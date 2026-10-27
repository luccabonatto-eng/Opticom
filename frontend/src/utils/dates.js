const hojeISO = () => new Date().toISOString().split('T')[0];

const addMeses = (iso, n) => {
  const [a, m, d] = iso.split('-').map(Number);
  const alvo = new Date(a, m - 1 + n, 1);
  const ultimo = new Date(alvo.getFullYear(), alvo.getMonth() + 1, 0).getDate();
  alvo.setDate(Math.min(d, ultimo));
  return `${alvo.getFullYear()}-${String(alvo.getMonth() + 1).padStart(2, '0')}-${String(alvo.getDate()).padStart(2, '0')}`;
};

export { hojeISO, addMeses };
