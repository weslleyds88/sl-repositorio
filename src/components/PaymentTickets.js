import React, { useState, useEffect, useCallback } from 'react';

const PaymentTickets = ({ supabase, currentUser, isAdmin = false }) => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showImage, setShowImage] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const loadTickets = useCallback(async () => {
    try {
      setLoading(true);
      
      if (isAdmin) {
        // Admin vê todos os tickets
        const { data, error } = await supabase.rpc('get_all_tickets');
        if (error) throw error;
        setTickets(data || []);
      } else {
        // Usuário vê apenas seus tickets
        const { data, error } = await supabase.rpc('get_user_tickets', {
          p_user_id: currentUser.id
        });
        if (error) throw error;
        setTickets(data || []);
      }
    } catch (error) {
      console.error('Erro ao carregar tickets:', error);
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }, [supabase, currentUser, isAdmin]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const getDaysRemaining = (days) => {
    if (days < 0) return { text: 'Expirado', color: 'text-red-600' };
    if (days === 0) return { text: 'Expira hoje', color: 'text-orange-600' };
    if (days <= 3) return { text: `${days} dias restantes`, color: 'text-yellow-600' };
    return { text: `${days} dias restantes`, color: 'text-green-600' };
  };

  const handleViewProof = (ticket) => {
    setSelectedTicket(ticket);
    setShowImage(true);
  };

  const handleCloseImage = () => {
    setShowImage(false);
    setSelectedTicket(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Filtrar tickets por termo de busca (apenas para admin)
  const filteredTickets = isAdmin 
    ? tickets.filter(ticket => 
        ticket.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (ticket.user_email && ticket.user_email.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : tickets;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">
          {isAdmin ? '📋 Todos os Tickets' : '🎫 Meus Tickets'}
        </h2>
        <button
          onClick={loadTickets}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm"
        >
          🔄 Atualizar
        </button>
      </div>

      {/* Filtro por Atleta - Apenas para Admin */}
      {isAdmin && (
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Buscar atleta por nome ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}

      {filteredTickets.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🎫</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhum ticket encontrado
          </h3>
          <p className="text-gray-600">
            {isAdmin 
              ? (searchTerm ? 'Nenhum atleta encontrado com esse nome' : 'Não há tickets de pagamento aprovados')
              : 'Você ainda não tem tickets de pagamento aprovados'
            }
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredTickets.map((ticket) => {
            const daysInfo = getDaysRemaining(ticket.days_remaining);
            
            return (
              <div key={ticket.ticket_id} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {ticket.user_name}
                    </h3>
                    {isAdmin && ticket.user_email && (
                      <p className="text-sm text-gray-600">{ticket.user_email}</p>
                    )}
                    {ticket.group_name && (
                      <p className="text-sm text-blue-600 font-medium">
                        📋 {ticket.category} - Grupo: {ticket.group_name}
                      </p>
                    )}
                    {ticket.payment_status && (
                      <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold ${
                        ticket.payment_status === 'Completo' 
                          ? 'bg-green-100 text-green-800 border border-green-300' 
                          : 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                      }`}>
                        {ticket.payment_status === 'Completo' ? '✓ PAGAMENTO COMPLETO' : '⏳ PAGAMENTO PARCIAL'}
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">
                      R$ {ticket.amount.toFixed(2)}
                    </div>
                    <div className={`text-sm ${daysInfo.color}`}>
                      {daysInfo.text}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <label className="text-xs text-gray-500">Categoria</label>
                    <p className="font-medium">{ticket.category}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Método</label>
                    <p className="font-medium">{ticket.payment_method || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Aprovado em</label>
                    <p className="font-medium">{formatDate(ticket.approved_at)}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Expira em</label>
                    <p className="font-medium">{formatDate(ticket.expires_at)}</p>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-600">
                    ID: {ticket.ticket_id.slice(0, 8)}...
                  </div>
                  <div className="flex flex-wrap gap-2 justify-end">
                    {(() => {
                      try {
                        const proofs = JSON.parse(ticket.proof_image_base64);
                        if (Array.isArray(proofs) && proofs.length > 1) {
                          // Múltiplos comprovantes - botões separados
                          return proofs.map((proof, index) => (
                            <button
                              key={index}
                              onClick={() => {
                                setSelectedTicket({...ticket, singleProof: proof, proofIndex: index + 1});
                                setShowImage(true);
                              }}
                              className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1 rounded text-sm"
                            >
                              📎 Comprovante {index + 1}
                            </button>
                          ));
                        }
                      } catch (e) {
                        // Não é JSON, é comprovante único
                      }
                      // Comprovante único
                      return (
                        <button
                          onClick={() => handleViewProof(ticket)}
                          className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1 rounded text-sm"
                        >
                          📎 Ver Comprovante
                        </button>
                      );
                    })()}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal para visualizar comprovante */}
      {showImage && selectedTicket && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {selectedTicket.singleProof ? 
                  `Comprovante ${selectedTicket.proofIndex} - ${selectedTicket.user_name}` : 
                  `Comprovante - ${selectedTicket.user_name}`
                }
              </h3>
              <button
                onClick={handleCloseImage}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="text-center">
              {selectedTicket.singleProof ? (
                // Exibir comprovante individual
                <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                  <div className="mb-3 text-left">
                    <p className="text-sm text-gray-600">
                      <strong>Valor:</strong> R$ {selectedTicket.singleProof.amount?.toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>Método:</strong> {selectedTicket.singleProof.method}
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>Data:</strong> {new Date(selectedTicket.singleProof.date).toLocaleString('pt-BR')}
                    </p>
                  </div>
                  <img
                    src={selectedTicket.singleProof.image}
                    alt={`Comprovante ${selectedTicket.proofIndex}`}
                    className="max-w-full max-h-96 mx-auto border border-gray-200 rounded"
                  />
                </div>
              ) : selectedTicket.proof_image_base64 ? (
                // Comprovante único (não múltiplo)
                <img
                  src={selectedTicket.proof_image_base64}
                  alt="Comprovante"
                  className="max-w-full max-h-96 mx-auto border border-gray-200 rounded"
                />
              ) : (
                <div className="py-12">
                  <div className="text-6xl mb-4">📄</div>
                  <p className="text-gray-600">Comprovante não disponível</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentTickets;
