const express = require('express');
const supabase = require('../../config/supabase');
const checkRole = require('../middleware/rbac');

const router = express.Router();

const SERVICE_TYPES = ['Instalação', 'Manutenção', 'Revisão', 'Emergência', 'Contrato', 'Avulso'];
const TYPES = ['INCOME', 'EXPENSE'];
const STATUSES = ['PENDING', 'PARTIAL', 'PAID', 'RECEIVED', 'OVERDUE']; // espelha transactions_status_check
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

// Valida os campos presentes em `body`. Campos ausentes são ignorados, o que
// permite reusar a mesma função no POST (criação) e no PUT (atualização parcial).
const validateTransaction = body => {
  const { type, status, description, amount, amount_paid, due_date, paid_date, service_type } = body;

  if (type !== undefined && !TYPES.includes(type)) {
    return `type inválido. Use: ${TYPES.join(' ou ')}`;
  }
  if (status !== undefined && !STATUSES.includes(status)) {
    return `status inválido. Use: ${STATUSES.join(', ')}`;
  }
  if (description !== undefined) {
    if (typeof description !== 'string' || !description.trim()) return 'description não pode ser vazia';
    if (description.length > 500) return 'description excede 500 caracteres';
  }
  if (amount !== undefined) {
    if (!Number.isInteger(amount)) return 'amount deve ser inteiro em centavos';
    if (amount <= 0) return 'amount deve ser maior que zero';
  }
  if (amount_paid !== undefined) {
    if (!Number.isInteger(amount_paid)) return 'amount_paid deve ser inteiro em centavos';
    if (amount_paid < 0) return 'amount_paid não pode ser negativo';
  }
  if (due_date !== undefined && !ISO_DATE.test(due_date)) return 'due_date deve estar no formato AAAA-MM-DD';
  if (paid_date !== undefined && paid_date !== null && !ISO_DATE.test(paid_date)) {
    return 'paid_date deve estar no formato AAAA-MM-DD';
  }
  if (service_type !== undefined && service_type !== null && !SERVICE_TYPES.includes(service_type)) {
    return `service_type inválido. Use: ${SERVICE_TYPES.join(', ')}`;
  }
  return null;
};

router.get('/', async (req, res) => {
  try {
    const { type, status, category_id, customer_id, service_type } = req.query;
    const limit = Math.min(parseInt(req.query.limit) || 50, 1000);
    const offset = parseInt(req.query.offset) || 0;

    let query = supabase
      .from('transactions')
      .select('*, customers(id, name, type)', { count: 'exact' });

    if (type)        query = query.eq('type', type);
    if (status)      query = query.eq('status', status);
    if (category_id) query = query.eq('category_id', category_id);
    if (customer_id) query = query.eq('customer_id', customer_id);
    if (service_type) query = query.eq('service_type', service_type);

    const { data, error, count } = await query
      .order('due_date', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    res.json({
      data,
      pagination: { limit, offset, total: count }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/dre-gerencial', async (req, res) => {
  try {
    const { period, year, customer_id } = req.query;

    let query = supabase
      .from('transactions')
      .select('*, customers(id, name, type)')
      .in('status', ['PAID', 'PENDING']);

    if (period) {
      query = query.gte('due_date', `${period}-01`).lte('due_date', `${period}-31`);
    } else if (year) {
      query = query.gte('due_date', `${year}-01-01`).lte('due_date', `${year}-12-31`);
    }

    if (customer_id) {
      if (customer_id === '__sem_cliente__') {
        query = query.is('customer_id', null);
      } else {
        query = query.eq('customer_id', customer_id);
      }
    }

    const { data, error } = await query.order('due_date', { ascending: false });
    if (error) throw error;

    // Agrega por cliente
    const byCustomer = {};
    const byServiceType = {};

    data.forEach(tx => {
      const amount = tx.amount || 0;
      const isIncome = tx.type === 'INCOME';

      // Por cliente
      const custId = tx.customer_id || '__sem_cliente__';
      const custName = tx.customers?.name || (tx.customer_id ? 'Cliente #' + tx.customer_id.slice(0, 8) : 'Custos Gerais / Sem cliente');
      const custType = tx.customers?.type || (tx.customer_id ? 'PJ' : 'GERAL');

      if (!byCustomer[custId]) {
        byCustomer[custId] = {
          id: custId,
          name: custName,
          type: custType,
          income: 0,
          expense: 0,
          profit: 0,
          margin: 0,
          incomeCount: 0,
          expenseCount: 0,
          totalCount: 0
        };
      }
      if (isIncome) {
        byCustomer[custId].income += amount;
        byCustomer[custId].incomeCount += 1;
      } else {
        byCustomer[custId].expense += amount;
        byCustomer[custId].expenseCount += 1;
      }
      byCustomer[custId].totalCount += 1;
      byCustomer[custId].profit = byCustomer[custId].income - byCustomer[custId].expense;
      byCustomer[custId].margin = byCustomer[custId].income > 0
        ? Number(((byCustomer[custId].profit / byCustomer[custId].income) * 100).toFixed(1))
        : 0;

      // Por tipo de serviço
      const svcKey = tx.service_type || '__sem_tipo__';
      const svcLabel = tx.service_type || 'Sem tipo';
      if (!byServiceType[svcKey]) byServiceType[svcKey] = { type: svcLabel, income: 0, expense: 0, profit: 0, count: 0 };
      if (isIncome) byServiceType[svcKey].income += amount;
      else byServiceType[svcKey].expense += amount;
      byServiceType[svcKey].count += 1;
      byServiceType[svcKey].profit = byServiceType[svcKey].income - byServiceType[svcKey].expense;
    });

    const totalIncome  = data.filter(t => t.type === 'INCOME').reduce((s, t) => s + (t.amount || 0), 0);
    const totalExpense = data.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + (t.amount || 0), 0);
    const totalResult  = totalIncome - totalExpense;
    const totalMargin  = totalIncome > 0 ? Number(((totalResult / totalIncome) * 100).toFixed(1)) : 0;

    res.json({
      period: period || year || 'all',
      totals: { income: totalIncome, expense: totalExpense, result: totalResult, margin: totalMargin },
      byCustomer: Object.values(byCustomer).sort((a, b) => b.profit - a.profit),
      byServiceType: Object.values(byServiceType).sort((a, b) => b.income - a.income)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*, customers(id, name, type)')
      .eq('id', req.params.id)
      .single();

    if (error && error.code === 'PGRST116') {
      return res.status(404).json({ error: 'Transação não encontrada' });
    }
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Transação não encontrada' });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', checkRole('ADMIN', 'MANAGER'), async (req, res) => {
  try {
    const {
      type, status, description, amount, amount_paid, due_date, paid_date,
      category_id, bank_account_id, payment_method_id,
      customer_id, service_type, invoice_number
    } = req.body;

    if (!type || !description || !amount || !due_date) {
      return res.status(400).json({ error: 'Campos obrigatórios faltando' });
    }

    const invalid = validateTransaction(req.body);
    if (invalid) return res.status(400).json({ error: invalid });

    const record = {
      type,
      status: status || 'PENDING',
      description,
      amount,
      amount_paid:         amount_paid        || 0,
      due_date,
      paid_date:           paid_date          || null,
      category_id:        category_id        || null,
      bank_account_id:    bank_account_id    || null,
      payment_method_id:  payment_method_id  || null,
      customer_id:        customer_id        || null,
      service_type:       service_type       || null,
      invoice_number:     invoice_number     || null
    };

    const { data, error } = await supabase
      .from('transactions')
      .insert([record])
      .select('*, customers(id, name, type)');

    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', checkRole('ADMIN', 'MANAGER'), async (req, res) => {
  try {
    const invalid = validateTransaction(req.body);
    if (invalid) return res.status(400).json({ error: invalid });

    const allowedFields = {};
    const fieldMap = [
      'type', 'status', 'description', 'amount', 'amount_paid', 'due_date', 'paid_date',
      'category_id', 'bank_account_id', 'payment_method_id',
      'related_order_id', 'related_contract_id',
      'customer_id', 'service_type', 'invoice_number'
    ];

    fieldMap.forEach(field => {
      if (req.body.hasOwnProperty(field)) {
        allowedFields[field] = req.body[field];
      }
    });

    const { data, error } = await supabase
      .from('transactions')
      .update({ ...allowedFields, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select('*, customers(id, name, type)');

    if (error) throw error;
    if (!data?.length) return res.status(404).json({ error: 'Transação não encontrada' });
    res.json(data[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', checkRole('ADMIN', 'MANAGER'), async (req, res) => {
  try {
    const { data: existing } = await supabase
      .from('transactions')
      .select('id')
      .eq('id', req.params.id)
      .single();

    if (!existing) {
      return res.status(404).json({ error: 'Transação não encontrada' });
    }

    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ message: 'Transação deletada com sucesso' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
