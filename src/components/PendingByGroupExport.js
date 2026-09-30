import React, { useMemo, useState } from 'react';
import { formatCurrency, getPaymentYears } from '../utils/dateUtils';
import { buildPendingByGroupRows, sumPendingByGroupRows } from '../utils/pendingByGroup';
import { exportPendingByGroupToXLSX } from '../utils/exportXLSX';

const PendingByGroupExport = ({ members, payments, defaultYear }) => {
  const [open, setOpen] = useState(false);
  const [year, setYear] = useState(defaultYear || 'all');

  const yearOptions = useMemo(() => getPaymentYears(payments), [payments]);

  const rows = useMemo(
    () => buildPendingByGroupRows(payments, members, year),
    [payments, members, year]
  );
  const totals = useMemo(() => sumPendingByGroupRows(rows), [rows]);
  const yearLabel = year === 'all' ? 'Todos os anos' : year;

  const handleExport = () => {
    if (rows.length === 0) {
      alert('Nenhuma pendência encontrada para o período selecionado.');
      return;
    }
    exportPendingByGroupToXLSX(rows, yearLabel);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setYear(defaultYear || 'all');
          setOpen(true);
        }}
        className="btn btn-secondary"
      >
        Pendências por grupo
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Pendências por grupo</h2>
                <p className="text-sm text-gray-500">
                  Mesmo cálculo da query: cobrado, pago e o que ainda falta, por atleta e grupo.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-gray-500 hover:text-gray-800 text-xl leading-none px-2"
                aria-label="Fechar"
              >
                ×
              </button>
            </div>

            <div className="px-6 py-4 flex flex-wrap items-center gap-3 border-b border-gray-100">
              <label className="text-sm font-medium text-gray-700">Ano:</label>
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="all">Todos os anos</option>
                {yearOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <button type="button" onClick={handleExport} className="btn btn-primary ml-auto">
                Baixar Excel
              </button>
            </div>

            <div className="overflow-auto px-6 py-4">
              {rows.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-10">
                  Nenhuma pendência em {yearLabel}.
                </p>
              ) : (
                <table className="min-w-full text-sm">
                  <thead className="sticky top-0 bg-white">
                    <tr className="text-left text-gray-600 border-b border-gray-200">
                      <th className="py-2 pr-3 font-semibold">Atleta</th>
                      <th className="py-2 pr-3 font-semibold">Grupo</th>
                      <th className="py-2 pr-3 font-semibold text-right">Cobrado</th>
                      <th className="py-2 pr-3 font-semibold text-right">Pago</th>
                      <th className="py-2 font-semibold text-right">Pendente</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={`${row.memberId}-${row.grupo}`} className="border-b border-gray-100">
                        <td className="py-2 pr-3 text-gray-900">{row.atleta}</td>
                        <td className="py-2 pr-3 text-gray-700">{row.grupo}</td>
                        <td className="py-2 pr-3 text-right text-gray-700">{formatCurrency(row.cobrado)}</td>
                        <td className="py-2 pr-3 text-right text-green-700">{formatCurrency(row.pago)}</td>
                        <td className="py-2 text-right font-medium text-red-700">{formatCurrency(row.pendente)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="font-semibold text-gray-900">
                      <td className="py-3 pr-3">TOTAL</td>
                      <td className="py-3 pr-3 text-gray-500">{rows.length} linha(s)</td>
                      <td className="py-3 pr-3 text-right">{formatCurrency(totals.cobrado)}</td>
                      <td className="py-3 pr-3 text-right text-green-700">{formatCurrency(totals.pago)}</td>
                      <td className="py-3 text-right text-red-700">{formatCurrency(totals.pendente)}</td>
                    </tr>
                  </tfoot>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PendingByGroupExport;
