import React from 'react';
import { formatCurrency, formatDate } from '../utils/dateUtils';

const SelectPaymentModal = ({ payments, onSelect, onClose }) => {
  // Filtrar apenas pagamentos pendentes ou parciais
  const pendingPayments = payments.filter(p => p.status === 'pending' || p.status === 'partial');

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-6 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-900">
            Selecione o Pagamento
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p className="text-gray-600 mb-4">
          Escolha qual cobrança você deseja pagar:
        </p>

        <div className="space-y-3 max-h-96 overflow-y-auto">
          {pendingPayments.map((payment) => (
            <div
              key={payment.id}
              onClick={() => onSelect(payment)}
              className="border border-gray-200 rounded-lg p-4 hover:bg-blue-50 hover:border-blue-300 cursor-pointer transition-all duration-200"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h4 className="font-semibold text-gray-900">
                      {payment.category}
                    </h4>
                    {payment.status === 'partial' && (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                        Parcial
                      </span>
                    )}
                  </div>
                  
                  <div className="text-sm text-gray-600 space-y-2">
                    <p>
                      <strong>Valor Total:</strong> {formatCurrency(parseFloat(payment.amount))}
                    </p>
                    
                    {payment.paid_amount && parseFloat(payment.paid_amount) > 0 ? (
                      <>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-green-600 font-semibold">
                              {formatCurrency(parseFloat(payment.paid_amount))}
                            </span>
                            <span className="text-gray-400">/</span>
                            <span className="text-gray-900 font-semibold">
                              {formatCurrency(parseFloat(payment.amount))}
                            </span>
                          </div>
                          
                          {/* Barra de Progresso */}
                          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-300"
                              style={{
                                width: `${(parseFloat(payment.paid_amount) / parseFloat(payment.amount)) * 100}%`
                              }}
                            ></div>
                          </div>
                          
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-green-600">
                              ✓ Pago: {formatCurrency(parseFloat(payment.paid_amount))}
                            </span>
                            <span className="text-red-600">
                              Falta: {formatCurrency(parseFloat(payment.amount) - parseFloat(payment.paid_amount))}
                            </span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <p className="text-gray-500 italic">
                        Nenhum valor pago ainda
                      </p>
                    )}
                    
                    <p>
                      <strong>Vencimento:</strong> {formatDate(payment.due_date)}
                    </p>
                    
                    {payment.observation && (
                      <p className="text-xs text-gray-500">
                        {payment.observation}
                      </p>
                    )}

                    {payment.pix_key && (
                      <div className="mt-2 p-2 bg-gray-50 rounded">
                        <p className="text-xs font-semibold text-gray-700">💰 Dados PIX:</p>
                        <p className="text-xs text-gray-600">
                          <strong>Chave:</strong> {payment.pix_key}
                        </p>
                        {payment.pix_name && (
                          <p className="text-xs text-gray-600">
                            <strong>Nome:</strong> {payment.pix_name}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="ml-4">
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                    Pagar →
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {pendingPayments.length === 0 && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum pagamento pendente</h3>
            <p className="mt-1 text-sm text-gray-500">Você está em dia! 🎉</p>
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

export default SelectPaymentModal;

