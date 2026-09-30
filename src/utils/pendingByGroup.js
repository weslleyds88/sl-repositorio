const yearFromDueDate = (dueDate) => {
  if (!dueDate) return null;
  const value = String(dueDate);
  if (/^\d{4}-/.test(value)) {
    return parseInt(value.slice(0, 4), 10);
  }
  const parsed = new Date(dueDate);
  return Number.isNaN(parsed.getTime()) ? null : parsed.getFullYear();
};

const paidAmountOf = (payment) => {
  if (payment.status === 'paid') {
    return parseFloat(payment.amount || 0);
  }
  return parseFloat(payment.paid_amount || 0);
};

export const buildPendingByGroupRows = (payments = [], members = [], year = 'all') => {
  const memberMap = new Map(
    (members || []).map((member) => [
      member.id,
      member.full_name || member.name || 'Sem nome'
    ])
  );

  const grouped = new Map();

  (payments || []).forEach((payment) => {
    if (!payment.member_id) return;

    const paymentYear = yearFromDueDate(payment.due_date);
    if (year !== 'all' && paymentYear !== parseInt(year, 10)) return;

    const cobrado = parseFloat(payment.amount || 0);
    const pago = paidAmountOf(payment);
    const pendente = Math.max(cobrado - pago, 0);

    const groupName = payment.groupName || payment.user_groups?.name || 'Sem grupo';
    const athlete = memberMap.get(payment.member_id) || 'Atleta não encontrado';
    const key = `${payment.member_id}::${groupName}`;

    const current = grouped.get(key) || {
      memberId: payment.member_id,
      atleta: athlete,
      grupo: groupName,
      cobrado: 0,
      pago: 0,
      pendente: 0
    };

    current.cobrado += cobrado;
    current.pago += pago;
    current.pendente += pendente;
    grouped.set(key, current);
  });

  return Array.from(grouped.values())
    .filter((row) => row.pendente > 0.009)
    .map((row) => ({
      ...row,
      cobrado: Math.round(row.cobrado * 100) / 100,
      pago: Math.round(row.pago * 100) / 100,
      pendente: Math.round(row.pendente * 100) / 100
    }))
    .sort((a, b) => {
      const byName = a.atleta.localeCompare(b.atleta, 'pt-BR');
      if (byName !== 0) return byName;
      return a.grupo.localeCompare(b.grupo, 'pt-BR');
    });
};

export const sumPendingByGroupRows = (rows = []) =>
  rows.reduce(
    (acc, row) => ({
      cobrado: acc.cobrado + row.cobrado,
      pago: acc.pago + row.pago,
      pendente: acc.pendente + row.pendente
    }),
    { cobrado: 0, pago: 0, pendente: 0 }
  );
